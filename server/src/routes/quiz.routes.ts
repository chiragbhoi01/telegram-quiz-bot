import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', QuizController.getQuizzes);
router.get('/:id', QuizController.getQuizById);
router.post('/', QuizController.createQuiz);
router.put('/:id', QuizController.updateQuiz);
router.delete('/:id', QuizController.deleteQuiz);
router.post('/:id/publish', QuizController.publishQuiz);

export default router;
