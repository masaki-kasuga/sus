import { Request, Response, NextFunction } from 'express';

type AsyncHandlerFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | Promise<Response> | void | Response;

export const asyncHandler = (fn: AsyncHandlerFn) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

