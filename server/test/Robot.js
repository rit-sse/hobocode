'use strict'

let Robot = require('../models').Robot;
require('chai-as-promised');
describe('Robot', function() {
  describe('#save()', function () {
    it('should require a name', function () {
      return Robot.build({}).validate().should.eventually.not.be.null;
    });
  });
});
