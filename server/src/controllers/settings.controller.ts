import { Request, Response } from 'express';
import { Settings } from '../models/Settings';
import { TelegramService } from '../services/telegram.service';

export class SettingsController {
  public static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = new Settings({
          defaultSubject: TelegramService.getDefaultSubject(),
          defaultPublishDelaySeconds: 2,
          telegramDryRun: TelegramService.isDryRun(),
          targetChatId: TelegramService.getChatId(),
        });
        await settings.save();
      }

      const telegramStatus = await TelegramService.getStatus();

      res.json({
        success: true,
        data: {
          settings,
          telegram: telegramStatus,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch settings' });
    }
  }

  public static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { defaultSubject, defaultPublishDelaySeconds, telegramDryRun, targetChatId } = req.body;

      let settings = await Settings.findOne();
      if (!settings) {
        settings = new Settings();
      }

      if (defaultSubject !== undefined) settings.defaultSubject = String(defaultSubject).trim();
      if (defaultPublishDelaySeconds !== undefined) {
        settings.defaultPublishDelaySeconds = Math.max(1, Math.min(60, Number(defaultPublishDelaySeconds) || 2));
      }
      if (telegramDryRun !== undefined) {
        settings.telegramDryRun = Boolean(telegramDryRun);
        process.env.TELEGRAM_DRY_RUN = String(telegramDryRun);
      }
      if (targetChatId !== undefined) settings.targetChatId = String(targetChatId).trim();

      await settings.save();

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: settings,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to update settings' });
    }
  }
}
