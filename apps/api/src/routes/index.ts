import { Router } from 'express';
import dashboardRoutes from './dashboard.js';
import wasteRoutes from './waste.js';
import productRoutes from './product.js';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/waste', wasteRoutes);
router.use('/product', productRoutes);

export default router;

