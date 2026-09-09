import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export interface IAuthRequest extends Request {
  user?: { username: string; role: string };
}

export const requireAuth = (req: IAuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized: Authentication token is required.' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token.' });
    return;
  }

  req.user = decoded;
  next();
};
