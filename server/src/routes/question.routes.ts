import { Router } from 'express';
import { QuestionController } from '../controllers/question.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', QuestionController.getQuestions);
router.get('/:id', QuestionController.getQuestionById);
router.post('/import/preview', QuestionController.previewImport);
router.post('/import/confirm', QuestionController.confirmImport);
router.post('/import/legacy-file', QuestionController.importLegacyFile);
router.put('/:id', QuestionController.updateQuestion);
router.post('/:id/archive', QuestionController.archiveQuestion);
router.delete('/:id', QuestionController.deleteQuestion);

export default router;
