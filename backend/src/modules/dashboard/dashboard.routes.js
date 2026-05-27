import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

router.get('/', asyncHandler(dashboardController.getDashboard));
router.get('/summary', asyncHandler(dashboardController.getSummary));
router.get('/activity', asyncHandler(dashboardController.getActivity));

export default router;

