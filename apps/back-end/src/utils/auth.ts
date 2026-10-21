import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { generateId } from "@better-auth/core/utils/id";
import { createPool } from "mysql2/promise";
import bcrypt from 'bcrypt';
import { APP_USER_MODEL, appUserPlugin } from "./appUserPlugin";
import {
  RESET_PASSWORD_EXPIRY_SECONDS,
  sendPasswordReset,
  sendVerificationOTP,
  VERIFICATION_CODE_EXPIRY_SECONDS,
} from "../emails/email";
import {
  confirmPasswordForEmailChange,
  postEmailVerificationFlow,
  postRegistrationFlow,
  preEmailChangeFlow,
  preRegistrationFlow,
} from "../services/authUser";

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
      // our user table's id is auto-increment, so leave it to the database;
      // Better Auth's own tables keep its default ids
      generateId: ({ model }) => (model === APP_USER_MODEL ? false : generateId()),
    },
    cookiePrefix: "lx",
  },
  user: {
    modelName: "auth_user",
    // changeEmail is left off, which disables Better Auth's link-based /change-email.
    // Users change their email with codes through the emailOTP plugin below instead
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
  hooks: {
    before: confirmPasswordForEmailChange,
  },
  databaseHooks: {
    user: {
      create: {
        before: preRegistrationFlow,
        after: postRegistrationFlow
      },
      update: {
        before: preEmailChangeFlow,
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
  plugins: [
    appUserPlugin(),
    emailOTP({
      overrideDefaultEmailVerification: true, 
      changeEmail: {
        enabled: true,
      },
      sendVerificationOTP,
      expiresIn: VERIFICATION_CODE_EXPIRY_SECONDS,
      // users must sign up through /sign-up/email, where preRegistrationFlow
      // creates their row in our user table
      disableSignUp: true,
    }),
  ],
  // The emailOTP plugin also adds code sign-in and code password reset, which we don't use currently
  disabledPaths: [
    "/sign-in/email-otp",
    "/email-otp/request-password-reset",
    "/forget-password/email-otp",
    "/email-otp/reset-password",
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 6,
    resetPasswordTokenExpiresIn: RESET_PASSWORD_EXPIRY_SECONDS,
    sendResetPassword: sendPasswordReset,
    password: {
      hash: (password: string) => bcrypt.hash(password, 10),      
      verify: (data: {hash: string; password: string;}) => bcrypt.compare(data.password, data.hash)
    }    
  },
  // The verification email itself comes from the emailOTP plugin above
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignIn: true,
    sendOnSignUp: true,
    afterEmailVerification: postEmailVerificationFlow,
  },
  
});
