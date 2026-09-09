import axios from 'axios';
import dotenv from 'dotenv';
import { ITelegramPublishResult } from '../types';

dotenv.config();

export interface ISendPollParams {
  chatId?: string;
  subject?: string;
  questionText: string;
  options: [string, string, string, string];
  correctOptionId: number;
  explanation?: string;
}

export class TelegramService {
  public static isDryRun(): boolean {
    const val = process.env.TELEGRAM_DRY_RUN;
    if (val === undefined || val === '') return true;
    return val.toLowerCase() === 'true' || val === '1';
  }

  public static getBotToken(): string {
    return process.env.BOT_TOKEN || '';
  }

  public static getChatId(): string {
    return process.env.CHAT_ID || '';
  }

  public static getDefaultSubject(): string {
    return process.env.SUBJECT || 'Geography - भौतिक विशेषताएं';
  }

  /**
   * Send a single Quiz Poll to Telegram Channel/Group
   */
  public static async sendQuizPoll(params: ISendPollParams): Promise<ITelegramPublishResult> {
    const isDry = this.isDryRun();
    const token = this.getBotToken();
    const targetChatId = params.chatId || this.getChatId();
    const rawSubject = params.subject !== undefined ? params.subject : this.getDefaultSubject();
    const cleanSubject = (rawSubject || '').trim();

    // Prepend subject tag only if subject is valid and not empty or a single dot
    const fullQuestion = cleanSubject && cleanSubject !== '.'
      ? `[${cleanSubject}] ${params.questionText}`
      : params.questionText;

    const payload: Record<string, any> = {
      chat_id: targetChatId,
      question: fullQuestion,
      options: params.options,
      type: 'quiz',
      correct_option_id: params.correctOptionId,
      is_anonymous: false,
      allows_multiple_answers: false,
    };

    if (params.explanation && params.explanation.trim()) {
      payload.explanation = params.explanation.trim();
    }

    if (isDry) {
      // Dry Run Simulation Mode
      console.log(`[Telegram Dry Run] Simulating Quiz Poll dispatch to chat ${targetChatId || '<MOCK_CHAT>'}: "${fullQuestion}"`);
      const mockMessageId = Math.floor(100000 + Math.random() * 900000);
      const mockPollId = `poll_mock_${Date.now()}_${mockMessageId}`;
      return {
        success: true,
        messageId: mockMessageId,
        pollId: mockPollId,
        isDryRun: true,
      };
    }

    // Live Dispatch Mode
    if (!token) {
      return {
        success: false,
        error: 'Telegram BOT_TOKEN is missing in environment variables.',
        isDryRun: false,
      };
    }

    if (!targetChatId) {
      return {
        success: false,
        error: 'Telegram CHAT_ID is missing in environment variables.',
        isDryRun: false,
      };
    }

    const url = `https://api.telegram.org/bot${token}/sendPoll`;

    try {
      const response = await axios.post(url, payload, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data && response.data.ok) {
        const messageId = response.data.result?.message_id;
        const pollId = response.data.result?.poll?.id;
        return {
          success: true,
          messageId,
          pollId,
          isDryRun: false,
        };
      } else {
        return {
          success: false,
          error: response.data?.description || 'Telegram API returned ok: false',
          isDryRun: false,
        };
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.description || err.message || 'Unknown Telegram network error';
      console.error('[TelegramService] Live dispatch error:', errMsg);
      return {
        success: false,
        error: errMsg,
        isDryRun: false,
      };
    }
  }

  /**
   * Check Telegram connection and configuration status safely (without revealing token)
   */
  public static async getStatus(): Promise<{
    configured: boolean;
    isDryRun: boolean;
    chatIdSet: boolean;
    tokenMasked: string;
    botInfo?: { username?: string; firstName?: string };
  }> {
    const token = this.getBotToken();
    const chatId = this.getChatId();
    const isDry = this.isDryRun();

    const tokenMasked = token && token.length > 8
      ? `${token.substring(0, 4)}...${token.substring(token.length - 4)}`
      : token ? '****' : 'Not Set';

    let botInfo: { username?: string; firstName?: string } | undefined = undefined;

    if (token && !isDry) {
      try {
        const resp = await axios.get(`https://api.telegram.org/bot${token}/getMe`, { timeout: 5000 });
        if (resp.data && resp.data.ok) {
          botInfo = {
            username: resp.data.result?.username,
            firstName: resp.data.result?.first_name,
          };
        }
      } catch (err: any) {
        console.warn('[TelegramService] Could not reach Telegram /getMe:', err.message);
      }
    }

    return {
      configured: Boolean(token && chatId),
      isDryRun: isDry,
      chatIdSet: Boolean(chatId),
      tokenMasked,
      botInfo,
    };
  }
}
