import prisma from '../../../lib/prisma';
import authService from '../../auth/auth.service';
import { createError } from '../../../middlewares/errorHandler';

describe('AuthService.register', () => {
  beforeAll(async () => {
    await prisma.commissionEvent.deleteMany();
    await prisma.revenueEvent.deleteMany();
    await prisma.order.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should register a user without referralCode', async () => {
    const result = await authService.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!'
    });

    const { user } = result;
    expect(user).toHaveProperty('id');
    expect(user.email).toBe('test@example.com');
  });

  it('should not register with existing email', async () => {
    await expect(
      authService.register({
        name: 'Test User 2',
        email: 'test@example.com',
        password: 'Password123!'
      })
    ).rejects.toMatchObject(
      createError('Email já está em uso', 400, 'EMAIL_IN_USE')
    );
  });
});
