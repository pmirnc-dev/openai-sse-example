import { Response } from 'express';
export const subscriptions: Record<string, Response> = {};


export const getSubscriber = (userId: string) => {
  return subscriptions[userId];
}

export const setSubscriber = (userId: string, res: Response) => {
  subscriptions[userId] = res;
}

export const deleteSubscriber = (userId: string) => {
  delete subscriptions[userId];
}
