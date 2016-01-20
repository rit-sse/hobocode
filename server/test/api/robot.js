const request = require('supertest-as-promised');
const myApp = require('../../app');
const Models = require('../../models')
const db = Models.sequelize;
const Robot = Models.Robot;


after(()=>{
  Robot.find({ where: { name: { like: 'bot' } } }).then(robots=>{
    console.log(robots);
  });
});

describe('GET /robots', ()=>{
before((done)=>{
  Robot.sync({force: true}).then(() => {
    // seed the database
    return db.transaction(function(t) {
      return Promise.all([
        Robot.create({
          name: 'Nunu bot',
          code: 'this is my code.'
        }, {transaction: t}),
        Robot.create({
          name: 'Jax Bot',
          code: 'let jax_bot = require(\'really_good_bot\');\n\njax_bot.win();'
        }, {transaction: t}),
        Robot.create({
          name: 'My Bot',
          code: 'My bot can do things, trust me',
          password: 'password'
        }, {transaction: t})
      ]).then(() => console.log(arguments))
    }).then(() => {console.log('transaction finished'); done() });
  })
});
  it('Should successfully find "My Bot"', ()=>{
    return Robot.findAll().then(console.log.bind(console));
  });
  it('Should not find "My Other Bot"', ()=>{
    return request(myApp).get('/robots/my_other_bot').expect(404);
  });
  
});
