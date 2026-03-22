import { PrismaClient } from '../src/generated/prisma';
import {
  hashPassword,
  isPasswordHash
} from '../src/infra/security/password.util';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      tenantId: true,
      username: true,
      password: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  let updatedCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    if (isPasswordHash(user.password)) {
      skippedCount += 1;
      continue;
    }

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        password: await hashPassword(user.password)
      }
    });

    updatedCount += 1;
    console.log(
      `[password-backfill] updated ${user.tenantId}/${user.username} (${user.id})`
    );
  }

  console.log(
    `[password-backfill] completed: scanned=${users.length}, updated=${updatedCount}, skipped=${skippedCount}`
  );
}

main()
  .catch((error) => {
    console.error('[password-backfill] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
