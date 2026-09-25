"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE auth_user
        ADD COLUMN appUserId BIGINT,
        ADD UNIQUE INDEX auth_user_appUserId_uidx (appUserId),
        ADD CONSTRAINT auth_user_appUserId_fk
          FOREIGN KEY (appUserId) REFERENCES user(id) ON DELETE SET NULL;`,
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE auth_user
        DROP FOREIGN KEY auth_user_appUserId_fk,
        DROP COLUMN appUserId;`,
    );
  },
};
