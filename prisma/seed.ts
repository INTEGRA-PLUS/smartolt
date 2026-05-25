import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminTenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Demo ISP',
      subdomain: 'demo',
      xToken: 'demo-x-token-replace-with-real',
      isActive: true,
      status: 'active',
      description: 'Demo tenant for testing',
      rateLimitPerMinute: 100,
      rateLimitBurst: 200,
      contactEmail: 'admin@demo-isp.com',
    },
  });

  console.log(`✅ Tenant created: ${adminTenant.name}`);

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: {},
    create: {
      tenantId: adminTenant.id,
      email: env.ADMIN_EMAIL,
      passwordHash,
      name: 'System Administrator',
      role: 'admin',
      isActive: true,
    },
  });

  console.log(`✅ Admin user created: ${adminUser.email}`);
  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
