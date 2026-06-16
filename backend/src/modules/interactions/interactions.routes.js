import { Router } from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as controller from './interactions.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/notifications', asyncHandler(controller.listNotifications));
router.patch('/notifications/:id/read', asyncHandler(controller.markNotificationRead));
router.post('/adoptions/:publicationId/requests', asyncHandler(controller.createAdoptionRequest));
router.get('/adoptions/:publicationId/requests', asyncHandler(controller.listAdoptionRequests));
router.patch('/adoption-requests/:id', asyncHandler(controller.updateAdoptionRequest));
router.post('/lost-pets/:publicationId/reports', asyncHandler(controller.createLostPetReport));
router.get('/lost-pets/:publicationId/reports', asyncHandler(controller.listLostPetReports));
router.patch('/lost-pet-reports/:id', asyncHandler(controller.updateLostPetReport));

export default router;
