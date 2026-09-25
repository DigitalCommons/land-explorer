"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `create table auth_session (
            id varchar(36) not null primary key, 
            expiresAt timestamp(3) not null, 
            token varchar(255) not null unique, 
            createdAt timestamp(3) default CURRENT_TIMESTAMP(3) not null, 
            updatedAt timestamp(3) not null, 
            ipAddress text, 
            userAgent text, 
            userId varchar(36) not null,
            INDEX session_userId_idx (userId),
            FOREIGN KEY (userId) REFERENCES auth_user (id) ON DELETE CASCADE
          );`,
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS auth_session;`);
  },
};
