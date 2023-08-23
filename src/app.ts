import 'dotenv/config'
import OpenAI from 'openai';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import path from 'path';
import subscribe from './lib/subscribe';
import { getSubscriber } from './lib/store';
import { requestAPI } from './lib/openai.api';
const openai  = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
const maxAge = 1e3 * 60 * 60 * 24;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge }
}));

// app.get('/subscribe', subscribe);
app.get('/', (req, res) => (res.render('index')));

app.route('/openai')
  .get(subscribe)
  .post(requestAPI);

app.listen(3000, () => {});
