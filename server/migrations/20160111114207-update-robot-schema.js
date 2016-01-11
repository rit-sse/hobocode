'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return Promise.all([
      queryInterface.removeColumn('Robots', 'revision'),
      queryInterface.changeColumn('Robots', 'url_name', {type:Sequelize.STRING, unique: true}),
      queryInterface.addColumn('Robots', 'code', {type: Sequelize.STRING})
    ]);
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return Promise.all([
      queryInterface.addColumn('Robots', 'revision', {type: Sequelize.INTEGER}),
      queryInterface.changeColumn('Robots', 'url_name', {type:Sequelize.STRING, unique: false}),
      queryInterface.removeColumn('Robots', 'code')
    ]);
  }
};
