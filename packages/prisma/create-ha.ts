import prisma from './index';
import { hashPassword } from '@quillsocial/features/auth/lib/hashPassword';

async function main() {
  const email = 'ha.doanmanh@gmail.com';
  const password = await hashPassword('Test1234!');
  const user = await prisma.user.upsert({
    where: { email },
    update: { password },
    create: {
      email,
      username: 'ha.doanmanh',
      name: 'Ha Doan',
      password,
      completedOnboarding: true,
      emailVerified: new Date(),
    }
  });
  console.log('User created:', user.email);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});