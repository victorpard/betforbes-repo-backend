import { Request, Response } from 'express';
import authService from './auth.service';
import { asyncHandler, createError } from '../../middlewares/errorHandler';
import { logger } from '../../utils/logger';
import { getClientIP } from '../../utils/helpers';

class AuthController {
  /**
   * POST /api/auth/register
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, referralCode } = req.body;
    const { user, emailSent } = await authService.register({
      name,
      email,
      password,
      referralCode,
    });

    logger.info(`📝 Registro: ${email} - IP: ${getClientIP(req)}`);
    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso. Verifique seu email para ativar a conta.',
      data: { user, emailSent },
    });
  });

  /**
   * POST /api/auth/login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    logger.info(`🔐 Login: ${email} - IP: ${getClientIP(req)}`);
    res.json({ success: true, message: 'Login realizado com sucesso', data: result });
  });

  /**
   * GET /api/auth/verify-email?token=...
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const token = String(req.query.token || '');
    if (!token) {
      // agora lançamos um erro, para o asyncHandler capturar
      throw createError('Token é obrigatório', 400, 'MISSING_TOKEN');
    }

    const result = await authService.verifyEmail(token);
    logger.info(`✅ Email verificado: ${result.user.email} - IP: ${getClientIP(req)}`);
    res.json({ success: true, message: 'Email verificado com sucesso!', data: result });
  });

  /**
   * POST /api/auth/resend-verification
   */
  resendVerification = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await authService.resendVerification(email);

    logger.info(`📧 Reenvio verificação: ${email} - IP: ${getClientIP(req)}`);
    res.json({ success: true, message: 'Email de verificação reenviado.', data: result });
  });

  /**
   * POST /api/auth/forgot-password
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);

    logger.info(`🔑 Esqueci senha: ${email} - IP: ${getClientIP(req)}`);
    res.json({ success: true, message: 'Se o email existir, você receberá instruções.', data: result });
  });

  /**
   * POST /api/auth/reset-password
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);

    logger.info(`🔑 Senha redefinida - IP: ${getClientIP(req)}`);
    res.json({ success: true, message: 'Senha redefinida com sucesso.', data: result });
  });

  /**
   * POST /api/auth/refresh
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);

    res.json({ success: true, message: 'Token renovado com sucesso', data: result });
  });

  /**
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken);

    logger.info(`👋 Logout - IP: ${getClientIP(req)}`);
    res.json({ success: true, message: 'Logout realizado com sucesso', data: result });
  });

  /**
   * GET /api/auth/profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const u = req.user!; // preenchido pelo authMiddleware
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

export default new AuthController();
