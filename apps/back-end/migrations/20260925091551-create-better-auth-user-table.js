"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `create table auth_user (
            id varchar(36) not null primary key, 
            name varchar(255) not null, 
            email varchar(255) not null unique, 
            emailVerified boolean not null, 
            image text, 
            createdAt timestamp(3) default CURRENT_TIMESTAMP(3) not null, 
            updatedAt timestamp(3) default CURRENT_TIMESTAMP(3) not null
          );`,
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS auth_user;`);
  },
};
