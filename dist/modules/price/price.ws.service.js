"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
class PriceServiceWS {
    ws;
    connectWs(symbol, onTick) {
        const endpoint = 'wss://api.hyperliquid.xyz/ws';
        this.ws = new ws_1.default(endpoint);
        this.ws.on('open', () => {
            const chan = `ticker:${symbol.replace('-', '/')}`;
            this.ws.send(JSON.stringify({ op: 'subscribe', args: [chan] }));
            console.log(`WebSocket aberto, inscrevendo em ${chan}`);
        });
        this.ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.topic?.startsWith('ticker') && msg.data?.last) {
                    onTick(Number(msg.data.last));
                }
            }
            catch (err) {
                console.error('Erro ao parsear WS message:', err);
            }
        });
        this.ws.on('error', (err) => {
            console.error('WebSocket erro:', err);
        });
        this.ws.on('close', (code, reason) => {
            console.warn(`WebSocket fechado (${code}): ${reason.toString()}. Reconectando em 5s...`);
            setTimeout(() => this.connectWs(symbol, onTick), 5000);
        });
    }
}
exports.default = PriceServiceWS;
//# sourceMappingURL=price.ws.service.js.map