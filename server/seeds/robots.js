'use strict';

let Robot = require('../models').Robot;

Robot.create({
  name: 'Nunu bot',
  code: 'this is my code.'
});

Robot.create({
  name: 'Jax Bot',
  code: 'let jax_bot = require(\'really_good_bot\');\n\njax_bot.win();'
});

Robot.create({
  name: 'My Bot',
  code: 'My bot can do things, trust me',
  password: 'password'
});
