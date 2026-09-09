import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

export const connectDB = async (uri?: string): Promise<void> => {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rajasthan_exam_twister';
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }
    await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB connected successfully to: ${mongoUri.includes('@') ? 'Remote Cluster' : mongoUri}`);
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    // Don't crash immediately during tests/local fallback
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
