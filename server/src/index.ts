import dotenv from 'dotenv';
import app from './app';
import { connectDB } from './config/db';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Rajasthan Exam Twister Backend Server`);
    console.log(` Running on: http://localhost:${PORT}`);
    console.log(` Telegram Dry Run: ${process.env.TELEGRAM_DRY_RUN !== 'false' ? 'ENABLED (Safe)' : 'LIVE MODE'}`);
    console.log(`====================================================`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
