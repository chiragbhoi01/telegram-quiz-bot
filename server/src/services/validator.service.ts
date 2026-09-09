import { IQuestionInput, IValidatedQuestion, Difficulty } from '../types';
import { DedupeService } from './dedupe.service';

export class ValidatorService {
  public static readonly MAX_QUESTION_LENGTH = 300;
  public static readonly MAX_OPTION_LENGTH = 100;
  public static readonly MAX_EXPLANATION_LENGTH = 200;

  /**
   * Validates a single question input and normalizes it
   */
  public static validate(input: IQuestionInput): IValidatedQuestion {
    const errors: string[] = [];

    const questionText = (input.question || '').trim();
    if (!questionText) {
      errors.push('Question text cannot be empty.');
    } else if (questionText.length > this.MAX_QUESTION_LENGTH) {
      errors.push(`Question exceeds Telegram character limit (${questionText.length}/${this.MAX_QUESTION_LENGTH} chars).`);
    }

    const optionsRaw = Array.isArray(input.options) ? input.options : [];
    if (optionsRaw.length !== 4) {
      errors.push(`Exactly 4 options are required, but found ${optionsRaw.length}.`);
    }

    const options: [string, string, string, string] = [
      (optionsRaw[0] || '').trim(),
      (optionsRaw[1] || '').trim(),
      (optionsRaw[2] || '').trim(),
      (optionsRaw[3] || '').trim(),
    ];

    options.forEach((opt, idx) => {
      const letter = String.fromCharCode(65 + idx);
      if (!opt) {
        errors.push(`Option ${letter} cannot be empty.`);
      } else if (opt.length > this.MAX_OPTION_LENGTH) {
        errors.push(`Option ${letter} exceeds Telegram character limit (${opt.length}/${this.MAX_OPTION_LENGTH} chars).`);
      }
    });

    let correctOption = -1;
    if (typeof input.correctAnswer === 'number') {
      if (input.correctAnswer >= 0 && input.correctAnswer <= 3) {
        correctOption = input.correctAnswer;
      }
    } else if (typeof input.correctAnswer === 'string') {
      const cleanAns = input.correctAnswer.trim().toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(cleanAns)) {
        correctOption = cleanAns.charCodeAt(0) - 65;
      } else if (['0', '1', '2', '3'].includes(cleanAns)) {
        correctOption = parseInt(cleanAns, 10);
      }
    }

    if (correctOption === -1) {
      errors.push(`Valid correct answer ('A', 'B', 'C', or 'D') is required.`);
    }

    const explanation = (input.explanation || '').trim();
    if (explanation.length > this.MAX_EXPLANATION_LENGTH) {
      errors.push(`Explanation exceeds Telegram limit (${explanation.length}/${this.MAX_EXPLANATION_LENGTH} chars).`);
    }

    let difficulty: Difficulty = 'Medium';
    if (input.difficulty && ['Easy', 'Medium', 'Hard'].includes(input.difficulty)) {
      difficulty = input.difficulty as Difficulty;
    }

    const category = (input.category || 'Rajasthan GK').trim();
    const exam = (input.exam || 'General').trim();
    const source = (input.source || 'Claude Prompt').trim();
    const normalizedText = DedupeService.normalize(questionText);

    return {
      questionText,
      options,
      correctOption: correctOption !== -1 ? correctOption : 0,
      explanation,
      category,
      exam,
      difficulty,
      source,
      normalizedText,
      isValid: errors.length === 0,
      validationErrors: errors,
    };
  }

  /**
   * Batch validate a list of question inputs
   */
  public static validateBatch(inputs: IQuestionInput[]): IValidatedQuestion[] {
    return inputs.map((input) => this.validate(input));
  }
}
