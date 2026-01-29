import { Router } from 'express';
import { getProductDetail } from '../controllers/productController.js';
import { validateProduct } from '../middlewares/validation.js';

const router = Router();

router.get('/:product', validateProduct, getProductDetail);

export default router;

