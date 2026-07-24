"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE land_ownership_snapshots
        ADD INDEX idx_snapshot_date_company_registration_no (snapshot_date, company_registration_no(100))`,
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE land_ownership_snapshots
        DROP INDEX idx_snapshot_date_company_registration_no`,
    );
  },
};
