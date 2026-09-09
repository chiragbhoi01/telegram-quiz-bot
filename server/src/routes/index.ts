import { Router } from 'express';
import authRoutes from './auth.routes';
import questionRoutes from './question.routes';
import quizRoutes from './quiz.routes';
import promptRoutes from './prompt.routes';
import dashboardRoutes from './dashboard.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/questions', questionRoutes);
router.use('/quizzes', quizRoutes);
router.use('/prompts', promptRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);

export default router;
