import sgMail from "@sendgrid/mail";
import { renderResetPasswordEmail } from "./templates/ResetPasswordEmail";
import { logoAttachment } from "./logoAttachment";
import { GenericEndpointContext, User } from "better-auth";
import { renderVerificationEmail } from "./templates/EmailVerificationEmail";
import { renderRegisteredEmail } from "./templates/RegisteredEmail";

export const RESET_PASSWORD_EXPIRY_SECONDS = 60 * 60; // 1 hour (better-auth default)
export const VERIFICATION_CODE_EXPIRY_SECONDS = 15 * 60;

const RESET_PASSWORD_CALLBACK_URL = "/auth/reset-password?flow=password-reset";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const sender = "landexplorer@digitalcommons.coop";
const senderName = "LandExplorer";

type ResetPasswordData = {
  user: User;
  url: string;
  token: string;
};

export async function sendPasswordReset(
  { user, url }: ResetPasswordData,
  request?: Request,
) {
  try {
    const fullUrl = new URL(url);
    fullUrl.searchParams.set("callbackURL", RESET_PASSWORD_CALLBACK_URL);
    
    const html = await renderResetPasswordEmail({
      name: user.name,
      url: fullUrl.toString(),
      expiryMinutes: RESET_PASSWORD_EXPIRY_SECONDS / 60,
    });
    // Not awaited - Better Auth waits for this function, so waiting on SendGrid
    // would make a registered email respond slower than an unknown one. The
    // catch stops a failed send becoming an unhandledRejection, which exits
    // the server in server.ts
    sgMail
      .send({
        to: user.email,
        from: {
          name: senderName,
          email: sender,
        },
        subject: "Reset your LandExplorer password",
        html,
        attachments: [logoAttachment()],
      })
      .catch((error) => console.error(error));
  } catch (error) {
    console.error(error);
  }
}

type VerificationOTPData = {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password" | "change-email";
};

/**
 * Sends the codes for Better Auth's emailOTP plugin (see utils/auth.ts). Only email
 * verification uses codes so far; the plugin's other flows are switched off.
 */
export async function sendVerificationOTP(
  { email, otp, type }: VerificationOTPData,
  ctx?: GenericEndpointContext,
) {
  if (type !== "email-verification") {
    console.error(`No email is set up for ${type} codes`);
    return;
  }

  try {
    // the plugin only passes the address, so look the user up for their name
    const found = await ctx?.context.internalAdapter.findUserByEmail(email);
    const html = await renderVerificationEmail({
      name: found?.user.name,
      email,
      code: otp,
      expiryMinutes: VERIFICATION_CODE_EXPIRY_SECONDS / 60,
    });
    // Not awaited - Better Auth waits for this function, so waiting on SendGrid
    // would make a verification email respond slower than an unknown one. The
    // catch stops a failed send becoming an unhandledRejection, which exits
    // the server in server.ts
    sgMail
      .send({
        to: email,
        from: {
          name: senderName,
          email: sender,
        },
        subject: "Your LandExplorer verification code",
        html,
        attachments: [logoAttachment()],
      })
      .catch((error) => console.error(error));
  } catch (error) {
    console.error(error);
  }
}

export async function sendRegisteredEmail(email: string, name: string, appUrl: string) {
  try {
    const html = await renderRegisteredEmail({ name, url: appUrl });
    sgMail
      .send({
        to: email,
        from: {
          name: senderName,
          email: sender,
        },
        subject: `${name}, you have registered on LandExplorer!`,
        html,
        attachments: [logoAttachment()],
      })
      .catch((error) => console.error(error));
  } catch (error) {
    console.error(error);
  }
}
