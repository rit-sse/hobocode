var Robot = require('../models').Robot;

before(() => Robot.sync({force: true}));
