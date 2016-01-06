'use strict';

module.exports = function(sequelize, DataTypes) {
  var Robot = sequelize.define('Robot', {
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    url_name: DataTypes.TEXT,
    revision: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Robot;
};
