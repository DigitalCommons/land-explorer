import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";
import {
  RESET_PASSWORD_EXPIRY_SECONDS,
  sendPasswordReset,
} from "../emails/Email";
import { postRegistrationFlow, preRegistrationFlow } from "../services/authUser";

export const auth = betterAuth({
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
  databaseHooks: {
    user: {
      create: {
        before: preRegistrationFlow,
        after: postRegistrationFlow
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
    sendResetPassword: sendPasswordReset,
  },
});
