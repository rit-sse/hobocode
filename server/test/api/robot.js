const request = require('supertest-as-promised');
const myApp = require('../../app');
const Robot = require('../../models').Robot;

before(()=>{
  // seed the database
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
});

after(()=>{
  Robot.find({ where: { name: { like: 'bot' } } }).then(robots=>{
    console.log(robots);
  });
});

describe('GET /robots', ()=>{
  it('Should successfully find "My Bot"', ()=>{
    return request(myApp).get('/robots/my_bot').expect(200);
  });
  it('Should not find "My Other Bot"', ()=>{
    return request(myApp).get('/robots/my_other_bot').expect(404);
  });
  
});
