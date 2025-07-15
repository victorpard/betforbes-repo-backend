"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const price_service_1 = require("./modules/price/price.service");
const priceService = new price_service_1.PriceService();
async function testPrice() {
    try {
        const assetToTest = 'BTC';
        console.log(`Buscando preço para ${assetToTest}...`);
        const price = await priceService.fetchCurrentPrice(assetToTest);
        console.log(`Preço atual de ${assetToTest}: ${price}`);
    }
    catch (error) {
        console.error('Ocorreu um erro durante o teste:', error);
    }
}
testPrice();
//# sourceMappingURL=test-price.js.map