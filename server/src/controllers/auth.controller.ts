import { Request, Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import { generateToken, getMasterAdminPassword } from '../utils/auth';

export class AuthController {
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { password, username = 'admin' } = req.body;

      if (!password) {
        res.status(400).json({ success: false, error: 'Password is required' });
        return;
      }

      const masterPassword = getMasterAdminPassword();
      const isValid = password === masterPassword;

      if (!isValid) {
        res.status(401).json({ success: false, error: 'Invalid admin password' });
        return;
      }

      const token = generateToken({ username: String(username), role: 'admin' });

      res.json({
        success: true,
        token,
        user: { username: String(username), role: 'admin' },
        message: 'Login successful',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Login failed' });
    }
  }

  public static async me(req: IAuthRequest, res: Response): Promise<void> {
    res.json({
      success: true,
      user: req.user,
    });
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}
