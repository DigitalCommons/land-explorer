import { APIError, GenericEndpointContext, User } from "better-auth";
import { Validation } from "../validation";
import { signUpToMarketing } from "../clients/buttondown.client";
import { createUser, getUserById, migrateGuestUserMap, trackUserEvent } from "../queries/query";
import { Event } from "../instrument";

// Our registration form signs up through this endpoint, sending the details we
// keep on our own `user` table alongside Better Auth's name, email and password
const SIGN_UP_EMAIL_PATH = "/sign-up/email";

/**
 * This runs inside BetterAuths sign up transaction, before auth_user is created. The the 
 * new auth_user is created already linked to our app User
 * @param user the user 
 * @param ctx the request context
 */
export async function preRegistrationFlow(user: User & Record<string, unknown>, ctx: GenericEndpointContext | null) {
  if (ctx?.path !== SIGN_UP_EMAIL_PATH) return;
  // our validation and createUser call the email "username"
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
  
  signUpToMarketing(ctx.body.marketing, user.email);
  // This creates the user in our User table with all the additional fields
  const appUser = await createUser(registration);
  return { data: { ...user, appUserId: appUser.id } };
}

/**
 * This runs as part of Betterauths post sign up transaction, after auth_user has been created.
 * Therefor failures here are logged rather than failing a registration that has already succeeded
 * @param user the user 
 * @param ctx the request context
 */
export async function postRegistrationFlow(user: User & Record<string, unknown>, ctx: GenericEndpointContext | null) {
  if (ctx?.path !== SIGN_UP_EMAIL_PATH || !user.appUserId) return;
  
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
