import { Prisma, PrismaClient } from "../../app/generated/prisma"
import { v4 } from 'uuid'

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const users = [
    {
      uid: v4().toString(),
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      status: 'active',
    },
    {
      uid: v4().toString(),
      name: 'Bob Williams',
      email: 'bob.williams@example.com',
      status: 'inactive',
    },
    {
      uid: v4().toString(),
      name: 'Charlie Brown',
      email: 'charlie.b@example.com',
      status: 'active',
    },
    {
      uid: v4().toString(),
      name: 'Diana Prince',
      email: 'diana.p@example.com',
      status: 'pending',
    },
    {
      uid: v4().toString(),
      name: 'Eve Adams',
      email: 'eve.adams@example.com',
      status: 'active',
    },
  ];

  // Create users
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData
    });
    console.log(`Created user with id: ${user.uid}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
