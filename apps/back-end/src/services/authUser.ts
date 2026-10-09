import { APIError, GenericEndpointContext, User, getCurrentAdapter } from "better-auth";
import { Validation } from "../validation";
import { signUpToMarketing } from "../clients/buttondown.client";
import { getUserById, migrateGuestUserMap, toUserRow, trackUserEvent } from "../queries/query";
import { Event } from "../instrument";
import { APP_USER_MODEL } from "../utils/appUserPlugin";

// Our registration form signs up through this endpoint, sending the details we
// keep on our own `user` table alongside Better Auth's name, email and password
const SIGN_UP_EMAIL_PATH = "/sign-up/email";

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

    // success email will be sent after email verification
  } catch (error) {
    console.error("Post-registration steps failed for", user.email, error);
  }
}
