import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const freezeAt = new Date(now);
  freezeAt.setHours(23, 59, 59, 999); // midnight tonight, local server time (see README re: CT handling)

  await prisma.comic.create({
    data: {
      imageUrl: "https://placehold.co/800x600?text=Today%27s+Comic",
      artistName: null, // AI-generated for now
      releaseAt: now, // released immediately for local testing
      freezeAt,
    },
  });

  console.log("Seeded a comic releasing now, freezing at end of today.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
