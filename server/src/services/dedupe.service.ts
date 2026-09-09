import { IValidatedQuestion } from '../types';
import { Question } from '../models/Question';
import { QuizQuestion } from '../models/QuizQuestion';
import { Quiz } from '../models/Quiz';

export class DedupeService {
  /**
   * Normalizes question text for robust comparison
   */
  public static normalize(text: string): string {
    if (!text) return '';
    return text
      .trim()
      // Remove leading Q1. or 1. or (1)
      .replace(/^(?:Q\s*\d+[\.\)]|\d+[\.\)]|\(\d+\))\s*/i, '')
      // Remove common punctuation and special quotes
      .replace(/['"“”‘’]/g, '')
      .replace(/[\?؟।!.,;:—–\-_]/g, ' ')
      // Collapse multiple whitespace
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Checks a batch of validated questions against database and against itself
   */
  public static async detectDuplicates(questions: IValidatedQuestion[]): Promise<IValidatedQuestion[]> {
    const seenInBatch = new Map<string, string>(); // normalizedText -> first occurrence index/tag

    const results: IValidatedQuestion[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = { ...questions[i] };
      const norm = q.normalizedText;

      if (!norm) {
        results.push(q);
        continue;
      }

      // 1. Check duplicate within the current batch
      if (seenInBatch.has(norm)) {
        q.isDuplicate = true;
        q.duplicateQuestionId = `Batch duplicate of Question #${seenInBatch.get(norm)}`;
        q.duplicateUsageCount = 0;
        q.duplicateQuizTitles = ['Current Import Batch'];
        results.push(q);
        continue;
      }
      seenInBatch.set(norm, String(i + 1));

      // 2. Check duplicate in MongoDB database
      try {
        const existing = await Question.findOne({ normalizedText: norm }).lean();
        if (existing) {
          q.isDuplicate = true;
          q.duplicateQuestionId = existing.customId;
          q.duplicateUsageCount = existing.usageCount || 0;

          // Find quizzes this question was used in
          const quizQuestions = await QuizQuestion.find({ questionId: existing._id }).lean();
          if (quizQuestions.length > 0) {
            const quizIds = quizQuestions.map((qq) => qq.quizId);
            const quizzes = await Quiz.find({ _id: { $in: quizIds } }).lean();
            q.duplicateQuizTitles = quizzes.map((qz) => `${qz.title} (${qz.customId})`);
          } else {
            q.duplicateQuizTitles = [];
          }
        }
      } catch (err) {
        console.error('[DedupeService] Error querying MongoDB for duplicates:', err);
      }

      results.push(q);
    }

    return results;
  }
}
