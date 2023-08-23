import { Request, Response } from 'express';
import { getSubscriber } from './store';
import OpenAI from 'openai';
const openai  = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
export const requestAPI = async (req: Request, res: Response) => {
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

      // process.stdout.write(content);
      const data = {
        type: 'message',
        content,
        messageId,
        prompt,
      };

      // MARK: 이벤트이름 전송
      subscriber.write(`event: message\n`);
      // MARK: 데이터 전송
      subscriber.write(`data: ${JSON.stringify(data)}\n\n`);

      if (finished === 'stop') {
        // MARK: 날짜 전송
        subscriber.write(`event: date\n`);
        subscriber.write(`data: ${JSON.stringify({ type: 'date', messageId, content: new Date().toLocaleString() })}\n\n`);

        // MARK: 종료 이벤트 전송
        subscriber.write(`event: end\n`);
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
}
