"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE land_ownerships
        ADD INDEX proprietor_name_2 (proprietor_name_2(255)),
        ADD INDEX proprietor_name_3 (proprietor_name_3(255)),
        ADD INDEX proprietor_name_4 (proprietor_name_4(255))`,
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE land_ownerships
        DROP INDEX proprietor_name_2,
        DROP INDEX proprietor_name_3,
        DROP INDEX proprietor_name_4`,
    );
  },
};
