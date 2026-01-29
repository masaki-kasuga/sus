import { Router } from 'express';
import { getWasteDetail } from '../controllers/wasteController.js';
import { validateCategory } from '../middlewares/validation.js';

const router = Router();

router.get('/:category', validateCategory, getWasteDetail);

export default router;

