import 'dotenv/config'
import OpenAI from 'openai';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import path from 'path';
import subscribe from './lib/subscribe';
import { getSubscriber } from './lib/store';
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

app.get('/subscribe', subscribe);

app.route('/openai')
  .get(async(req, res) => {
    return res.render('index');
  }).post(async (req, res) => {
    const { body: { prompt }, session } = req;
    if (!prompt) return res.status(400).send('Bad Request');

    const sessionId = session.id;
    const messageId = `message-${new Date().getTime()}`;
    const subscriber = getSubscriber(sessionId);
    if (!subscriber) return res.status(404).send('session expired');
    try {
      const result = await openai.chat.completions.create({
        model: 'gpt-4-0613',
        messages: [{
          role: 'system',
          content: prompt,
        }],
        stream: true
      });

      subscriber.locals.stream = result;

      for await (const message of result) {
        const { choices, id } = message;

        subscriber.locals.messageId = id;
        const finished = choices[0]?.finish_reason;
        const content = choices[0]?.delta?.content || '';

        process.stdout.write(content);
        const data = {
          type: 'message',
          content,
          messageId,
          prompt,
        };

        const dataStr = `data: ${JSON.stringify(data)}\n\n`;
        subscriber.write(dataStr);

        if (finished === 'stop') {
          subscriber.write(`data: ${JSON.stringify({ type: 'date', messageId, content: new Date().toLocaleString() })}\n\n`);
          subscriber.write(`data: ${JSON.stringify({ type: 'end', messageId })}\n\n`);
          subscriber.locals.stream = null;
          delete subscriber.locals.stream;
        }
      }
      console.warn('end');
      return res.end();
    } catch (e) {
      console.log(e);
    }
  });


app.listen(3000, () => {});
