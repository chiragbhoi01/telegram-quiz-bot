import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

// Security and middleware
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Rajasthan Exam Twister API',
    timestamp: new Date().toISOString(),
  });
});

// Mount Central API Routes
app.use('/api', routes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error occurred',
  });
});

export default app;
