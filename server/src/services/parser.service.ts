import { IQuestionInput } from '../types';

export class ParserService {
  /**
   * Parse raw text input (JSON, Markdown JSON, or Legacy questions.txt format)
   */
  public static parse(input: string): { questions: IQuestionInput[]; format: 'json' | 'legacy_txt' | 'unknown' } {
    const trimmed = input.trim();
    if (!trimmed) {
      return { questions: [], format: 'unknown' };
    }

    // 1. Try parsing JSON (including markdown-wrapped JSON)
    const jsonResult = this.tryParseJson(trimmed);
    if (jsonResult && jsonResult.length > 0) {
      return { questions: jsonResult, format: 'json' };
    }

    // 2. Try parsing Legacy Text format
    const legacyResult = this.tryParseLegacyTxt(trimmed);
    if (legacyResult && legacyResult.length > 0) {
      return { questions: legacyResult, format: 'legacy_txt' };
    }

    return { questions: [], format: 'unknown' };
  }

  /**
   * Extract and parse JSON from string (handling markdown fences if present)
   */
  public static tryParseJson(text: string): IQuestionInput[] | null {
    let cleanText = text.trim();

    // Check if there is a markdown code block anywhere in the text
    const fenceMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      cleanText = fenceMatch[1].trim();
    } else {
      // If no fence, but contains JSON array or object
      const firstBracket = cleanText.search(/[\{\[]/);
      const lastBracket = Math.max(cleanText.lastIndexOf('}'), cleanText.lastIndexOf(']'));
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1).trim();
      }
    }

    try {
      const parsed = JSON.parse(cleanText);
      let rawList: any[] = [];

      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (parsed && Array.isArray(parsed.questions)) {
        rawList = parsed.questions;
      } else if (parsed && typeof parsed === 'object') {
        // Maybe single question object
        if (parsed.question && parsed.options) {
          rawList = [parsed];
        }
      }

      if (rawList.length === 0) return null;

      return rawList.map((item) => ({
        question: String(item.question || item.questionText || item.title || '').trim(),
        options: Array.isArray(item.options) ? item.options.map((opt: any) => String(opt).trim()) : [],
        correctAnswer: item.correctAnswer ?? item.correctOption ?? item.answer ?? '',
        explanation: item.explanation ? String(item.explanation).trim() : '',
        category: item.category ? String(item.category).trim() : 'Rajasthan GK',
        exam: item.exam ? String(item.exam).trim() : 'General',
        difficulty: item.difficulty || 'Medium',
        source: item.source || 'Claude Prompt',
      }));
    } catch {
      return null;
    }
  }

  /**
   * Parse legacy questions.txt format
   * Supports:
   * Q1. Question text
   *  A) Option A
   *  B) Option B
   *  C) Option C
   *  D) Option D
   *  ANSWER: C
   *  [Optional EXPLANATION: ...]
   */
  public static tryParseLegacyTxt(text: string): IQuestionInput[] | null {
    const questions: IQuestionInput[] = [];

    // Split by question headers: Q1. or Q 1. or 1. or Q1)
    // Regex matching full question blocks
    const blockPattern = /(?:^|\n)\s*(?:Q\s*\d+[\.\)]|\d+[\.\)])\s*(.*?)(?=\n\s*(?:Q\s*\d+[\.\)]|\d+[\.\)])|$)/gis;
    
    // Find all blocks
    const blocks: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = blockPattern.exec(text)) !== null) {
      if (match[0].trim()) {
        blocks.push(match[0].trim());
      }
    }

    if (blocks.length === 0) {
      // Fallback: try legacy regex from Python script
      const legacyPattern = /Q\d+\.\s*(.*?)\n\s*A\)\s*(.*?)\n\s*B\)\s*(.*?)\n\s*C\)\s*(.*?)\n\s*D\)\s*(.*?)\n\s*ANSWER:\s*([ABCD])/gis;
      let legacyMatch: RegExpExecArray | null;
      while ((legacyMatch = legacyPattern.exec(text)) !== null) {
        const [, qText, a, b, c, d, ans] = legacyMatch;
        questions.push({
          question: qText.trim(),
          options: [a.trim(), b.trim(), c.trim(), d.trim()],
          correctAnswer: ans.trim().toUpperCase(),
          explanation: '',
          category: 'Rajasthan GK',
          exam: 'General',
          difficulty: 'Medium',
          source: 'questions.txt legacy',
        });
      }
      return questions.length > 0 ? questions : null;
    }

    for (const block of blocks) {
      const q = this.parseSingleLegacyBlock(block);
      if (q) {
        questions.push(q);
      }
    }

    return questions.length > 0 ? questions : null;
  }

  private static parseSingleLegacyBlock(block: string): IQuestionInput | null {
    // Extract Question line(s) before Option A
    const optAMatch = block.search(/\n\s*[\(\[]?[A1][\)\.]\s*/i);
    if (optAMatch === -1) return null;

    let questionHeader = block.substring(0, optAMatch).trim();
    // Remove leading Q1. or 1.
    questionHeader = questionHeader.replace(/^(?:Q\s*\d+[\.\)]|\d+[\.\)])\s*/i, '').trim();

    // Extract options A, B, C, D
    const optRegex = /[\(\[]?([A-D])[\)\.]\s*(.*?)(?=(?:\n\s*[\(\[]?[A-D][\)\.]|\n\s*ANSWER|\n\s*उत्तर|$))/gi;
    const optionsMap: Record<string, string> = {};
    let optMatch: RegExpExecArray | null;
    while ((optMatch = optRegex.exec(block)) !== null) {
      const key = optMatch[1].toUpperCase();
      optionsMap[key] = optMatch[2].trim();
    }

    const options = [
      optionsMap['A'] || '',
      optionsMap['B'] || '',
      optionsMap['C'] || '',
      optionsMap['D'] || '',
    ];

    // Extract Answer
    const ansMatch = block.match(/(?:ANSWER|उत्तर|Ans|Correct)\s*[:=-]?\s*([A-D])/i);
    const correctAnswer = ansMatch ? ansMatch[1].toUpperCase() : '';

    // Extract Explanation if present
    const expMatch = block.match(/(?:EXPLANATION|व्याख्या|HINT|विवरण)\s*[:=-]?\s*([\s\S]*?)$/i);
    const explanation = expMatch ? expMatch[1].trim() : '';

    if (!questionHeader && options.every((o) => !o)) {
      return null;
    }

    return {
      question: questionHeader,
      options,
      correctAnswer,
      explanation,
      category: 'Rajasthan GK',
      exam: 'General',
      difficulty: 'Medium',
      source: 'Legacy Import',
    };
  }
}
