import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { db } from "./db.server";
import bcrypt from "bcryptjs";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET precisa ser definida");
}
const storage = createCookieSessionStorage({
  cookie: {
    name: "PI_session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  }
});

function getUserSession (request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId (request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    return null;
  }
  return userId;
}

export async function getUser (request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  const user = await db.user.findUnique({
    select: { id: true, name: true },
    where: { id: userId },
  });
  if (!user) {
    throw await logout(request);
  }

  return user;
}

export async function requireUserId (
  request: Request,
  redirectTo: string = new URL(request.url).pathname,
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([
      ["redirectTo", redirectTo],
    ]);
    throw redirect("/login?" + searchParams);
  }
  return userId;
}

type LoginForm = { password: string, username: string };

export async function login ({ username, password }: LoginForm) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user) {
    return null;
  }

  const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isCorrectPassword) {
    return null;
  }

  if (user.firstLogin) {
    await db.user.update({
      where: { id: user.id },
      data: { firstLogin: false },
    });
  }

  return { id: user.id, username, firstLogin: user.firstLogin };
}

export async function logout (request: Request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}

export async function createUserSession (userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}
