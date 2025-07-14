"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const price_service_1 = require("./modules/price/price.service");
(async () => {
    try {
        const price = await price_service_1.priceService.fetchCurrentPrice('BTC');
        console.log('Preço atual BTC:', price);
    }
    catch (err) {
        console.error('Erro ao buscar preço:', err.message ?? err);
    }
})();
//# sourceMappingURL=test-price.js.map