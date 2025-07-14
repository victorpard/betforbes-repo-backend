import 'dotenv/config'                                 // já carrega .env
import { priceService } from './modules/price/price.service'

;(async () => {
  try {
    const price = await priceService.fetchCurrentPrice('BTC')
    console.log('Preço atual BTC:', price)
  } catch (err: any) {
    console.error('Erro ao buscar preço:', err.message ?? err)
  }
})()
