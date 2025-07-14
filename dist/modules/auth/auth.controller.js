"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = __importDefault(require("./auth.service"));
const errorHandler_1 = require("../../middlewares/errorHandler");
const logger_1 = require("../../utils/logger");
const helpers_1 = require("../../utils/helpers");
class AuthController {
    register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { name, email, password, referralCode } = req.body;
        const { user, emailSent } = await auth_service_1.default.register({
            name,
            email,
            password,
            referralCode,
        });
        logger_1.logger.info(`📝 Registro: ${email} - IP: ${(0, helpers_1.getClientIP)(req)}`);
        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso. Verifique seu email para ativar a conta.',
            data: { user, emailSent },
        });
    });
    login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { email, password } = req.body;
        const result = await auth_service_1.default.login({ email, password });
        logger_1.logger.info(`🔐 Login: ${email} - IP: ${(0, helpers_1.getClientIP)(req)}`);
        res.json({ success: true, message: 'Login realizado com sucesso', data: result });
    });
    verifyEmail = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const token = String(req.query.token || '');
        if (!token) {
            throw (0, errorHandler_1.createError)('Token é obrigatório', 400, 'MISSING_TOKEN');
        }
        const result = await auth_service_1.default.verifyEmail(token);
        logger_1.logger.info(`✅ Email verificado: ${result.user.email} - IP: ${(0, helpers_1.getClientIP)(req)}`);
        res.json({ success: true, message: 'Email verificado com sucesso!', data: result });
    });
    resendVerification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { email } = req.body;
        const result = await auth_service_1.default.resendVerification(email);
        logger_1.logger.info(`📧 Reenvio verificação: ${email} - IP: ${(0, helpers_1.getClientIP)(req)}`);
        res.json({ success: true, message: 'Email de verificação reenviado.', data: result });
    });
    forgotPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { email } = req.body;
        const result = await auth_service_1.default.forgotPassword(email);
        logger_1.logger.info(`🔑 Esqueci senha: ${email} - IP: ${(0, helpers_1.getClientIP)(req)}`);
        res.json({ success: true, message: 'Se o email existir, você receberá instruções.', data: result });
    });
    resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { token, password } = req.body;
        const result = await auth_service_1.default.resetPassword(token, password);
        logger_1.logger.info(`🔑 Senha redefinida - IP: ${(0, helpers_1.getClientIP)(req)}`);
        res.json({ success: true, message: 'Senha redefinida com sucesso.', data: result });
    });
    refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { refreshToken } = req.body;
        const result = await auth_service_1.default.refreshToken(refreshToken);
        res.json({ success: true, message: 'Token renovado com sucesso', data: result });
    });
    logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { refreshToken } = req.body;
        const result = await auth_service_1.default.logout(refreshToken);
        logger_1.logger.info(`👋 Logout - IP: ${(0, helpers_1.getClientIP)(req)}`);
        res.json({ success: true, message: 'Logout realizado com sucesso', data: result });
    });
    getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const u = req.user;
        res.json({
            success: true,
            message: 'Perfil obtido com sucesso',
            data: {
                user: {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    isVerified: u.isVerified,
                },
            },
        });
    });
}
exports.default = new AuthController();
//# sourceMappingURL=auth.controller.js.map