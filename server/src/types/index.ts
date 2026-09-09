export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type QuestionStatus = 'unused' | 'used' | 'archived';

export type QuizStatus = 'draft' | 'publishing' | 'published' | 'failed' | 'cancelled';

export type QuizQuestionStatus = 'pending' | 'sent' | 'failed';

export interface IQuestionInput {
  question: string;
  options: string[];
  correctAnswer: string | number; // 'A'|'B'|'C'|'D' or 0|1|2|3
  explanation?: string;
  category?: string;
  exam?: string;
  difficulty?: Difficulty;
  source?: string;
}

export interface IValidatedQuestion {
  questionText: string;
  options: [string, string, string, string];
  correctOption: number; // 0, 1, 2, 3
  explanation: string;
  category: string;
  exam: string;
  difficulty: Difficulty;
  source: string;
  normalizedText: string;
  isValid: boolean;
  validationErrors: string[];
  isDuplicate?: boolean;
  duplicateQuestionId?: string;
  duplicateUsageCount?: number;
  duplicateQuizTitles?: string[];
}

export interface IImportPreviewResult {
  totalParsed: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  questions: IValidatedQuestion[];
}

export interface ITelegramPublishResult {
  success: boolean;
  messageId?: number;
  pollId?: string;
  error?: string;
  isDryRun: boolean;
}
