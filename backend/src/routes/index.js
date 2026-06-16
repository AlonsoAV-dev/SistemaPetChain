import { Router } from 'express';
import adminRoutes from '../modules/admin/admin.routes.js';
import adoptionsRoutes from '../modules/adoptions/adoptions.routes.js';
import articlesRoutes from '../modules/articles/articles.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import commentsRoutes from '../modules/comments/comments.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import eventsRoutes from '../modules/events/events.routes.js';
import lostPetsRoutes from '../modules/lostPets/lostPets.routes.js';
import interactionsRoutes from '../modules/interactions/interactions.routes.js';
import mediaRoutes from '../modules/media/media.routes.js';
import responsibleActionsRoutes from '../modules/responsibleActions/responsibleActions.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/comments', commentsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/lost-pets', lostPetsRoutes);
router.use('/interactions', interactionsRoutes);
router.use('/media', mediaRoutes);
router.use('/adoptions', adoptionsRoutes);
router.use('/responsible-actions', responsibleActionsRoutes);
router.use('/articles', articlesRoutes);
router.use('/events', eventsRoutes);
router.use('/admin', adminRoutes);

export default router;

