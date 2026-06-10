// prisma/seed.js
// Creates a demo tenant + owner for development/testing.
// Run: node prisma/seed.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding development database...');

  const trialStart = new Date();
  const trialEnd = new Date(trialStart);
  trialEnd.setDate(trialEnd.getDate() + 30);

  // Demo tenant: Barbería El Corte
  const tenant = await prisma.tenant.upsert({
    where: { phoneNumberId: 'TEST_PHONE_NUMBER_ID' },
    update: {
      businessName: 'Barbería El Corte',
      businessType: 'barbershop',
      city: 'Morelia',
      timezone: 'America/Mexico_City',
      waAccessToken: 'TEST_ACCESS_TOKEN',
      status: 'TRIAL',
      businessOpen: true,
    },
    create: {
      businessName: 'Barbería El Corte',
      businessType: 'barbershop',
      city: 'Morelia',
      timezone: 'America/Mexico_City',
      phoneNumberId: 'TEST_PHONE_NUMBER_ID',
      waAccessToken: 'TEST_ACCESS_TOKEN',
      webhookVerifyToken: 'localbot_verify_' + crypto.randomBytes(8).toString('hex'),
      status: 'TRIAL',
      trialStart,
      trialEnd,
      businessOpen: true,
    },
  });

  console.log(`✅ Tenant created: ${tenant.businessName} (id: ${tenant.id})`);

  // Owner user: admin@localbot.dev / password: admin123
  const passwordHash = await bcrypt.hash('admin123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'admin@localbot.dev' },
    update: {
      tenantId: tenant.id,
      passwordHash,
      role: 'OWNER',
    },
    create: {
      tenantId: tenant.id,
      email: 'admin@localbot.dev',
      passwordHash,
      role: 'OWNER',
    },
  });

  console.log(`✅ User created: ${user.email} (password: admin123)`);

  // Default services
  const services = [
    { name: 'Corte de Cabello', durationMin: 30, price: 100 },
    { name: 'Corte + Barba', durationMin: 45, price: 150 },
    { name: 'Rasurado Clásico', durationMin: 30, price: 80 },
    { name: 'Corte Infantil', durationMin: 20, price: 70 },
  ];

  for (const s of services) {
    await prisma.service.create({
      data: { tenantId: tenant.id, ...s, price: s.price },
    });
  }

  console.log(`✅ ${services.length} services created`);

  // Weekly schedule: Mon–Sat 9:00–19:00, Sun closed
  const schedule = [
    { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '19:00' },
    { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '19:00' },
    { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '19:00' },
    { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '19:00' },
    { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '19:00' },
    { dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '16:00' },
    { dayOfWeek: 7, isOpen: false, openTime: '09:00', closeTime: '13:00' },
  ];

  for (const day of schedule) {
    await prisma.scheduleTemplate.upsert({
      where: { tenantId_dayOfWeek: { tenantId: tenant.id, dayOfWeek: day.dayOfWeek } },
      update: {
        isOpen: day.isOpen,
        openTime: day.openTime,
        closeTime: day.closeTime,
      },
      create: { tenantId: tenant.id, ...day },
    });
  }

  console.log('✅ Weekly schedule created (Mon–Sat open, Sun closed)');
  console.log('\n─────────────────────────────────────────');
  console.log(`Tenant ID:  ${tenant.id}`);
  console.log(`Login:      admin@localbot.dev / admin123`);
  console.log(`Webhook:    POST /webhook/${tenant.id}`);
  console.log(`Verify tok: ${tenant.webhookVerifyToken}`);
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
