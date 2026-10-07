import { betterAuth } from "better-auth";
import { generateId } from "@better-auth/core/utils/id";
import { createPool } from "mysql2/promise";
import bcrypt from 'bcrypt';
import { APP_USER_MODEL, appUserPlugin } from "./appUserPlugin";
import {
  RESET_PASSWORD_EXPIRY_SECONDS,
  sendPasswordReset,
  sendVerificationEmail,
  VERIFICATION_EMAIL_EXPIRY_SECONDS,
} from "../emails/Email";
import { postEmailVerificationFlow, postRegistrationFlow, preRegistrationFlow } from "../services/authUser";

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
  plugins: [appUserPlugin()],
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
  emailVerification: {
    autoSignInAfterVerification: true,
    sendVerificationEmail: sendVerificationEmail,   
    sendOnSignIn: true,
    sendOnSignUp: true,
    expiresIn: VERIFICATION_EMAIL_EXPIRY_SECONDS,
    afterEmailVerification: postEmailVerificationFlow,
  }
});
