import { Request, Response } from 'express';
import { subscriptions } from './store';
export default async function subscribe(req: Request, res: Response) {

  const { session } = req;

  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };

  res.writeHead(200, headers);

  const userId = session.id;

  const data = `data: ${JSON.stringify({id: userId})}\n\n`;
  res.write(data);
  subscriptions[userId] = res;

  req.on('close', () => {
    console.log('close');
    const stream = subscriptions[userId].locals.stream;
    if (stream && stream.controller) stream.controller.abort();
    delete subscriptions[userId];
  });
}
