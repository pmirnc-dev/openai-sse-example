import { Response } from 'express';
export const subscriptions: Record<string, Response> = {};


export const getSubscriber = (userId: string) => {
  return subscriptions[userId];
}
