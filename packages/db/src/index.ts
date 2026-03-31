import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { usersTable } from "./schema";

const globalForDb = globalThis as typeof globalThis & {
  __caresyncPool?: mysql.Pool;
  __caresyncDb?: ReturnType<typeof drizzle>;
  __caresyncAdminSeeded?: Promise<void>;
};

function getRequiredEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createPool() {
  return mysql.createPool({
    host: getRequiredEnv("DB_HOST", "127.0.0.1"),
    port: Number(process.env.DB_PORT ?? 3306),
    user: getRequiredEnv("DB_USER"),
    password: getRequiredEnv("DB_PASSWORD"),
    database: getRequiredEnv("DB_NAME"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

const pool = globalForDb.__caresyncPool ?? createPool();
const db = globalForDb.__caresyncDb ?? drizzle(pool);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__caresyncPool = pool;
  globalForDb.__caresyncDb = db;
}

export { db, pool };
export * from "./schema";

export async function ensureAdminUser(options?: {
  email?: string;
  password?: string;
}) {
  const email = options?.email ?? process.env.ADMIN_REFERENCE_ID ?? "navismessenger007@gmail.com";
  const password = options?.password ?? process.env.ADMIN_PASSCODE ?? "Severusnape@2002";

  const seedPromise =
    globalForDb.__caresyncAdminSeeded ??
    (async () => {
      const passwordHash = await bcrypt.hash(password, 10);
      const [existingEmailUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (existingEmailUser) {
        await db
          .update(usersTable)
          .set({
            passwordHash,
            role: "admin",
          })
          .where(eq(usersTable.id, existingEmailUser.id));
        return;
      }

      const [existingAdmin] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.role, "admin"))
        .limit(1);

      if (existingAdmin) {
        await db
          .update(usersTable)
          .set({
            email,
            passwordHash,
            role: "admin",
          })
          .where(eq(usersTable.id, existingAdmin.id));
        return;
      }

      await db.insert(usersTable).values({
        id: crypto.randomUUID(),
        email,
        passwordHash,
        role: "admin",
      });
    })().catch((error) => {
      globalForDb.__caresyncAdminSeeded = undefined;
      throw error;
    });

  globalForDb.__caresyncAdminSeeded = seedPromise;
  await seedPromise;
}
