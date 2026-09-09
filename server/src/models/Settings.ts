import mongoose, { Document, Schema } from 'mongoose';

export interface ISettingsDocument extends Document {
  defaultSubject: string;
  defaultPublishDelaySeconds: number;
  telegramDryRun: boolean;
  targetChatId: string;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    defaultSubject: {
      type: String,
      default: '',
      trim: true,
    },
    defaultPublishDelaySeconds: {
      type: Number,
      default: 2,
      min: 1,
      max: 60,
    },
    telegramDryRun: {
      type: Boolean,
      default: true,
    },
    targetChatId: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Settings = mongoose.model<ISettingsDocument>('Settings', SettingsSchema);
