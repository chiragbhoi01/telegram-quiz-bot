import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', SettingsController.getSettings);
router.put('/', SettingsController.updateSettings);

export default router;
