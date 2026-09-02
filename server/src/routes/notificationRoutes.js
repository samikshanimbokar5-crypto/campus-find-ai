import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listNotifications, readNotification } from '../controllers/notificationController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(listNotifications));
router.patch('/:id/read', asyncHandler(readNotification));
export default router;
