
import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";
import sgMail from "@sendgrid/mail";

export const auth = betterAuth({
   database: createPool({
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    timezone: "Z", // Important to ensure consistent timezone values
    port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 3306
  }),
  advanced: {
    database: {
      joins: true,
    },
    cookiePrefix: "lx"
  },
  user: {
    modelName: "auth_user",    
    additionalFields: {
      appUserId: {
        type: "number",
        bigint: true,
        required: false,   // nullable
        unique: true,
        input: false,
      },
    }    
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    sendResetPassword: async ({user, url, token}, request) => {
      void sgMail.send({
        to: user.email,
        from: {
          name: "Land Explorer",
          email: "landexplorer@digitalcommons.coop",
        },
        subject: "Reset your password",
        html: `Click the link to reset your password: ${url}`,
      });
    },  
  },

  
});