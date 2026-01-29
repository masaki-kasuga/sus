import { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';

// バリデーション結果をチェックするミドルウェア
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  return next();
};

// 分類ゴミカテゴリのバリデーション
export const validateCategory = [
  param('category')
    .isIn(['A', 'B'])
    .withMessage('Category must be A or B'),
  validate,
];

// 加工品のバリデーション
export const validateProduct = [
  param('product')
    .isIn(['A', 'B'])
    .withMessage('Product must be A or B'),
  validate,
];
