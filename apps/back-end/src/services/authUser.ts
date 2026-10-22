import { APIError, GenericEndpointContext, User, getCurrentAdapter } from "better-auth";
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { tryGetCurrentAuthEndpointContext } from "@better-auth/core/context";
import { Validation } from "../validation";
import { signUpToMarketing } from "../clients/buttondown.client";
import { getUserById, migrateGuestUserMap, toUserRow, trackUserEvent } from "../queries/query";
import { Event } from "../instrument";
import { APP_USER_MODEL } from "../utils/appUserPlugin";
import { sendRegisteredEmail } from "../emails/email";

// Our registration form signs up through this endpoint, sending the details we
// keep on our own `user` table alongside Better Auth's name, email and password
const SIGN_UP_EMAIL_PATH = "/sign-up/email";
// The emailOTP plugin's endpoint path to change an email
const CHANGE_EMAIL_PATH = "/email-otp/change-email";
// The emailOTP plugin's endpoint that sends a code to the new address
const REQUEST_EMAIL_CHANGE_PATH = "/email-otp/request-email-change";

const NEW_SIGN_UP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * This runs inside BetterAuths sign up transaction, before auth_user is created. The
 * new auth_user is created already linked to our app User.
 *
 * The app user is written through Better Auth's adapter for the current transaction
 * (see utils/appUserPlugin.ts), so if the sign-up fails it rolls back along with auth_user.
 * @param user the user
 * @param ctx the request context
 */
export async function preRegistrationFlow(user: User & Record<string, unknown>, ctx: GenericEndpointContext | null) {
  if (ctx?.path !== SIGN_UP_EMAIL_PATH) return;
  // our validation and toUserRow call the email "username"
  const registration = { ...ctx.body, username: user.email };

  const validation = new Validation();
  await validation.validateUserRegister(registration);
  if (validation.fail()) {
    throw new APIError("BAD_REQUEST", {
      message: "Please check the highlighted fields.",
      code: "INVALID_REGISTRATION",
      errors: validation.errors,
    });
  }

  // This creates the user in our User table with all the additional fields
  const adapter = await getCurrentAdapter(ctx.context.adapter);
  const appUser = await adapter.create<User & Record<string, unknown>, { id: string }>({
    model: APP_USER_MODEL,
    data: toUserRow(registration),
  });
  return { data: { ...user, appUserId: Number(appUser.id) } };
}

/**
 * This runs after Betterauth's sign up transaction has committed, so auth_user exists.
 * Therefor failures here are logged rather than failing a registration that has already succeeded
 * @param user the user
 * @param ctx the request context
 */
export async function postRegistrationFlow(user: User & Record<string, unknown>, ctx: GenericEndpointContext | null) {
  if (ctx?.path !== SIGN_UP_EMAIL_PATH || !user.appUserId) return;

  // here rather than before the transaction, so a failed sign-up isn't subscribed
  signUpToMarketing(ctx.body.marketing, user.email);

  try {
    const appUser = await getUserById(Number(user.appUserId));
    const mapsCount = await migrateGuestUserMap(appUser);

    trackUserEvent(crypto.randomUUID(), appUser.id, Event.USER.REGISTER, {
      sharedMaps: mapsCount > 0,
    });

    // success email is sent after email verification, in postEmailVerificationFlow
  } catch (error) {
    console.error("Post-registration steps failed for", user.email, error);
  }
}

/**
 * Checks an address someone wants to change their email to, throwing if it's
 * invalid, too long or another account already uses it. The code covers all
 * of those, and the message says which, so the form can show it as it is.
 * @param newEmail the address to change to
 */
async function assertValidNewEmail(newEmail: unknown) {
  // our validation calls the email "username"
  const validation = new Validation();
  await validation.validateChangeEmail({ username: newEmail });
  if (validation.fail()) {
    throw new APIError("BAD_REQUEST", {
      message: validation.errors.username?.[0] ?? "Please provide a valid email.",
      code: "INVALID_NEW_EMAIL",
      errors: validation.errors,
    });
  }
}

/**
 * Runs before Better Auth's endpoints. Before a code is sent to change someone's email,
 * checks the password the change-email form sends alongside the new address, so
 * someone using a signed-in device can't take over the account. The emailOTP plugin
 * has no option for this.
 */
export const confirmPasswordForEmailChange = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== REQUEST_EMAIL_CHANGE_PATH) return;
  // without a session the endpoint itself refuses the request
  const session = await getSessionFromCtx(ctx);
  if (!session) return;

  const password = ctx.body?.password;
  const account = await ctx.context.internalAdapter.findCredentialAccount(session.user.id);
  const isValid =
    typeof password === "string" &&
    !!account?.password &&
    (await ctx.context.password.verify({ hash: account.password, password }));
  if (!isValid) {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid password",
      code: "INVALID_PASSWORD",
    });
  }

  // After the password check, so only the account owner can find out whether
  // another account uses an address
  await assertValidNewEmail(ctx.body?.newEmail);
});

/**
 * Runs before Better Auth updates an auth_user. When a user changes their email,
 * updates the username on our User table to match, as that's their email there.
 *
 * @param data the auth_user fields being changed
 * @param ctx the request context
 */
export async function preEmailChangeFlow(data: Partial<User> & Record<string, unknown>, ctx: GenericEndpointContext | null) {
  if (ctx?.path !== CHANGE_EMAIL_PATH || !data.email) return;
  // checked again here in case another account took the address after the code was sent
  await assertValidNewEmail(data.email);

  const appUserId = (ctx.context.session?.user as Record<string, unknown> | undefined)?.appUserId;
  if (!appUserId) return;

  const adapter = await getCurrentAdapter(ctx.context.adapter);
  await adapter.update({
    model: APP_USER_MODEL,
    where: [{ field: "id", value: Number(appUserId) }],
    update: { username: data.email },
  });
}

/**
 * Runs after a user verifies their email. Sends new sign-ups the "successfully
 * registered" email, which the old registration route sent straight away.
 * @param user the user, now verified
 */
export async function postEmailVerificationFlow(user: User & Record<string, unknown>) {
  // The emailOTP plugin's change-email endpoint also counts as verifying an email, as
  // the user has typed in a code sent to the new address
  if (tryGetCurrentAuthEndpointContext()?.path === CHANGE_EMAIL_PATH) return;
  if (!user.appUserId) return;
  // Migrated users are verified too, but their createdAt is when they first
  // registered on the old system, so this stops them getting a welcome email.
  // A week leaves room for a new user to request another link before verifying.
  if (Date.now() - new Date(user.createdAt).getTime() > NEW_SIGN_UP_WINDOW_MS) return;

  try {
    const appUser = await getUserById(Number(user.appUserId));
    sendRegisteredEmail(
      user.email,
      appUser.first_name,
      `${process.env.BETTER_AUTH_URL}/app`,
    );
  } catch (error) {
    console.error("Post-verification steps failed for", user.email, error);
  }
}
