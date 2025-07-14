import WebSocket, { Data } from 'ws';

export default class PriceServiceWS {
  private ws?: WebSocket;

  /**
   * Conecta ao WebSocket e inscreve no canal de ticker do símbolo.
   * @param symbol Par de símbolos no formato 'BTC-USDT'.
   * @param onTick Callback executado a cada novo preço.
   */
  connectWs(symbol: string, onTick: (price: number) => void): void {
    const endpoint = 'wss://api.hyperliquid.xyz/ws';
    this.ws = new WebSocket(endpoint);

    this.ws.on('open', () => {
      const chan = `ticker:${symbol.replace('-', '/')}`;
      this.ws!.send(JSON.stringify({ op: 'subscribe', args: [chan] }));
      console.log(`WebSocket aberto, inscrevendo em ${chan}`);
    });

    this.ws.on('message', (data: Data) => {
      try {
        const msg = JSON.parse(data.toString()) as { topic?: string; data?: { last?: string | number } };
        if (msg.topic?.startsWith('ticker') && msg.data?.last) {
          onTick(Number(msg.data.last));
        }
      } catch (err: unknown) {
        console.error('Erro ao parsear WS message:', err);
      }
    });

    this.ws.on('error', (err: Error) => {
      console.error('WebSocket erro:', err);
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      console.warn(`WebSocket fechado (${code}): ${reason.toString()}. Reconectando em 5s...`);
      setTimeout(() => this.connectWs(symbol, onTick), 5000);
    });
  }
}
