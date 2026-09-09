import mongoose, { Document, Schema, Types } from 'mongoose';
import { QuizQuestionStatus } from '../types';

export interface IQuizQuestionDocument extends Document {
  quizId: Types.ObjectId;
  questionId: Types.ObjectId;
  order: number;
  telegramMessageId?: number;
  telegramPollId?: string;
  status: QuizQuestionStatus;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestionDocument>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
    },
    telegramMessageId: {
      type: Number,
    },
    telegramPollId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
      index: true,
    },
    sentAt: {
      type: Date,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

QuizQuestionSchema.index({ quizId: 1, questionId: 1 });
QuizQuestionSchema.index({ quizId: 1, order: 1 });

export const QuizQuestion = mongoose.model<IQuizQuestionDocument>('QuizQuestion', QuizQuestionSchema);
