'use strict';

const Robot = require('../models').Robot;

module.exports = {
  up: function (queryInterface, Sequelize) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('Person', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */
    console.log(Object.keys(Robot));
    return Robot.create({
      name: 'Nunu bot',
      code: 'this is my code.'
    });
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
    return Robot.find({ where: {url_name: 'nunu_bot'} }).then((robot)=>{
      robot.destroy;
    });
  }
};
