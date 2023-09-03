import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();

async function seed () {
  const username = 'administrador';
  const name = "Administrador";
  const password = "Rv<I6h7?oo1R";
  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: {username, name, passwordHash},
  });
}

seed();
