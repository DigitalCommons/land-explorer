
import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";

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
  },
  emailVerification: {
    
  },
  user: {
    modelName: "auth_user"
  }
  
});