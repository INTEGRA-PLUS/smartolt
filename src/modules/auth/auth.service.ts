import crypto from 'crypto';
import { FastifyInstance } from 'fastify';
import { prisma } from '../../infrastructure/database/prisma';
import { UnauthorizedError } from '../../shared/errors/AppError';
import { generateApiKey, hashApiKey } from '../../shared/utils/helpers';
import { env } from '../../config/env';
import type { LoginDto, CreateApiKeyDto } from './auth.schema';

export class AuthService {
  private app!: FastifyInstance;

  init(app: FastifyInstance) {
    this.app = app;
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: object; tenant: object }> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await this.verifyPassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.tenant.isActive) {
      throw new UnauthorizedError('Tenant account is suspended');
    }

    const accessToken = this.app.jwt.sign(
      {
        sub: user.id,
        tenantId: user.tenantId,
        role: user.role,
      },
      { expiresIn: env.JWT_EXPIRES_IN },
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        subdomain: user.tenant.subdomain,
        status: user.tenant.status,
      },
    };
  }

  async createApiKey(tenantId: string, dto: CreateApiKeyDto) {
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey, env.API_KEY_SALT);
    const keyPrefix = rawKey.substring(0, 12) + '...';

    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId,
        name: dto.name,
        keyHash,
        keyPrefix,
        status: 'active',
        permissions: dto.permissions,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      keyPrefix,
      permissions: apiKey.permissions,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  async validateApiKey(rawKey: string) {
    const keyHash = hashApiKey(rawKey, env.API_KEY_SALT);

    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { tenant: true },
    });

    if (!apiKey || apiKey.status !== 'active') return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
    if (!apiKey.tenant.isActive) return null;

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return apiKey;
  }

  private async verifyPassword(plain: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(plain, hash);
  }
}

export const authService = new AuthService();
