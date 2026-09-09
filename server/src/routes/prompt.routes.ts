import { Router } from 'express';
import { PromptController } from '../controllers/prompt.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', PromptController.getPrompts);
router.post('/', PromptController.createPrompt);
router.put('/:id', PromptController.updatePrompt);
router.delete('/:id', PromptController.deletePrompt);
router.post('/reset-default', PromptController.resetDefaultPrompt);

export default router;
