'use strict';

const enums = require('../lib/enums');
const bcrypt = require('bcrypt');

module.exports = {

    up: async (queryInterface, Sequelize) => {
        const { faker } = await import('@faker-js/faker');
        const testUserExists = await queryInterface.rawSelect('user', {
            where: {
                username: "test-lx@digitalcommons.coop"
            }
        }, ['id']);

        if (testUserExists)
            return Promise.resolve();

        return queryInterface.bulkInsert('user', [{
            first_name: "Testing",
            last_name: "LX User",
            address1: faker.location.streetAddress(),
            address2: faker.location.secondaryAddress(),
            city: faker.location.city(),
            postcode: faker.location.zipCode(),
            phone: faker.phone.number(),

            marketing: true,
            organisation: faker.company.name(),
            organisation_number: faker.color.rgb(),
            organisation_activity: enums.OrganisationSubType.PowerNetwork,
            organisation_type: enums.OrganisationType.Commercial,
            council_id: 0,
            username: "test-lx@digitalcommons.coop",
            password: bcrypt.hashSync("testingtesting123", 10),
            access: 2,
            enabled: 1,
            is_super_user: 1,

            created_date: new Date(),
            last_modified: new Date()
        }]);
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('user', null, {});
    }

};