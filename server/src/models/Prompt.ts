import mongoose, { Document, Schema } from 'mongoose';

export interface IPromptDocument extends Document {
  title: string;
  category: string;
  description: string;
  content: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromptSchema = new Schema<IPromptDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'General Rajasthan GK',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Prompt = mongoose.model<IPromptDocument>('Prompt', PromptSchema);
