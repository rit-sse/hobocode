'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
      
      Race conditions may exist between migration steps. Promise.then()
      mitigates these issues.
       
    */
      return queryInterface.removeColumn('Robots', 'revision');
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
      return queryInterface.addColumn('Robots', 'revision', {type: Sequelize.INTEGER});
  }
};
