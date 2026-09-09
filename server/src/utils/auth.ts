import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'rajasthan_exam_twister_secure_jwt_secret_2026';
};

export const hashPassword = async (plain: string): Promise<string> => {
  return bcrypt.hash(plain, 10);
};

export const comparePassword = async (plain: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plain, hash);
};

export const generateToken = (payload: { username: string; role: string }): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
};

export const verifyToken = (token: string): { username: string; role: string } | null => {
  try {
    return jwt.verify(token, getJwtSecret()) as { username: string; role: string };
  } catch {
    return null;
  }
};

export const getMasterAdminPassword = (): string => {
  return process.env.ADMIN_PASSWORD || 'admin123';
};
