import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Question } from '../models/Question';
import { QuizQuestion } from '../models/QuizQuestion';
import { Quiz } from '../models/Quiz';
import { ParserService } from '../services/parser.service';
import { ValidatorService } from '../services/validator.service';
import { DedupeService } from '../services/dedupe.service';
import { IImportPreviewResult, IQuestionInput, IValidatedQuestion } from '../types';

export class QuestionController {
  /**
   * Preview and Validate Import (Paste text or Uploaded File content)
   */
  public static async previewImport(req: Request, res: Response): Promise<void> {
    try {
      const { text, defaultCategory, defaultExam, defaultDifficulty } = req.body;

      if (!text || !text.trim()) {
        res.status(400).json({ success: false, error: 'No question text provided for import.' });
        return;
      }

      const { questions: parsedInputs, format } = ParserService.parse(text);

      if (parsedInputs.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Could not parse any questions. Please check the JSON or TXT format.',
        });
        return;
      }

      // Apply default metadata if provided
      const processedInputs: IQuestionInput[] = parsedInputs.map((q) => ({
        ...q,
        category: defaultCategory?.trim() || q.category || 'Rajasthan GK',
        exam: defaultExam?.trim() || q.exam || 'General',
        difficulty: defaultDifficulty || q.difficulty || 'Medium',
      }));

      // Validate questions
      const validatedList = ValidatorService.validateBatch(processedInputs);

      // Check for duplicates
      const finalQuestions = await DedupeService.detectDuplicates(validatedList);

      const validCount = finalQuestions.filter((q) => q.isValid && !q.isDuplicate).length;
      const invalidCount = finalQuestions.filter((q) => !q.isValid).length;
      const duplicateCount = finalQuestions.filter((q) => q.isDuplicate).length;

      const previewResult: IImportPreviewResult = {
        totalParsed: finalQuestions.length,
        validCount,
        invalidCount,
        duplicateCount,
        questions: finalQuestions,
      };

