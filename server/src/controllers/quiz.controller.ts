import { Request, Response } from 'express';
import { Quiz } from '../models/Quiz';
import { QuizQuestion } from '../models/QuizQuestion';
import { Question } from '../models/Question';
import { TelegramService } from '../services/telegram.service';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class QuizController {
  /**
   * Create Draft Quiz
   */
  public static async createQuiz(req: Request, res: Response): Promise<void> {
    try {
      const { title, subject, questionIds, publishDelaySeconds = 2, notes } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ success: false, error: 'Quiz title is required' });
        return;
      }

      const finalSubject = (subject || '').trim();

      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        res.status(400).json({ success: false, error: 'At least 1 question must be selected for the quiz' });
        return;
      }

      // Generate custom quiz ID e.g. QZ-001 or Quiz #1
      const totalQuizzes = await Quiz.countDocuments();
      const customId = `Quiz #${totalQuizzes + 1}`;

      const quiz = new Quiz({
        customId,
        title: title.trim(),
        subject: finalSubject,
        status: 'draft',
        questionCount: questionIds.length,
        publishDelaySeconds: Number(publishDelaySeconds) || 2,
        notes: notes || '',
      });

      await quiz.save();

      // Create QuizQuestion relationships
      const quizQuestions = [];
      for (let i = 0; i < questionIds.length; i++) {
        const qq = new QuizQuestion({
          quizId: quiz._id,
          questionId: questionIds[i],
          order: i + 1,
          status: 'pending',
        });
        quizQuestions.push(qq);
      }
      await QuizQuestion.insertMany(quizQuestions);

      res.status(201).json({
        success: true,
        message: 'Draft quiz created successfully',
        data: quiz,
      });
    } catch (err: any) {
      console.error('[QuizController.createQuiz]', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to create quiz' });
    }
  }

  /**
   * Get Quizzes with pagination & status filters
   */
  public static async getQuizzes(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20', status, search } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};
      if (status && status !== 'all') {
        filter.status = status;
      }
      if (search && typeof search === 'string' && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [{ title: regex }, { subject: regex }, { customId: regex }];
      }

      const [quizzes, total] = await Promise.all([
        Quiz.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        Quiz.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: quizzes,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch quizzes' });
    }
  }

  /**
   * Get Quiz by ID with all populated questions & publishing stats
   */
  public static async getQuizById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quiz = await Quiz.findById(id).lean();

      if (!quiz) {
        res.status(404).json({ success: false, error: 'Quiz not found' });
        return;
      }

      const quizQuestions = await QuizQuestion.find({ quizId: quiz._id })
        .sort({ order: 1 })
        .populate('questionId')
        .lean();

      res.json({
        success: true,
        data: {
          ...quiz,
          questions: quizQuestions.map((qq: any) => ({
            quizQuestionId: qq._id,
            order: qq.order,
            status: qq.status,
            telegramMessageId: qq.telegramMessageId,
            telegramPollId: qq.telegramPollId,
            sentAt: qq.sentAt,
            error: qq.error,
            question: qq.questionId,
          })),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch quiz' });
    }
  }

  /**
   * Update Quiz details (if still draft)
   */
  public static async updateQuiz(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, subject, questionIds, publishDelaySeconds, notes } = req.body;

      const quiz = await Quiz.findById(id);
      if (!quiz) {
        res.status(404).json({ success: false, error: 'Quiz not found' });
        return;
      }

      if (quiz.status === 'publishing') {
        res.status(400).json({ success: false, error: 'Cannot edit a quiz that is currently publishing' });
        return;
      }

      if (title !== undefined && title.trim()) quiz.title = title.trim();
      if (subject !== undefined) quiz.subject = subject.trim();
      if (notes !== undefined) quiz.notes = notes;
      if (publishDelaySeconds) quiz.publishDelaySeconds = Number(publishDelaySeconds);

      if (Array.isArray(questionIds) && questionIds.length > 0) {
        // Replace existing question associations
        await QuizQuestion.deleteMany({ quizId: quiz._id });
        const newQQs = questionIds.map((qId: string, idx: number) => ({
          quizId: quiz._id,
          questionId: qId,
          order: idx + 1,
          status: 'pending',
        }));
        await QuizQuestion.insertMany(newQQs);
        quiz.questionCount = questionIds.length;
      }

      await quiz.save();

      res.json({
        success: true,
        message: 'Quiz updated successfully',
        data: quiz,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to update quiz' });
    }
  }

  /**
   * Delete Quiz (only if draft or failed)
   */
  public static async deleteQuiz(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quiz = await Quiz.findById(id);
      if (!quiz) {
        res.status(404).json({ success: false, error: 'Quiz not found' });
        return;
      }

      await Promise.all([
        Quiz.findByIdAndDelete(id),
        QuizQuestion.deleteMany({ quizId: id }),
      ]);

      res.json({
        success: true,
        message: 'Quiz deleted successfully',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to delete quiz' });
    }
  }

  /**
   * Publish Quiz to Telegram with rate-limiting and progress tracking
   */
  public static async publishQuiz(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quiz = await Quiz.findById(id);

      if (!quiz) {
        res.status(404).json({ success: false, error: 'Quiz not found' });
        return;
      }

      if (quiz.status === 'publishing') {
        res.status(400).json({ success: false, error: 'Quiz is currently publishing' });
        return;
      }

      const quizQuestions = await QuizQuestion.find({ quizId: quiz._id })
        .sort({ order: 1 })
        .populate('questionId');

      if (quizQuestions.length === 0) {
        res.status(400).json({ success: false, error: 'No questions assigned to this quiz' });
        return;
      }

      // Mark quiz as publishing
      quiz.status = 'publishing';
      quiz.publishedAt = quiz.publishedAt || new Date();
      await quiz.save();

      const delayMs = (quiz.publishDelaySeconds || 2) * 1000;
      const results = [];
      let failureCount = 0;

      for (let i = 0; i < quizQuestions.length; i++) {
        const qq: any = quizQuestions[i];
        const qDoc: any = qq.questionId;

        if (!qDoc) {
          qq.status = 'failed';
          qq.error = 'Question document not found';
          await qq.save();
          failureCount++;
          continue;
        }

        // Send to Telegram (or Mock in Dry Run mode)
        const publishResult = await TelegramService.sendQuizPoll({
          subject: quiz.subject,
          questionText: qDoc.questionText,
          options: qDoc.options,
          correctOptionId: qDoc.correctOption,
          explanation: qDoc.explanation,
        });

        if (publishResult.success) {
          qq.status = 'sent';
          qq.telegramMessageId = publishResult.messageId;
          qq.telegramPollId = publishResult.pollId;
          qq.sentAt = new Date();
          qq.error = undefined;
          await qq.save();

          // Update question usage stats
          await Question.findByIdAndUpdate(qDoc._id, {
            $inc: { usageCount: 1 },
            $set: { lastUsedAt: new Date(), status: 'used' },
          });

          results.push({
            order: qq.order,
            customId: qDoc.customId,
            success: true,
            messageId: publishResult.messageId,
          });
        } else {
          qq.status = 'failed';
          qq.error = publishResult.error || 'Failed to send poll';
          await qq.save();
          failureCount++;

          results.push({
            order: qq.order,
            customId: qDoc.customId,
            success: false,
            error: publishResult.error,
          });
        }

        // Wait rate-limiting interval between polls (skip after last question)
        if (i < quizQuestions.length - 1) {
          await delay(delayMs);
        }
      }

      quiz.status = failureCount === 0 ? 'published' : (failureCount === quizQuestions.length ? 'failed' : 'published');
      quiz.completedAt = new Date();
      await quiz.save();

      res.json({
        success: failureCount === 0,
        message: failureCount === 0
          ? `Successfully published all ${quizQuestions.length} questions to Telegram.`
          : `Published with ${failureCount} errors out of ${quizQuestions.length} questions.`,
        isDryRun: TelegramService.isDryRun(),
        total: quizQuestions.length,
        sent: quizQuestions.length - failureCount,
        failed: failureCount,
        results,
      });
    } catch (err: any) {
      console.error('[QuizController.publishQuiz]', err);
      if (req.params.id) {
        await Quiz.findByIdAndUpdate(req.params.id, { status: 'failed' });
      }
      res.status(500).json({ success: false, error: err.message || 'Quiz publication failed' });
    }
  }
}
