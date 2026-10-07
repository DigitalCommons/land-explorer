import sgMail from "@sendgrid/mail";
import { renderResetPasswordEmail } from "./templates/ResetPasswordEmail";
import { logoAttachment } from "./components/logo";
import { User } from "better-auth";
import { renderVerificationEmail } from "./templates/EmailVerificationEmail";
import { renderRegisteredEmail } from "./templates/RegisteredEmail";

export const RESET_PASSWORD_EXPIRY_SECONDS = 60 * 60; // 1 hour (better-auth default)
export const VERIFICATION_EMAIL_EXPIRY_SECONDS = 60 * 60; // 1 hour (better-auth default)

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
    const html = await renderResetPasswordEmail({
      name: user.name,
      url,
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

export async function sendVerificationEmail(
  data: {
      user: User;
      url: string;
      token: string;
    },
  request?: Request,
) {
  try {
    const html = await renderVerificationEmail({
      name: data.user.name,
      email: data.user.email,
      url: data.url,
      expiryMinutes: VERIFICATION_EMAIL_EXPIRY_SECONDS / 60,
    });
    // Not awaited - Better Auth waits for this function, so waiting on SendGrid
    // would make a registered email respond slower than an unknown one. The
    // catch stops a failed send becoming an unhandledRejection, which exits
    // the server in server.ts
    sgMail
      .send({
        to: data.user.email,
        from: {
          name: senderName,
          email: sender,
        },
        subject: "Verify your email",
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
