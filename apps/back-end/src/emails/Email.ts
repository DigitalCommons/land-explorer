import sgMail from "@sendgrid/mail";
import { renderResetPasswordEmail } from "./templates/ResetPasswordEmail";
import { logoAttachment } from "./components/logo";
import { User } from "better-auth";

export const RESET_PASSWORD_EXPIRY_SECONDS = 60 * 60; // 1 hour (better-auth default)

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
    sgMail.send({
      to: user.email,
      from: {
        name: senderName,
        email: sender,
      },
      subject: "Reset your LandExplorer password",
      html: await renderResetPasswordEmail({
        name: user.name,
        url,
        expiryMinutes: RESET_PASSWORD_EXPIRY_SECONDS / 60,
      }),
      attachments: [logoAttachment()],
    });
  } catch (error) {
    console.error(error);
  }
}
