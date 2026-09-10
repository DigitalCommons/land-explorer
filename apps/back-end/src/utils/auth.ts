
import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";

export const auth = betterAuth({
   database: createPool({
    host: "localhost",
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,    
    timezone: "Z", // Important to ensure consistent timezone values
  }),
  advanced: {
    database: {
      joins: true,
    },
  },
});