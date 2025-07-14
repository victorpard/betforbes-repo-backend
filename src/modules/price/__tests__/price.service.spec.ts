import axios, { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { PriceService, getTickerUrl, getInfoUrl } from '../price.service';

describe('PriceService', () => {
  let localAxiosInstance: AxiosInstance;
  let mock: MockAdapter;
  let priceService: PriceService;

  beforeEach(() => {
    // 1. Cria uma instância do axios local para este teste
    localAxiosInstance = axios.create();
    // 2. Aplica o mock a ESTA instância local
    mock = new MockAdapter(localAxiosInstance);
    // 3. Injeta a instância mockada na PriceService
    priceService = new PriceService(localAxiosInstance);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should return perpetual price when the ticker API succeeds', async () => {
    const symbol = 'BTC';
    const pair = `${symbol}/USDC`;
    const expectedPrice = 65000.50;
    
    mock.onGet(getTickerUrl(pair)).reply(200, [{ px: expectedPrice.toString() }]);
    
    const price = await priceService.fetchCurrentPrice(symbol);
    expect(price).toBe(expectedPrice);
  });

  it('should fallback to spot price when the ticker API fails', async () => {
    const symbol = 'ETH';
    const pair = `${symbol}/USDC`;
    const expectedSpotPrice = 3500.75;

    mock.onGet(getTickerUrl(pair)).networkError();
    mock.onPost(getInfoUrl()).reply(200, {
      assetCtxs: [{ name: 'ETH', markPx: expectedSpotPrice.toString() }],
    });
    
    const price = await priceService.fetchCurrentPrice(symbol);
    expect(price).toBe(expectedSpotPrice);
  });

  it('should throw an error if both APIs fail', async () => {
    const symbol = 'LTC';
    const pair = `${symbol}/USDC`;

    mock.onGet(getTickerUrl(pair)).networkError();
    mock.onPost(getInfoUrl()).reply(500);
    
    await expect(priceService.fetchCurrentPrice(symbol)).rejects.toThrow(
      `Falha ao buscar preço spot para ${symbol}`
    );
  });

  it('should throw an error if no price is found for the asset', async () => {
    const symbol = 'DOGE';
    const pair = `${symbol}/USDC`;

    mock.onGet(getTickerUrl(pair)).networkError();
    mock.onPost(getInfoUrl()).reply(200, {
      assetCtxs: [{ name: 'BTC', markPx: '65000' }],
    });
    
    await expect(priceService.fetchCurrentPrice(symbol)).rejects.toThrow(
      `Não foi possível encontrar um preço para o ativo ${symbol}`
    );
  });
});
