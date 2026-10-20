import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { checkDbConnection } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';
import { authenticate } from './middleware/auth.js';

// Route modules
import { authRouter } from './modules/auth/routes.js';
import { organizationRouter } from './modules/organizations/routes.js';
import { roleRouter } from './modules/roles/routes.js';
import * as roleController from './modules/roles/controller.js';
import { projectRouter } from './modules/projects/routes.js';
import { taskRouter } from './modules/tasks/routes.js';
import { dashboardRouter } from './modules/dashboard/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Security HTTP headers
app.use(helmet({
  contentSecurityPolicy: env.IS_PRODUCTION ? undefined : false
}));

// CORS configuration
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id']
}));

// Request parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));

// Logging
if (!env.IS_TEST) {
  app.use(morgan(env.IS_PRODUCTION ? 'combined' : 'dev'));
}

// Global API rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.IS_TEST ? 10000 : 500,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', globalLimiter);

// Health check endpoint
app.get('/api/health', async (req, res, next) => {
  try {
    const dbStatus = await checkDbConnection();
    const status = dbStatus.connected ? 200 : 503;
    return res.status(status).json({
      success: dbStatus.connected,
      message: dbStatus.connected ? 'Multi-Tenant SaaS API is healthy' : 'Database connection unavailable',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus
    });
  } catch (err) {
    next(err);
  }
});

// Swagger Documentation
try {
  const swaggerPath = path.join(__dirname, 'docs', 'swagger.json');
  if (fs.existsSync(swaggerPath)) {
    const swaggerDoc = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  }
} catch (e) {
  console.warn('Swagger UI documentation could not be loaded:', e.message);
}

// API Module Routes
app.use('/api/auth', authRouter);
app.use('/api/organizations', organizationRouter);
app.use('/api/organizations/:organizationId/roles', roleRouter);
app.get('/api/permissions', authenticate, roleController.listPermissions);
app.use('/api/projects', projectRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/dashboard', dashboardRouter);

// Catch-all 404 handler for undefined routes
app.use('*', (req, res, next) => {
  next(new NotFoundError(`Endpoint not found: ${req.method} ${req.originalUrl}`));
});

// Centralized error handler
app.use(errorHandler);
