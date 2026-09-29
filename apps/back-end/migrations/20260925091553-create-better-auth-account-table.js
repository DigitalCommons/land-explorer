"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `create table auth_account (
            id varchar(36) not null primary key, 
            accountId text not null, 
            providerId text not null, 
            userId varchar(36) not null, 
            accessToken text, 
            refreshToken text, 
            idToken text, 
            accessTokenExpiresAt timestamp(3), 
            refreshTokenExpiresAt timestamp(3), 
            scope text, 
            password text, 
            createdAt timestamp(3) default CURRENT_TIMESTAMP(3) not null, 
            updatedAt timestamp(3) not null,
            INDEX auth_account_userId_idx (userId),
            FOREIGN KEY (userId) REFERENCES auth_user (id) ON DELETE CASCADE
          );`,
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS auth_account;`);
  },
};
