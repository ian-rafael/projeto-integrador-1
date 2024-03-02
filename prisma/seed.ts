import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();

async function seed () {
  const username = 'administrador';
  const name = "Administrador";
  const password = "senha";
  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.upsert({
    create: { username, name, passwordHash },
    update: { passwordHash },
    where: { username },
  });
}

seed();
