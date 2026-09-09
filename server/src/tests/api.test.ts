import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import { Question } from '../models/Question';
import { Quiz } from '../models/Quiz';
import { generateToken } from '../utils/auth';

let mongoServer: MongoMemoryServer;
let authToken: string;

jest.setTimeout(120000);

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_key_12345';
  process.env.ADMIN_PASSWORD = 'admin';
  process.env.TELEGRAM_DRY_RUN = 'true';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  authToken = generateToken({ username: 'admin', role: 'admin' });
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Rajasthan Exam Twister End-to-End API Test Suite', () => {
  describe('Healthcheck & Auth API', () => {
    it('GET /api/health should return 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });

    it('POST /api/auth/login should authenticate with valid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'admin' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('Import & Question Pool Flow', () => {
    it('POST /api/questions/import/confirm should save questions into MongoDB', async () => {
      const sample = [
        {
          questionText: 'राजस्थान की प्रथम महिला राज्यपाल कौन थीं?',
          options: ['श्रीमती प्रतिभा पाटिल', 'श्रीमती मार्गरेट अल्वा', 'श्रीमती प्रभा राव', 'श्रीमती वसुंधरा राजे'],
          correctOption: 0,
          explanation: 'श्रीमती प्रतिभा पाटिल राजस्थान की पहली महिला राज्यपाल थीं।',
          category: 'Polity - राज्य व्यवस्था',
        },
      ];

      const res = await request(app)
        .post('/api/questions/import/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ questions: sample });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.importedCount).toBe(1);
    });
  });

  describe('Quiz Creation & Optional Subject Flow', () => {
    it('should create quiz with empty subject and publish directly without bracket prefix', async () => {
      let q = await Question.findOne();
      if (!q) {
        q = await Question.create({
          customId: 'Q-001',
          questionText: 'राजस्थान के किस जिले में मेहरानगढ़ दुर्ग स्थित है?',
          options: ['जोधपुर', 'जयपुर', 'उदयपुर', 'बीकानेर'],
          correctOption: 0,
          explanation: 'मेहरानगढ़ दुर्ग जोधपुर में स्थित है।',
          category: 'History',
          normalizedText: 'राजस्थानकेकिसजिलेमेंमेहरानगढ़दुर्गस्थितहै',
        });
      }
      expect(q).toBeTruthy();

      // Create draft quiz with NO subject
      const createRes = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Direct Mode Quiz',
          subject: '',
          questionIds: [q!._id.toString()],
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.subject).toBe('');

      const quizId = createRes.body.data._id;

      // Publish quiz (Dry run mode)
      const pubRes = await request(app)
        .post(`/api/quizzes/${quizId}/publish`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(pubRes.status).toBe(200);
      expect(pubRes.body.success).toBe(true);
      expect(pubRes.body.sent).toBe(1);
    });
  });
});
