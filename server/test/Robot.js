'use strict'
let chai = require('chai');                        
let chaiAsPromised = require('chai-as-promised');  
let expect = chai.expect;                                                   

chai.use(chaiAsPromised);                          
chai.should()                                      

let Robot = require('../models').Robot;

/**
 * Asserts that a response from `Instance#validate` is valid.  If it is, this
 * will return a resolved Promise.  Otherwise, it will return a rejected
 * Promise.  If you are testing that an instance is invalid, you must `catch`
 * the resulting promise and negate it.
 *
 * Sequelize will return either a `undefined` or a `ValidationError` - `null` being
 * the success case.
 */
let assertValidity = function(response) {
  return response === undefined ? Promise.resolve() : Promise.reject();
};

describe('Robot', function() {
  describe('#validate()', function () {
    it('should require a name', function () {
      return Robot.build({}).validate().then(assertValidity).catch(function() {
        // it is expected for `assertValidity` to reject this call as an invalid
        // Robot.
        return Promise.resolve();
      });
    });

    describe('url_name', function () {
      it('should autogenerate a url_field', function () {
        let myBot = Robot.build({ name: 'Jane Doe' });
        expect(myBot.url_name).to.equal('jane_doe');
      });

      it('should disallow any two robots to use a name that conflates to the same url', function () {
        return Robot.create({ name: 'Jane Doe' }).then(() => {
          return Robot.create({ name: 'jane_doe'});
        }).should.be.rejected;
      });
    });
  });
});
