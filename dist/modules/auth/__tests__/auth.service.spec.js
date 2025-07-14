"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const auth_service_1 = __importDefault(require("../../auth/auth.service"));
const errorHandler_1 = require("../../../middlewares/errorHandler");
describe('AuthService.register', () => {
    beforeAll(async () => {
        await prisma_1.default.commissionEvent.deleteMany();
        await prisma_1.default.revenueEvent.deleteMany();
        await prisma_1.default.order.deleteMany();
        await prisma_1.default.user.deleteMany();
    });
    afterAll(async () => {
        await prisma_1.default.$disconnect();
    });
    it('should register a user without referralCode', async () => {
        const result = await auth_service_1.default.register({
            name: 'Test User',
            email: 'test@example.com',
            password: 'Password123!'
        });
        const { user } = result;
        expect(user).toHaveProperty('id');
        expect(user.email).toBe('test@example.com');
    });
    it('should not register with existing email', async () => {
        await expect(auth_service_1.default.register({
            name: 'Test User 2',
            email: 'test@example.com',
            password: 'Password123!'
        })).rejects.toMatchObject((0, errorHandler_1.createError)('Email já está em uso', 400, 'EMAIL_IN_USE'));
    });
});
//# sourceMappingURL=auth.service.spec.js.map