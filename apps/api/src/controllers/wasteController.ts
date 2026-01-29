import { Request, Response } from 'express';
import { loadWasteDetailData } from '../services/dataService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getWasteDetail = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  if (category !== 'A' && category !== 'B') {
    return res.status(400).json({ error: 'Invalid category. Must be A or B' });
  }
  const data = loadWasteDetailData(category as 'A' | 'B');
  return res.json(data);
});

