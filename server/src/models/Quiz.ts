import mongoose, { Document, Schema } from 'mongoose';
import { QuizStatus } from '../types';

export interface IQuizDocument extends Document {
  customId: string;
  title: string;
  subject: string;
  status: QuizStatus;
  questionCount: number;
  publishDelaySeconds: number;
  publishedAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuizDocument>(
  {
    customId: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'publishing', 'published', 'failed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    questionCount: {
      type: Number,
      default: 0,
    },
    publishDelaySeconds: {
      type: Number,
      default: 2,
    },
    publishedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Quiz = mongoose.model<IQuizDocument>('Quiz', QuizSchema);
