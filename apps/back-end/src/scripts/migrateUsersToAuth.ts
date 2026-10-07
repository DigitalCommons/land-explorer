import { QueryTypes, Transaction } from "sequelize";
import { generateId } from "@better-auth/core/utils/id";
import { sequelize } from "../queries/database";

/**
 * Copies users from our app `user` table into Better Auth's auth_user and auth_account
 * tables, so existing users can sign in once FEATURE_USE_BETTERAUTH is switched on.
 *
 * Until the flag is on, `user` is the source of truth, so this creates any missing
 * users and updates email, name and password where they've drifted. It's safe to re-run.
 *
 * Run it just before switching the flag on, then once more straight after to catch
 * anything that changed in between. Don't run it after that: once Better Auth owns
 * passwords, user.password goes stale and this would overwrite newer ones.
 *
 * Usage (add --dry-run to roll everything back and just report what would change): 
 *   node lib/scripts/migrateUsersToAuth.js   (after npm run build, e.g. on the server)
 */

// Better Auth's providerId for email and password sign-in
const CREDENTIAL_PROVIDER = "credential";

type AppUserRow = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  created_date: Date;
};

type AuthUserRow = {
  id: string;
  email: string;
  name: string;
  appUserId: number | null;
};

type AuthAccountRow = {
  id: string;
  userId: string;
  password: string | null;
};

type Result = {
  created: number;
  detailsUpdated: number;
  passwordsUpdated: number;
  accountsCreated: number;
  unchanged: number;
  conflicts: string[];
};

function getAppUsers(transaction: Transaction): Promise<AppUserRow[]> {
  return sequelize.query(
    `SELECT id, first_name, last_name, username, password, created_date FROM user ORDER BY id`,
    { type: QueryTypes.SELECT, transaction },
  );
}

function getAuthUsers(transaction: Transaction): Promise<AuthUserRow[]> {
  return sequelize.query(`SELECT id, email, name, appUserId FROM auth_user`, {
    type: QueryTypes.SELECT,
    transaction,
  });
}

function getCredentialAccounts(
  transaction: Transaction,
): Promise<AuthAccountRow[]> {
  return sequelize.query(
    `SELECT id, userId, password FROM auth_account WHERE providerId = :providerId`,
    {
      type: QueryTypes.SELECT,
      replacements: { providerId: CREDENTIAL_PROVIDER },
      transaction,
    },
  );
}

async function insertAuthUser(
  transaction: Transaction,
  appUser: AppUserRow,
  email: string,
  name: string,
): Promise<string> {
  const authUserId = generateId();
  await sequelize.query(
    `INSERT INTO auth_user (id, name, email, emailVerified, createdAt, updatedAt, appUserId)
     VALUES (:id, :name, :email, true, :createdAt, NOW(3), :appUserId)`,
    {
      replacements: {
        id: authUserId,
        name,
        email,
        createdAt: appUser.created_date,
        appUserId: appUser.id,
      },
      transaction,
    },
  );

  return authUserId;
}

function updateAuthUserDetails(
  transaction: Transaction,
  authUserId: string,
  email: string,
  name: string,
) {
  return sequelize.query(
    `UPDATE auth_user SET email = :email, name = :name, updatedAt = NOW(3) WHERE id = :id`,
    { replacements: { id: authUserId, email, name }, transaction },
  );
}

function insertAccount(
  transaction: Transaction,
  authUserId: string,
  password: string,
  createdAt: Date,
) {
  return sequelize.query(
    `INSERT INTO auth_account (id, accountId, providerId, userId, password, createdAt, updatedAt)
     VALUES (:id, :userId, :providerId, :userId, :password, :createdAt, NOW(3))`,
    {
      replacements: {
        id: generateId(),
        userId: authUserId,
        providerId: CREDENTIAL_PROVIDER,
        password,
        createdAt,
      },
      transaction,
    },
  );
}

// both are bcrypt hashes, which Better Auth verifies (see utils/auth.ts)
function updateAccountPassword(
  transaction: Transaction,
  accountId: string,
  password: string,
) {
  return sequelize.query(
    `UPDATE auth_account SET password = :password, updatedAt = NOW(3) WHERE id = :id`,
    { replacements: { id: accountId, password }, transaction },
  );
}

async function migrateUsers(transaction: Transaction): Promise<Result> {
  const appUsers = await getAppUsers(transaction);
  const authUsers = await getAuthUsers(transaction);
  const accounts = await getCredentialAccounts(transaction);

  const authUserByAppUserId = new Map(
    authUsers
      .filter((a) => a.appUserId != null)
      .map((a) => [Number(a.appUserId), a]),
  );
  // kept up to date as we go, so two users can't be given the same email in one run
  const authUserIdByEmail = new Map(authUsers.map((a) => [a.email, a.id]));
  const accountByAuthUserId = new Map(accounts.map((a) => [a.userId, a]));

  const result: Result = {
    created: 0,
    detailsUpdated: 0,
    passwordsUpdated: 0,
    accountsCreated: 0,
    unchanged: 0,
    conflicts: [],
  };

  for (const appUser of appUsers) {
    // Better Auth lowercases emails when signing in, so they must be stored lowercase
    const email = appUser.username.trim().toLowerCase();
    const name = `${appUser.first_name} ${appUser.last_name}`.trim();
    const authUser = authUserByAppUserId.get(Number(appUser.id));

    const emailOwner = authUserIdByEmail.get(email);
    if (emailOwner && emailOwner !== authUser?.id) {
      result.conflicts.push(
        `user ${appUser.id}: ${email} already belongs to auth_user ${emailOwner}`,
      );
      continue;
    }

    if (!authUser) {
      const authUserId = await insertAuthUser(
        transaction,
        appUser,
        email,
        name,
      );
      await insertAccount(
        transaction,
        authUserId,
        appUser.password,
        appUser.created_date,
      );
      authUserIdByEmail.set(email, authUserId);
      result.created++;
      continue;
    }

    let changed = false;

    if (authUser.email !== email || authUser.name !== name) {
      await updateAuthUserDetails(transaction, authUser.id, email, name);
      authUserIdByEmail.delete(authUser.email);
      authUserIdByEmail.set(email, authUser.id);
      result.detailsUpdated++;
      changed = true;
    }

    const account = accountByAuthUserId.get(authUser.id);
    if (!account) {
      await insertAccount(
        transaction,
        authUser.id,
        appUser.password,
        appUser.created_date,
      );
      result.accountsCreated++;
      changed = true;
    } else if (account.password !== appUser.password) {
      await updateAccountPassword(transaction, account.id, appUser.password);
      result.passwordsUpdated++;
      changed = true;
    }

    if (!changed) result.unchanged++;
  }

  return result;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const transaction = await sequelize.transaction();

  let result: Result;
  try {
    result = await migrateUsers(transaction);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  if (dryRun) {
    await transaction.rollback();
  } else {
    await transaction.commit();
  }

  console.log(dryRun ? "Dry run, nothing was saved." : "Done.");
  console.log(`  created:            ${result.created}`);
  console.log(`  details updated:    ${result.detailsUpdated}`);
  console.log(`  passwords updated:  ${result.passwordsUpdated}`);
  console.log(`  accounts created:   ${result.accountsCreated}`);
  console.log(`  unchanged:          ${result.unchanged}`);
  console.log(`  conflicts:          ${result.conflicts.length}`);
  result.conflicts.forEach((conflict) => console.log(`    ${conflict}`));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
