import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(path.resolve('uploads')));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/notifications', notificationRoutes);
app.get('/api/health', (req, res) => res.json({ success: true, data: { service: 'campusfind-ai-api', status: 'ok' } }));
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  connectDatabase().then(() => app.listen(env.port, '0.0.0.0', () => console.log(`API listening on port ${env.port}`))).catch(error => { console.error('Database connection failed:', error.message); process.exit(1); });
}
export default app;
