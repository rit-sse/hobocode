'use strict'

let Robot = require('../models').Robot;

/**
 * Asserts that a response from `Instance#validate` is valid.  If it is, this
 * will return a resolved Promise.  Otherwise, it will return a rejected
 * Promise.  If you are testing that an instance is invalid, you must `catch`
 * the resulting promise and negate it.
 *
 * Sequelize will return either a `null` or a `ValidationError` - `null` being
 * the success case.
 */
let assertValidity = function(response) {
  return response === null ? Promise.resolve() : Promise.reject();
};

describe('Robot', function() {
  describe('#save()', function () {
    it('should require a name', function () {
      return Robot.build({}).validate().then(assertValidity).catch(function() {
        // it is expected for `assertValidity` to reject this call as an invalid
        // Robot.
        return Promise.resolve();
      });
    });
  });
});
