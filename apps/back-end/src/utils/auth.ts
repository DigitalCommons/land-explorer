import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";
import sgMail from "@sendgrid/mail";
import { renderResetPasswordEmail } from "../emails/ResetPasswordEmail";
import { logoAttachment } from "../emails/components/logo";
import { EnvironmentType } from "../enums";
import { getEnvironmentType } from "../helpers/environmentVarsHelper";

const RESET_PASSWORD_EXPIRY_SECONDS = 60 * 60; // 1 hour (better-auth default)

// Build time environment variables aren't working as expected for preview environments in coolify. 
// The "production environemnt" env var (i.e.) dev is used instead of the "preview environment" env var
// This is a work around for that issue
const baseUrl = getEnvironmentType() === EnvironmentType.Preview
  ? process.env.SERVICE_URL_FRONT_END
  : process.env.BETTER_AUTH_URL;

export const auth = betterAuth({
  baseURL: baseUrl,
  database: createPool({
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    timezone: "Z", // Important to ensure consistent timezone values
    port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 3306,
  }),
  advanced: {
    database: {
      joins: true,
    },
    cookiePrefix: "lx",
  },  
  user: {
    modelName: "auth_user",
    additionalFields: {
      appUserId: {
        type: "number",
        bigint: true,
        required: false, // nullable
        unique: true,
        input: false,
      },
    },
  },
  session: {
    modelName: "auth_session",
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds (5 minutes)
    },
  },
  verification: {
    modelName: "auth_verification",
  },
  account: {
    modelName: "auth_account",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    resetPasswordTokenExpiresIn: RESET_PASSWORD_EXPIRY_SECONDS,
    sendResetPassword: async ({user, url, token}, request) => {
      void sgMail.send({
        to: user.email,
        from: {
          name: "LandExplorer",
          email: "landexplorer@digitalcommons.coop",
        },
        subject: "Reset your LandExplorer password",
        html: await renderResetPasswordEmail({
          name: user.name,
          url,
          expiryMinutes: RESET_PASSWORD_EXPIRY_SECONDS / 60,
        }),
        attachments: [logoAttachment()],
      }).catch((error: Error) => {
        console.error(error);
      });
    },
  },
});
