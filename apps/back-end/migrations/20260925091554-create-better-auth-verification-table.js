"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `create table auth_verification (
            id varchar(36) not null primary key, 
            identifier varchar(255) not null, 
            value text not null, 
            expiresAt timestamp(3) not null, 
            createdAt timestamp(3) default CURRENT_TIMESTAMP(3) not null, 
            updatedAt timestamp(3) default CURRENT_TIMESTAMP(3) not null,
            INDEX verification_identifier_idx (identifier)
          );`,
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS auth_verification;`);
  },
};
