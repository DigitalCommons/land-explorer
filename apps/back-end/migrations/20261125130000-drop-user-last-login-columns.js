"use strict";

/**
 * last_login and login_failure_count on the user table are no longer used
 * (Better Auth tracks sessions in auth_session).
 *
 * The columns are only dropped if present, because databases created from the
 * current create-user migration never have them.
 *
 * Note: the down migration restores the columns only, not the data.
 */
const COLUMNS = ["last_login", "login_failure_count"];

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("user");
    for (const column of COLUMNS) {
      if (table[column]) {
        await queryInterface.removeColumn("user", column);
      }
    }
  },
  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("user");
    if (!table.last_login) {
      await queryInterface.sequelize.query(
        `ALTER TABLE user ADD COLUMN last_login datetime DEFAULT NULL AFTER is_super_user`,
      );
    }
    if (!table.login_failure_count) {
      await queryInterface.sequelize.query(
        `ALTER TABLE user ADD COLUMN login_failure_count int(11) DEFAULT NULL AFTER last_login`,
      );
    }
  },
};
