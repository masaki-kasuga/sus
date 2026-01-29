import { Request, Response, NextFunction } from 'express';
import { logger as log } from '../utils/logger.js';

export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  log.info(`${req.method} ${req.path}`);
  next();
};

