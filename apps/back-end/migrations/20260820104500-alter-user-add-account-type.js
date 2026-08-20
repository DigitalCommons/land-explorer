"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE user
            ADD account_type VARCHAR(255) DEFAULT NULL;`,
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE user
             DROP COLUMN account_type;`,
    );
  },
};
