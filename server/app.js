const express = require('express');
const http = require('http');
const path = require('path');
const models = require('./models');
const Robot = models.Robot;

const app = express();

app.get('/foo', (req, res) => res.send('bar'));
app.get('/bar', (req, res) => res.send('foo'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..', 'app', 'dist')));

app.use((err, req, res, next) => {
  res.write('ERROR');
  res.write(err.stack);
});

const server = http.createServer(app).listen(3000);
