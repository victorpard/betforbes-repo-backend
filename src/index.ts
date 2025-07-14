import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Middlewares
dotenv.config();

import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';
import { authenticateToken } from './middlewares/auth';

// Rotas
import authRoutes from './modules/auth/auth.routes';
import withdrawRoutes from './modules/withdraw/withdraw.routes';
import userRoutes from './modules/users/user.routes';
import betsRoutes from './modules/bets/bets.routes';
import affiliateRoutes from './modules/affiliate/affiliate.routes';
import priceRoutes from './modules/price/price.routes';

// Utils
import { logger } from './utils/logger';
import prisma from './lib/prisma';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Confia no proxy (para usar X-Forwarded-For, etc)
app.set('trust proxy', true);

// (Opcional) logs de debug — remova em produção
logger.debug({
  rateLimiter: rateLimiter.name,
  authenticateToken: authenticateToken.name,
  authRoutes: 'loaded',
  withdrawRoutes: 'loaded',
  userRoutes: 'loaded',
  betsRoutes: 'loaded',
  affiliateRoutes: 'loaded',
  priceRoutes: 'loaded',
});

// Middlewares globais
app.use(
  helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'BetForbes API', version: '1.0.0' },
    servers: [{ url: process.env.API_URL || `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.ts', './src/modules/**/*.routes.ts'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/withdraw', authenticateToken, withdrawRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/bets', authenticateToken, betsRoutes);
app.use('/api/affiliates', authenticateToken, affiliateRoutes);
app.use('/api/price', priceRoutes);

// 404 handler (deve vir por último)
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Rota não encontrada: ${req.originalUrl}` });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  errorHandler(err, _req, res, _next);
});

// Inicia servidor
async function startServer() {
  try {
    await prisma.$connect();
    logger.info('Conectado ao banco de dados');
    app.listen(PORT, () => logger.info(`Servidor rodando na porta ${PORT}`));
  } catch (err) {
    logger.error('Erro ao iniciar servidor:', err);
    process.exit(1);
  }
}

startServer();

export default app;
