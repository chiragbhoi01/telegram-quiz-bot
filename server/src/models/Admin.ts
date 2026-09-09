import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminDocument extends Document {
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdminDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      default: 'admin',
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Admin = mongoose.model<IAdminDocument>('Admin', AdminSchema);
