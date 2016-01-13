'use strict';
const urlify = require('urlify').create({
  addEToUmlauts:true,
  szToSs:true,
  spaces:"_",
  nonPrintable:"_",
  trim:true
});

module.exports = function(sequelize, DataTypes) {
  var Robot = sequelize.define('Robot', {
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      set: function(val) {
        /* initialize both the name and url_name fields */
        this.setDataValue('url_name', urlify(val.toLowerCase()));
        this.setDataValue('name', val);
      }
    },
    url_name: {
      type: DataTypes.TEXT,
      unique: true
    },
    code: {type: DataTypes.TEXT}
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Robot;
};
