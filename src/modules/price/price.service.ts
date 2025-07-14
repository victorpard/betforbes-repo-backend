import axios, { AxiosInstance } from 'axios'
import { createError } from '../../middlewares/errorHandler'
import { logger } from '../../utils/logger'

export class PriceService {
  private rest: AxiosInstance
  private infoUrl: string

  constructor() {
    // Carrega da variável de ambiente, removendo o `/evm` caso exista
    const apiUrl = process.env.HYPERLIQUID_API_URL!
    this.infoUrl = (process.env.HYPERLIQUID_INFO_URL || apiUrl).replace('/evm', '')
    this.rest = axios.create({ baseURL: this.infoUrl })
  }

  async fetchCurrentPrice(asset: string): Promise<number> {
    // Normaliza o par (BTC -> BTC/USDC)
    const pair = asset.includes('/') ? asset : `${asset}/USDC`

    // 1) Tenta ticker perpétuo
    try {
      const perpRes = await this.rest.get(`/v2/markets/${pair}/ticker`)
      return parseFloat(perpRes.data.price)
    } catch (err: any) {
      logger.warn(
        `Não foi possível buscar o preço perpétuo para ${pair}. Tentando fallback. Erro: ${err.message}`
      )
    }

    // 2) Fallback via /info
    let infoRes
    try {
      infoRes = await this.rest.post(`/info`, { type: 'metaAndAssetCtxs' })
    } catch (err: any) {
      throw createError(
        `Falha ao buscar preço perpétuo para ${pair}`,
        err.response?.status ?? 500,
        'PRICE_FEED_ERROR'
      )
    }

    const data = infoRes.data
    // encontra a chave de preço dentro de data.assetCtxs
    const assetCtx = data.assetCtxs?.find((ctx: any) => {
      // garante que pair seja string não-undefined
      if (!pair.includes('/')) throw new Error(`Par inválido: ${pair}`)
      const symbolKey = pair.split('/')[0].toUpperCase()
      return ctx.symbol === symbolKey
    })

    if (!assetCtx || !assetCtx.markPx) {
      throw createError(`Ativo ${pair} não encontrado na resposta da API`, 500, 'PRICE_FEED_ERROR')
    }

    return parseFloat(assetCtx.markPx)
  }
}

// Exporta a instância pronta para uso
export const priceService = new PriceService()
