import express from 'express'
import cors from 'cors'
import routes from './app' // ou de onde você importa suas rotas

async function bootstrap() {
  const app = express()

  app.use(cors({
    origin: 'http://localhost:3000', // ajuste para o seu frontend
    credentials: true
  }))
  app.use(express.json())
  app.use(routes)

  const port = process.env.PORT || 3001
  await app.listen(port)
  console.log(`⚡️ Server running on http://localhost:${port}`)
}

bootstrap()
