const request = require('supertest-as-promised');
const myApp = require('../../app');

myApp.get('/user', function(req, res){
  res.status(200).json({ name: 'tobi' });
});

describe('GET /robots', ()=>{
  it('Should successfully find "My Bot"', ()=>{
    return request(myApp).get('/user').expect(200);
  });
});
