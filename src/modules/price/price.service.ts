import axios, { AxiosInstance } from 'axios';
import { createError } from '../../middlewares/errorHandler';

// CORREÇÃO: Adicionada a palavra-chave 'export'
export const getTickerUrl = (pair: string) => `https://api.hyperliquid.xyz/v2/markets/${pair}/ticker`;
export const getInfoUrl = ( ) => `https://api.hyperliquid.xyz/info`;

interface AssetContext {
  name: string;
  markPx: string;
}

export class PriceService {
  private rest: AxiosInstance;

  constructor(axiosInstance: AxiosInstance = axios ) {
    this.rest = axiosInstance;
  }

  async fetchCurrentPrice(asset: string): Promise<number> {
    // CORREÇÃO: Adicionada verificação de segurança
    if (!asset || typeof asset !== 'string') {
      throw createError('Ativo (asset) inválido fornecido', 400, 'INVALID_ASSET');
    }
    
    const pair = asset.includes('/') ? asset : `${asset}/USDC`;

    try {
      const perpUrl = getTickerUrl(pair);
      const perpRes = await this.rest.get(perpUrl);
      if (perpRes.data && perpRes.data[0] && perpRes.data[0].px) {
        return parseFloat(perpRes.data[0].px);
      }
    } catch (error) {
      console.warn(`Não foi possível buscar o preço perpétuo para ${pair}. Tentando fallback. Erro: ${(error as Error).message}`);
    }

    try {
      const infoUrl = getInfoUrl();
      const infoRes = await this.rest.post(infoUrl, { type: 'metaAndAssetCtxs' });
      const assetData = infoRes.data.assetCtxs.find(
        (ctx: AssetContext) => ctx.name.toLowerCase() === asset.toLowerCase()
      );

      if (assetData && assetData.markPx) {
        return parseFloat(assetData.markPx);
      }
    } catch (error) {
      throw createError(`Falha ao buscar preço spot para ${asset}`, 500, 'PRICE_ERROR_FALLBACK');
    }

    throw createError(`Não foi possível encontrar um preço para o ativo ${asset}`, 404, 'PRICE_NOT_FOUND');
  }
}
