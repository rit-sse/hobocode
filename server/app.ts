import * as express from "express";
import * as http from "http";

let app = express();
app.get('/foo', (req, res) => res.send('bar'));
app.get('/bar', (req, res) => res.send('foo'));

const server = http.createServer(app).listen(3000);

export = app;
