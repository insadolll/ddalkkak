import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding DDalKKak v2 database...');

  // 1. OurCompany
  const hubiocem = await prisma.ourCompany.upsert({
    where: { code: 'HUBIOCEM' },
    update: {},
    create: {
      code: 'HUBIOCEM',
      name: '휴바이오켐',
      nameEn: 'HUBIOCEM Co., Ltd.',
      quotationPrefix: 'HB',
      poPrefix: 'HB-PO',
      dsPrefix: 'HB-DS',
    },
  });

  const btms = await prisma.ourCompany.upsert({
    where: { code: 'BTMS' },
    update: {},
    create: {
      code: 'BTMS',
      name: 'BTM서비스',
      nameEn: 'BTM Service Co., Ltd.',
      quotationPrefix: 'BT',
      poPrefix: 'BT-PO',
      dsPrefix: 'BT-DS',
    },
  });

  console.log('  ✓ OurCompany: HUBIOCEM, BTMS');

  // 2. Department
  const deptNames = ['경영지원', '영업', '기술'];
  const departments: Record<string, { id: string }> = {};

  for (const name of deptNames) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    departments[name] = dept;
  }

  console.log('  ✓ Departments:', deptNames.join(', '));

  // 3. Admin account
  const adminPassword = await bcrypt.hash('Admin1234!', 12);

  await prisma.employee.upsert({
    where: { email: 'admin@hubiocem.com' },
    update: {},
    create: {
      employeeNo: 'HB-001',
      email: 'admin@hubiocem.com',
      passwordHash: adminPassword,
      name: '관리자',
      role: 'ADMIN',
      position: '시스템관리자',
      ourCompanyId: hubiocem.id,
      departmentId: departments['경영지원'].id,
      joinDate: new Date('2024-01-01'),
    },
  });

  console.log('  ✓ Admin: admin@hubiocem.com / Admin1234!');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
