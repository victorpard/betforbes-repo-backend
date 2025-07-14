import prisma from '../../lib/prisma';
import jwtService from '../../lib/jwt';
import emailService from '../../utils/email';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  getExpirationDate
} from '../../utils/helpers';
import { createError } from '../../middlewares/errorHandler';
import { logger } from '../../utils/logger';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    balance: number;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

class AuthService {
  /**
   * Registra um novo usuário
   */
  async register(
    data: RegisterData
  ): Promise<{ user: any; emailSent: boolean }> {
    const { name, email, password, referralCode } = data;
    const normalizedEmail = email.toLowerCase();

    // 1) Verifica se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (existingUser) {
      throw createError(
        'Email já está em uso',
        409,
        'EMAIL_ALREADY_EXISTS'
      );
    }

    // 2) Se forneceu referralCode, valida e captura referrerId
    let referrerId: string | undefined;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode }
      });
      if (!referrer) {
        throw createError(
          'Código de referência inválido',
          400,
          'INVALID_REFERRAL_CODE'
        );
      }
      referrerId = referrer.id;
    }

    // 3) Hash da senha
    const hashedPassword = await hashPassword(password);

    // 4) Gera um novo referralCode exclusivo para este usuário
    let userReferralCode: string;
    do {
      userReferralCode = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase(); // 8 caracteres
    } while (
      await prisma.user.findUnique({
        where: { referralCode: userReferralCode }
      })
    );

    // 5) Cria o usuário
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        referralCode: userReferralCode,
        ...(referrerId && { referrerId })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        balance: true,
        referralCode: true,
        createdAt: true
      }
    });

    // 6) Cria e envia token de verificação
    const verificationToken = generateSecureToken();
    const expiresAt = getExpirationDate(
      parseInt(process.env.EMAIL_VERIFICATION_EXPIRES || '1440', 10)
    );
    await prisma.emailVerificationToken.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt
      }
    });
    const emailSent = await emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );

    logger.info(`👤 Novo usuário registrado: ${user.email}`);
    return { user, emailSent };
  }

  /**
   * Faz login do usuário
   */
  async login(data: LoginData): Promise<AuthResult> {
    const normalizedEmail = data.email.toLowerCase();

    // 1) Busca o usuário
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (!user) {
      throw createError(
        'Email ou senha incorretos',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    // 2) Verifica a senha
    const isPasswordValid = await verifyPassword(
      data.password,
      user.password
    );
    if (!isPasswordValid) {
      throw createError(
        'Email ou senha incorretos',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    // 3) Verifica status da conta
    if (!user.isActive) {
      throw createError('Conta desativada', 401, 'ACCOUNT_DISABLED');
    }
    if (!user.isVerified) {
      throw createError(
        'Email não verificado',
        401,
        'EMAIL_NOT_VERIFIED'
      );
    }

    // 4) Gera tokens JWT
    const tokens = jwtService.generateTokenPair(user);

    // 5) Atualiza último login e registra sessão
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ) // 30 dias
      }
    });

    logger.info(`🔐 Login realizado: ${user.email}`);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        balance: parseFloat(user.balance.toString())
      },
      tokens
    };
  }

  /**
   * Verifica o email do usuário
   */
  async verifyEmail(token: string): Promise<{ user: any }> {
    const verificationToken =
      await prisma.emailVerificationToken.findUnique({
        where: { token },
        include: { user: true }
      });

    if (!verificationToken) {
      throw createError(
        'Token de verificação inválido',
        400,
        'INVALID_TOKEN'
      );
    }
    if (verificationToken.used) {
      throw createError(
        'Token já foi utilizado',
        400,
        'TOKEN_ALREADY_USED'
      );
    }
    if (verificationToken.expiresAt < new Date()) {
      throw createError(
        'Token expirado',
        400,
        'TOKEN_EXPIRED'
      );
    }

    const user = await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { isVerified: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        balance: true
      }
    });

    await prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { used: true }
    });

    logger.info(`✅ Email verificado: ${user.email}`);
    return { user };
  }

  /**
   * Reenvia email de verificação
   */
  async resendVerification(
    email: string
  ): Promise<{ emailSent: boolean }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (!user) {
      throw createError(
        'Usuário não encontrado',
        404,
        'USER_NOT_FOUND'
      );
    }
    if (user.isVerified) {
      throw createError(
        'Email já verificado',
        400,
        'EMAIL_ALREADY_VERIFIED'
      );
    }

    // Invalida tokens antigos
    await prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    });

    // Gera e envia novo token
    const verificationToken = generateSecureToken();
    const expiresAt = getExpirationDate(
      parseInt(
        process.env.EMAIL_VERIFICATION_EXPIRES || '1440',
        10
      )
    );
    await prisma.emailVerificationToken.create({
      data: { token: verificationToken, userId: user.id, expiresAt }
    });
    const emailSent = await emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );

    logger.info(
      `📧 Email de verificação reenviado: ${user.email}`
    );
    return { emailSent };
  }

  /**
   * Solicita recuperação de senha
   */
  async forgotPassword(
    email: string
  ): Promise<{ emailSent: boolean }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    // para segurança, sempre retorna sucesso mesmo se não achar
    if (!user) return { emailSent: true };

    // Invalida tokens antigos
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    });

    // Gera e envia token
    const resetToken = generateSecureToken();
    const expiresAt = getExpirationDate(
      parseInt(
        process.env.PASSWORD_RESET_EXPIRES || '60',
        10
      )
    );
    await prisma.passwordResetToken.create({
      data: { token: resetToken, userId: user.id, expiresAt }
    });
    const emailSent = await emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken
    );

    logger.info(
      `🔑 Recuperação de senha solicitada: ${user.email}`
    );
    return { emailSent };
  }

  /**
   * Redefine a senha a partir do token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean }> {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });
    if (!resetToken) {
      throw createError(
        'Token de recuperação inválido',
        400,
        'INVALID_TOKEN'
      );
    }
    if (resetToken.used) {
      throw createError(
        'Token já foi utilizado',
        400,
        'TOKEN_ALREADY_USED'
      );
    }
    if (resetToken.expiresAt < new Date()) {
      throw createError(
        'Token expirado',
        400,
        'TOKEN_EXPIRED'
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    });
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    });
    await prisma.userSession.updateMany({
      where: { userId: resetToken.userId },
      data: { isActive: false }
    });

    logger.info(
      `🔑 Senha redefinida: ${resetToken.user.email}`
    );
    return { success: true };
  }

  /**
   * Gera novo accessToken a partir do refreshToken
   */
  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string }> {
    const session = await prisma.userSession.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });
    if (
      !session ||
      !session.isActive ||
      session.expiresAt < new Date()
    ) {
      throw createError(
        'Refresh token inválido ou expirado',
        401,
        'INVALID_REFRESH_TOKEN'
      );
    }
    const accessToken =
      jwtService.refreshAccessToken(refreshToken);
    logger.info(
      `🔄 Token renovado: ${session.user.email}`
    );
    return { accessToken };
  }

  /**
   * Desloga o usuário (invalida o refreshToken)
   */
  async logout(refreshToken: string): Promise<{
    success: boolean;
  }> {
    await prisma.userSession.updateMany({
      where: { token: refreshToken },
      data: { isActive: false }
    });
    logger.info('👋 Logout realizado');
    return { success: true };
  }
}

export default new AuthService();
