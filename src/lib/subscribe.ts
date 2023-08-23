import { Request, Response } from 'express';
import { setSubscriber, getSubscriber, deleteSubscriber } from './store';
export default async function subscribe(req: Request, res: Response) {

  const { session } = req;

  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };

  res.writeHead(200, headers);

  const userId = session.id;

  res.write(`event: open\n`);
  res.write(`data: ${JSON.stringify({id: userId})}\n\n`);
  setSubscriber(userId, res);

  req.on('close', () => {
    const stream = getSubscriber(userId)?.locals.stream;
    if (stream && stream.controller) stream.controller.abort();
    deleteSubscriber(userId);
  });

}
