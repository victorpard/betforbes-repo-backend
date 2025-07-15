// CORREÇÃO: Importa a CLASSE 'PriceService' com 'P' maiúsculo.
import { PriceService } from './modules/price/price.service';

// CORREÇÃO: Cria uma nova instância do serviço.
const priceService = new PriceService();

// Função principal assíncrona para executar o teste.
async function testPrice() {
  try {
    // Altere o ativo aqui para testar diferentes moedas.
    const assetToTest = 'BTC'; 
    
    console.log(`Buscando preço para ${assetToTest}...`);
    
    const price = await priceService.fetchCurrentPrice(assetToTest);
    
    console.log(`Preço atual de ${assetToTest}: ${price}`);
  } catch (error) {
    console.error('Ocorreu um erro durante o teste:', error);
  }
}

// Executa a função de teste.
testPrice();
