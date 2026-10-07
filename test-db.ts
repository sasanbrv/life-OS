
import { prisma } from "./lib/prisma";

async function main() {
  await prisma.$connect();

  const result = await prisma.$queryRaw<
    { current_database: string }[]
  >`SELECT current_database()`;

  console.log("Database connected:", result[0].current_database);

  const user = await prisma.user.findUnique({
    where: { email: "test@example.com" },
  });

  console.log("User query successful:", user);
}

main()
  .catch((error) => {
    console.error("Database test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
