import { Request, Response } from 'express';
import { Question } from '../models/Question';
import { Quiz } from '../models/Quiz';

export class DashboardController {
  public static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalQuestions,
        unusedQuestions,
        usedQuestions,
        archivedQuestions,
        totalQuizzes,
        publishedQuizzes,
        draftQuizzes,
        failedQuizzes,
        recentQuizzes,
        recentQuestions,
      ] = await Promise.all([
        Question.countDocuments({ status: { $ne: 'archived' } }),
        Question.countDocuments({ status: 'unused' }),
        Question.countDocuments({ status: 'used' }),
        Question.countDocuments({ status: 'archived' }),
        Quiz.countDocuments(),
        Quiz.countDocuments({ status: 'published' }),
        Quiz.countDocuments({ status: 'draft' }),
        Quiz.countDocuments({ status: 'failed' }),
        Quiz.find().sort({ createdAt: -1 }).limit(5).lean(),
        Question.find().sort({ createdAt: -1 }).limit(5).lean(),
      ]);

      res.json({
        success: true,
        data: {
          questions: {
            total: totalQuestions,
            unused: unusedQuestions,
            used: usedQuestions,
            archived: archivedQuestions,
          },
          quizzes: {
            total: totalQuizzes,
            published: publishedQuizzes,
            draft: draftQuizzes,
            failed: failedQuizzes,
          },
          recentQuizzes,
          recentQuestions,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch dashboard stats' });
    }
  }
}
