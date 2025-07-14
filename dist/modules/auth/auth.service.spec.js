"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = __importDefault(require("./auth.service"));
describe('AuthService.register', () => {
    it('should register a user without referralCode', async () => {
        const data = {
            name: 'Usuário Teste',
            email: 'teste@example.com',
            password: 'SenhaForte123'
        };
        const result = await auth_service_1.default.register(data);
        expect(result.user).toHaveProperty('id');
    });
});
//# sourceMappingURL=auth.service.spec.js.map