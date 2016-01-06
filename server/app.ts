import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as wire from './wire';

let app = express();
app.get('/foo', (req, res) => res.send('bar'));
app.get('/bar', (req, res) => res.send('foo'));

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, '/../dist')));


const server = http.createServer(app).listen(3000);
