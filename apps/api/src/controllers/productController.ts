import { Request, Response } from 'express';
import { loadProductDetailData } from '../services/dataService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProductDetail = asyncHandler((req: Request, res: Response) => {
  const { product } = req.params;
  if (product !== 'A' && product !== 'B') {
    return res.status(400).json({ error: 'Invalid product. Must be A or B' });
  }
  const data = loadProductDetailData(product);
  return res.json(data);
});

