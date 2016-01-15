const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const models = require('./models');
const robot = require('./routes/robot');
const app = express();

app.get('/foo', (req, res) => res.send('bar'));
app.get('/bar', (req, res) => res.send('foo'));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..', 'app', 'dist')));
app.use('/api/v1', robot);

app.use((err, req, res, next) => {
  res.status(500).send(err.stack);
});

const server = http.createServer(app).listen(3000, ()=>{
  console.log('listening on port 3000...');
});

module.exports =  app;
