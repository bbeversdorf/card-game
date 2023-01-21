import * as express from 'express';
import * as http from 'http';
import { Game } from './game';
import { WSocket } from './websocket';

const path = require('path');
const redis = require('redis')
const session = require('express-session');
const app = express();
const RedisStore = require('connect-redis')(session);
const redisClient = redis.createClient();
const sessionParser = session({
  store: new RedisStore({ client: redisClient }),
  secret: 'shhhitsasecret',
  resave: false,
  saveUninitialized: false,
});
const server = http.createServer(app);
const wss = new WSocket(server, sessionParser);
const controller = require('./controller')(wss);
const routes = require('./routes')(controller);

app.use(sessionParser);
app.use(express.json());
app.use('/', routes);
app.use(express.static(path.join(__dirname, '../public')));

app.set('views', './dist/views');
app.set('view engine', 'ejs');

//initialize a simple http server

//start our server
server.listen(8080, async () => {
  console.log(`Server started on 8080`);
  await Game.setupStorage()
});
