import mongoose, { Document, Schema } from 'mongoose';
import { Difficulty, QuestionStatus } from '../types';

export interface IQuestionDocument extends Document {
  customId: string;
  questionText: string;
  options: [string, string, string, string];
  correctOption: number;
  explanation: string;
  category: string;
  exam: string;
  source: string;
  difficulty: Difficulty;
  normalizedText: string;
  status: QuestionStatus;
  usageCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestionDocument>(
  {
    customId: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length === 4,
        message: 'Exactly 4 options are required.',
      },
    },
    correctOption: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'Rajasthan GK',
      index: true,
      trim: true,
    },
    exam: {
      type: String,
      default: 'General',
      index: true,
      trim: true,
    },
    source: {
      type: String,
      default: 'Claude Prompt',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
      index: true,
    },
    normalizedText: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['unused', 'used', 'archived'],
      default: 'unused',
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

QuestionSchema.index({ questionText: 'text' });

export const Question = mongoose.model<IQuestionDocument>('Question', QuestionSchema);
