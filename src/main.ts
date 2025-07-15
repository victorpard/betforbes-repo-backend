import 'dotenv/config';            // já carrega variáveis do .env
import express from 'express';
import cors from 'cors';
import routes from './app';       // ajuste o caminho se for diferente

async function bootstrap() {
  const app = express();

  // Habilita CORS para o seu frontend
  app.use(
    cors({
      origin: 'http://localhost:3000', // altere para a URL real do seu frontend
      credentials: true,
    })
  );

  // Permite JSON no body das requisições
  app.use(express.json());

  // Monta suas rotas (auth, bets, price, etc.)
  app.use('/api', routes);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`⚡️ Server running on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