      res.json({
        success: true,
        format,
        data: previewResult,
      });
    } catch (err: any) {
      console.error('[QuestionController.previewImport]', err);
      res.status(500).json({ success: false, error: err.message || 'Import preview failed' });
    }
  }

  /**
   * Confirm and Save Validated Questions to Question Pool
   */
  public static async confirmImport(req: Request, res: Response): Promise<void> {
    try {
      const { questions, skipDuplicates = true } = req.body;

      if (!Array.isArray(questions) || questions.length === 0) {
        res.status(400).json({ success: false, error: 'No questions provided to confirm.' });
        return;
      }

      // Get current max custom ID count
      const totalInDb = await Question.countDocuments();
      let nextIdNum = totalInDb + 1;

      const savedQuestions = [];
      const skippedQuestions = [];

      for (const q of questions) {
        if (q.isValid === false) {
          skippedQuestions.push({ questionText: q.questionText, reason: 'Invalid question format' });
          continue;
        }

        if (q.isDuplicate && skipDuplicates) {
          skippedQuestions.push({ questionText: q.questionText, reason: 'Duplicate question skipped' });
          continue;
        }

        // Generate unique custom ID like Q-0001
        let customId = `Q-${String(nextIdNum).padStart(4, '0')}`;
        // Ensure uniqueness in case of race
        while (await Question.findOne({ customId })) {
          nextIdNum++;
          customId = `Q-${String(nextIdNum).padStart(4, '0')}`;
        }

        const newQuestion = new Question({
          customId,
          questionText: q.questionText.trim(),
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation || '',
          category: q.category || 'Rajasthan GK',
          exam: q.exam || 'General',
          source: q.source || 'Claude Prompt',
          difficulty: q.difficulty || 'Medium',
          normalizedText: q.normalizedText || DedupeService.normalize(q.questionText),
          status: 'unused',
          usageCount: 0,
        });

        await newQuestion.save();
        savedQuestions.push(newQuestion);
        nextIdNum++;
      }

      res.json({
        success: true,
        message: `Successfully imported ${savedQuestions.length} questions.`,
        importedCount: savedQuestions.length,
        skippedCount: skippedQuestions.length,
        data: savedQuestions,
      });
    } catch (err: any) {
      console.error('[QuestionController.confirmImport]', err);
      res.status(500).json({ success: false, error: err.message || 'Import confirmation failed' });
    }
  }

  /**
   * One-click Import of legacy questions.txt
   */
  public static async importLegacyFile(req: Request, res: Response): Promise<void> {
    try {
      const candidates = [
        path.join(process.cwd(), 'questions.txt'),
        path.join(process.cwd(), '..', 'questions.txt'),
      ];

      let filePath = '';
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          filePath = p;
          break;
        }
      }

      if (!filePath) {
        res.status(404).json({ success: false, error: 'questions.txt file not found on server.' });
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { questions: parsedInputs } = ParserService.parse(fileContent);

      if (parsedInputs.length === 0) {
        res.status(400).json({ success: false, error: 'No questions could be extracted from questions.txt' });
        return;
      }

      const validatedList = ValidatorService.validateBatch(parsedInputs);
      const withDuplicates = await DedupeService.detectDuplicates(validatedList);

      res.json({
        success: true,
        message: `Found ${parsedInputs.length} legacy questions in questions.txt`,
        data: {
          totalParsed: withDuplicates.length,
          validCount: withDuplicates.filter((q) => q.isValid && !q.isDuplicate).length,
          duplicateCount: withDuplicates.filter((q) => q.isDuplicate).length,
          questions: withDuplicates,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Legacy file import failed' });
    }
  }

  /**
   * Get Question Pool with filters, search, and pagination
   */
  public static async getQuestions(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        status,
        category,
        exam,
        difficulty,
        search,
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};

      if (status && status !== 'all') {
        filter.status = status;
      }

      if (category && category !== 'all') {
        filter.category = category;
      }

      if (exam && exam !== 'all') {
        filter.exam = exam;
      }

      if (difficulty && difficulty !== 'all') {
        filter.difficulty = difficulty;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { questionText: regex },
          { customId: regex },
          { category: regex },
          { exam: regex },
        ];
      }

      const [questions, total] = await Promise.all([
        Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        Question.countDocuments(filter),
      ]);

      // Collect available filter options for dynamic UI dropdowns
      const [categories, exams] = await Promise.all([
        Question.distinct('category'),
        Question.distinct('exam'),
      ]);

      res.json({
        success: true,
        data: questions,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          categories,
          exams,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch questions' });
    }
  }

  /**
   * Get single question with full usage details ("Used In Quizzes")
   */
  public static async getQuestionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const question = await Question.findById(id).lean();

      if (!question) {
        res.status(404).json({ success: false, error: 'Question not found' });
        return;
      }

      // Query quizzes this question was used in
      const quizQuestions = await QuizQuestion.find({ questionId: question._id }).lean();
      const quizIds = quizQuestions.map((qq) => qq.quizId);
      const quizzes = await Quiz.find({ _id: { $in: quizIds } }).lean();

      const usedInQuizzes = quizzes.map((qz) => {
        const qqMatch = quizQuestions.find((qq) => String(qq.quizId) === String(qz._id));
        return {
          quizId: qz._id,
          customId: qz.customId,
          title: qz.title,
          subject: qz.subject,
          status: qz.status,
          publishedAt: qz.publishedAt,
          telegramMessageId: qqMatch?.telegramMessageId,
          sentAt: qqMatch?.sentAt,
        };
      });

      res.json({
        success: true,
        data: {
          ...question,
          usedInQuizzes,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch question' });
    }
  }

  /**
   * Update question
   */
  public static async updateQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { questionText, options, correctOption, explanation, category, exam, difficulty, status } = req.body;

      const question = await Question.findById(id);
      if (!question) {
        res.status(404).json({ success: false, error: 'Question not found' });
        return;
      }

      if (questionText) {
        question.questionText = questionText.trim();
        question.normalizedText = DedupeService.normalize(questionText);
      }
      if (Array.isArray(options) && options.length === 4) {
        question.options = options as [string, string, string, string];
      }
      if (typeof correctOption === 'number' && correctOption >= 0 && correctOption <= 3) {
        question.correctOption = correctOption;
      }
      if (explanation !== undefined) question.explanation = String(explanation).trim();
      if (category) question.category = String(category).trim();
      if (exam) question.exam = String(exam).trim();
      if (difficulty) question.difficulty = difficulty;
      if (status) question.status = status;

      await question.save();

      res.json({
        success: true,
        message: 'Question updated successfully',
        data: question,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to update question' });
    }
  }

  /**
   * Archive / Unarchive question
   */
  public static async archiveQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const question = await Question.findById(id);
      if (!question) {
        res.status(404).json({ success: false, error: 'Question not found' });
        return;
      }

      question.status = question.status === 'archived' ? (question.usageCount > 0 ? 'used' : 'unused') : 'archived';
      await question.save();

      res.json({
        success: true,
        message: `Question status updated to ${question.status}`,
        data: question,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to archive question' });
    }
  }

  /**
   * Delete question
   */
  public static async deleteQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const question = await Question.findById(id);
      if (!question) {
        res.status(404).json({ success: false, error: 'Question not found' });
        return;
      }

      // Check if used in published quizzes
      const isUsedInPublished = await QuizQuestion.exists({
        questionId: question._id,
        status: 'sent',
      });

      if (isUsedInPublished) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete question that has already been published in a Telegram quiz. You can Archive it instead.',
        });
        return;
      }

      await Promise.all([
        Question.findByIdAndDelete(id),
        QuizQuestion.deleteMany({ questionId: question._id }),
      ]);

      res.json({
        success: true,
        message: 'Question deleted successfully',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to delete question' });
    }
  }
}
