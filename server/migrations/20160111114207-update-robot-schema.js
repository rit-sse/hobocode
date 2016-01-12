'use strict';

var Promise = require('bluebird');

module.exports = {
  up: function (queryInterface, Sequelize) {
    /*
      This uses bluebird's `Promise.each` to run each modification sequentially
    */
    return Promise.each([
      queryInterface.removeColumn('Robots', 'revision'),
      queryInterface.changeColumn('Robots', 'url_name', {type:Sequelize.STRING, unique: true}),
      queryInterface.addColumn('Robots', 'code', {type: Sequelize.STRING})
    ]);
  },

  down: function (queryInterface, Sequelize) {
    /*
      This uses bluebird's `Promise.each` to run each modification sequentially
    */
    return Promise.each([
      queryInterface.addColumn('Robots', 'revision', {type: Sequelize.INTEGER}),
      queryInterface.changeColumn('Robots', 'url_name', {type:Sequelize.STRING, unique: false}),
      queryInterface.removeColumn('Robots', 'code')
    ]);
  }
};
