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
    return Robot.create({
      name: 'Jax Bot',
      code: 'let jax_bot = require(\'really_good_bot\');\n\njax_bot.win();'
    });
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
    return Robot.find({ where: {url_name: 'jax_bot'} }).then((robot)=>{
      robot.destroy;
    });
  }
};
