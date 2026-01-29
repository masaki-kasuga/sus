import { Request, Response } from 'express';
// For displaying sample data from JSON file
// import { loadDashboardData } from '../services/dataService.js';
import { loadDashboardData } from '../services/dashboardService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await loadDashboardData();
  res.json(data);
});

