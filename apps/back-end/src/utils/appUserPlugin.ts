import type { BetterAuthPlugin } from "better-auth";

/** The Better Auth model name for our `user` table. */
export const APP_USER_MODEL = "appUser";

/**
 * https://better-auth.com/docs/concepts/plugins#schema
 * Describes our `user` table to Better Auth so the sign-up hook
 * (services/authUser.ts) can write to it through Better Auth's adapter, inside the
 * same transaction as auth_user. If the sign-up fails, the user row rolls back
 * with it.
 *
 * Only the columns the sign-up writes are listed, keyed by column name to match
 * toUserRow (queries/query.ts). The rest have database defaults. Keep this in
 * step with the Sequelize User model(queries/database.ts) when adding a required
 * column. `id` is the table's auto-increment, see generateId in utils/auth.ts.
 *
 * The table is owned by our Sequelize migrations, so it's excluded from Better
 * Auth's migrations and schema check.
 */
export const appUserPlugin = () =>
  ({
    id: "app-user",
    schema: {
      [APP_USER_MODEL]: {
        modelName: "user",
        disableMigration: true,
        fields: {
          // unique, so the adapter can find the inserted row on MySQL, which has no INSERT ... RETURNING
          username: { type: "string", required: true, unique: true },
          password: { type: "string", required: true },
          enabled: { type: "number" },
          access: { type: "number" },
          is_super_user: { type: "number", required: true },
          first_name: { type: "string", required: true },
          last_name: { type: "string", required: true },
          address1: { type: "string", required: false },
          address2: { type: "string", required: false },
          city: { type: "string", required: false },
          postcode: { type: "string", required: false },
          phone: { type: "string", required: false },
          organisation_number: { type: "string", required: false },
          organisation: { type: "string", required: false },
          organisation_activity: { type: "string", required: false },
          organisation_type: { type: "string", required: false },
          account_type: { type: "string", required: true },
          marketing: { type: "boolean", required: false },
          council_id: { type: "number", required: true },
        },
      },
    },
  }) satisfies BetterAuthPlugin;
