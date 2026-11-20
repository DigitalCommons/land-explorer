'use strict';

const { randomUUID } = require('crypto');

// The test user from 7_test_user.js
const TEST_USER_EMAIL = 'test-lx@digitalcommons.coop';

// Better Auth's providerId for email and password sign-in
const CREDENTIAL_PROVIDER = 'credential';

/**
 * Gives the seeded test user a Better Auth login, already verified, so it can sign
 * in with Better Auth straight away without being sent a code. Uses the same rows
 * as src/scripts/migrateUsersToAuth.ts, apart from emailVerified.
 * Safe to re-run: it fills in whatever is missing and marks the user verified.
 */
module.exports = {
  up: async (queryInterface) => {
    const { sequelize } = queryInterface;

    const [appUser] = await sequelize.query(
      'SELECT id, first_name, last_name, username, password, created_date FROM user WHERE username = :email',
      { replacements: { email: TEST_USER_EMAIL }, type: sequelize.QueryTypes.SELECT },
    );
    if (!appUser) return;

    await sequelize.transaction(async (transaction) => {
      const [existing] = await sequelize.query(
        'SELECT id FROM auth_user WHERE appUserId = :appUserId OR email = :email',
        {
          replacements: { appUserId: appUser.id, email: TEST_USER_EMAIL },
          type: sequelize.QueryTypes.SELECT,
          transaction,
        },
      );

      const authUserId = existing ? existing.id : randomUUID();

      if (existing) {
        await sequelize.query(
          'UPDATE auth_user SET emailVerified = true, appUserId = :appUserId, updatedAt = NOW(3) WHERE id = :id',
          { replacements: { id: authUserId, appUserId: appUser.id }, transaction },
        );
      } else {
        await sequelize.query(
          `INSERT INTO auth_user (id, name, email, emailVerified, createdAt, updatedAt, appUserId)
           VALUES (:id, :name, :email, true, :createdAt, NOW(3), :appUserId)`,
          {
            replacements: {
              id: authUserId,
              name: `${appUser.first_name} ${appUser.last_name}`,
              email: TEST_USER_EMAIL,
              createdAt: appUser.created_date,
              appUserId: appUser.id,
            },
            transaction,
          },
        );
      }

      const [account] = await sequelize.query(
        'SELECT id FROM auth_account WHERE userId = :userId AND providerId = :providerId',
        {
          replacements: { userId: authUserId, providerId: CREDENTIAL_PROVIDER },
          type: sequelize.QueryTypes.SELECT,
          transaction,
        },
      );

      // user.password is a bcrypt hash, which Better Auth verifies (see src/utils/auth.ts)
      if (!account) {
        await sequelize.query(
          `INSERT INTO auth_account (id, accountId, providerId, userId, password, createdAt, updatedAt)
           VALUES (:id, :userId, :providerId, :userId, :password, NOW(3), NOW(3))`,
          {
            replacements: {
              id: randomUUID(),
              userId: authUserId,
              providerId: CREDENTIAL_PROVIDER,
              password: appUser.password,
            },
            transaction,
          },
        );
      }
    });
  },

  down: (queryInterface) => {
    // auth_account rows go with it (ON DELETE CASCADE)
    return queryInterface.bulkDelete('auth_user', { email: TEST_USER_EMAIL }, {});
  },
};
