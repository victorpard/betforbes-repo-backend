import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import apiRouter from './routes';  // aqui você exporta o Router com /auth, /bets, /price, etc.

const app = express();

// 1) CORS — permita o seu frontend de dev ou de produção
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// 2) Body parser para JSON
app.use(express.json({ limit: '10mb' }));

// 3) Rotas da API sob /api
app.use('/api', apiRouter);

// 4) Serve o build estático do frontend
//    Supondo que você rodou o `vite build` e gerou frontend/dist
const frontendDist = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(frontendDist, { maxAge: '1d' }));

// 5) SPA fallback: para qualquer rota que não seja /api/**, devolve index.html
app.get('*', (req: Request, res: Response) => {
  // Se a rota começar com /api, cai no 404 do seu router
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: `Rota não encontrada: ${req.originalUrl}` });
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

export default app;
