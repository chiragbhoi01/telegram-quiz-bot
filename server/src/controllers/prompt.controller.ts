import { Request, Response } from 'express';
import { Prompt } from '../models/Prompt';

export const DEFAULT_CLAUDE_PROMPT = `You are an expert exam preparation question creator specializing in Rajasthan Competitive Examinations (RAS, CET, Patwar, Police Constable, 1st/2nd/3rd Grade Teacher, REET).

Generate 20 high-quality Multiple Choice Questions (MCQs) in Hindi based on the following topic:
[TOPIC_NAME_HERE]

Requirements:
1. Each question must strictly follow the Rajasthan GK syllabus and historical facts.
2. Provide exactly 4 distinct options (A, B, C, D) for each question in Hindi.
3. Provide the single correct option ('A', 'B', 'C', or 'D').
4. Include a concise Hindi explanation (व्याख्या) of maximum 150 characters.
5. Set difficulty level ('Easy', 'Medium', 'Hard').

Return ONLY a valid raw JSON object strictly matching this schema (do NOT wrap with conversational preamble):

{
  "questions": [
    {
      "question": "प्रश्न का विवरण यहाँ लिखें?",
      "options": [
        "विकल्प A",
        "विकल्प B",
        "विकल्प C",
        "विकल्प D"
      ],
      "correctAnswer": "A",
      "explanation": "संक्षिप्त व्याख्या यहाँ लिखें।",
      "category": "Rajasthan History",
      "exam": "CET 2024",
      "difficulty": "Medium"
    }
  ]
}`;

export class PromptController {
  public static async getPrompts(req: Request, res: Response): Promise<void> {
    try {
      let prompts = await Prompt.find().sort({ isDefault: -1, createdAt: -1 }).lean();

      if (prompts.length === 0) {
        // Seed default prompt
        const seeded = new Prompt({
          title: 'Rajasthan GK 20-Question Generator (Standard JSON)',
          category: 'Rajasthan GK',
          description: 'Standard prompt for generating 20 Hindi MCQs in structured JSON format for instant import.',
          content: DEFAULT_CLAUDE_PROMPT,
          isDefault: true,
        });
        await seeded.save();
        prompts = await Prompt.find().sort({ isDefault: -1, createdAt: -1 }).lean();
      }

      res.json({
        success: true,
        data: prompts,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch prompts' });
    }
  }

  public static async createPrompt(req: Request, res: Response): Promise<void> {
    try {
      const { title, category, description, content, isDefault } = req.body;

      if (!title || !content) {
        res.status(400).json({ success: false, error: 'Title and content are required' });
        return;
      }

      if (isDefault) {
        await Prompt.updateMany({}, { isDefault: false });
      }

      const prompt = new Prompt({
        title: title.trim(),
        category: category?.trim() || 'Rajasthan GK',
        description: description?.trim() || '',
        content: content.trim(),
        isDefault: Boolean(isDefault),
      });

      await prompt.save();

      res.status(201).json({
        success: true,
        message: 'Prompt template saved successfully',
        data: prompt,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to create prompt' });
    }
  }

  public static async updatePrompt(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, category, description, content, isDefault } = req.body;

      const prompt = await Prompt.findById(id);
      if (!prompt) {
        res.status(404).json({ success: false, error: 'Prompt not found' });
        return;
      }

      if (isDefault) {
        await Prompt.updateMany({ _id: { $ne: id } }, { isDefault: false });
        prompt.isDefault = true;
      }

      if (title) prompt.title = title.trim();
      if (category) prompt.category = category.trim();
      if (description !== undefined) prompt.description = description.trim();
      if (content) prompt.content = content.trim();

      await prompt.save();

      res.json({
        success: true,
        message: 'Prompt updated successfully',
        data: prompt,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to update prompt' });
    }
  }

  public static async deletePrompt(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await Prompt.findByIdAndDelete(id);
      res.json({ success: true, message: 'Prompt deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to delete prompt' });
    }
  }

  public static async resetDefaultPrompt(req: Request, res: Response): Promise<void> {
    try {
      let defaultPrompt = await Prompt.findOne({ isDefault: true });
      if (defaultPrompt) {
        defaultPrompt.content = DEFAULT_CLAUDE_PROMPT;
        await defaultPrompt.save();
      } else {
        defaultPrompt = new Prompt({
          title: 'Rajasthan GK 20-Question Generator (Standard JSON)',
          category: 'Rajasthan GK',
          description: 'Standard prompt for generating 20 Hindi MCQs in structured JSON format.',
          content: DEFAULT_CLAUDE_PROMPT,
          isDefault: true,
        });
        await defaultPrompt.save();
      }

      res.json({
        success: true,
        message: 'Default prompt reset successfully',
        data: defaultPrompt,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to reset prompt' });
    }
  }
}
