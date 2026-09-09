import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db';
import { Question } from '../models/Question';
import { ParserService } from '../services/parser.service';
import { ValidatorService } from '../services/validator.service';
import { DedupeService } from '../services/dedupe.service';

dotenv.config();

export async function runLegacyMigration(): Promise<{ imported: number; skipped: number; total: number }> {
  console.log('[Migration] Starting legacy questions.txt migration...');

  const candidates = [
    path.join(__dirname, '..', '..', '..', 'questions.txt'),
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
    console.error('[Migration] ❌ questions.txt file not found.');
    return { imported: 0, skipped: 0, total: 0 };
  }

  const fileText = fs.readFileSync(filePath, 'utf-8');
  const { questions: parsedInputs } = ParserService.parse(fileText);

  console.log(`[Migration] Parsed ${parsedInputs.length} questions from ${path.basename(filePath)}`);

  const validatedList = ValidatorService.validateBatch(parsedInputs);
  const withDuplicates = await DedupeService.detectDuplicates(validatedList);

  let imported = 0;
  let skipped = 0;

  const totalInDb = await Question.countDocuments();
  let nextIdNum = totalInDb + 1;

  for (const q of withDuplicates) {
    if (!q.isValid || q.isDuplicate) {
      skipped++;
      continue;
    }

    let customId = `Q-${String(nextIdNum).padStart(4, '0')}`;
    while (await Question.findOne({ customId })) {
      nextIdNum++;
      customId = `Q-${String(nextIdNum).padStart(4, '0')}`;
    }

    const doc = new Question({
      customId,
      questionText: q.questionText,
      options: q.options,
      correctOption: q.correctOption,
      explanation: q.explanation || '',
      category: '',
      exam: 'General Rajasthan GK',
      source: 'questions.txt legacy',
      difficulty: 'Medium',
      normalizedText: q.normalizedText,
      status: 'unused',
      usageCount: 0,
    });

    await doc.save();
    imported++;
    nextIdNum++;
  }

  console.log(`[Migration] ✅ Finished! Imported: ${imported}, Skipped: ${skipped}, Total Parsed: ${withDuplicates.length}`);
  return { imported, skipped, total: withDuplicates.length };
}

if (require.main === module) {
  (async () => {
    await connectDB();
    await runLegacyMigration();
    await disconnectDB();
  })();
}
