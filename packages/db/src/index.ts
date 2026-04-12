import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { usersTable } from "./schema";

type Db = ReturnType<typeof drizzle>;

const globalForDb = globalThis as typeof globalThis & {
  __caresyncPool?: any;
  __caresyncDb?: Db;
  __caresyncAdminSeeded?: Promise<void>;
};

function getRequiredEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createPool(host?: string) {
  return mysql.createPool({
    host: host ?? getRequiredEnv("DB_HOST", "127.0.0.1"),
    port: Number(process.env.DB_PORT ?? 3306),
    user: getRequiredEnv("DB_USER"),
    password: getRequiredEnv("DB_PASSWORD"),
    database: getRequiredEnv("DB_NAME"),
    waitForConnections: true,
    connectionLimit: process.env.NODE_ENV === "production" ? 50 : 10,
    maxIdle: process.env.NODE_ENV === "production" ? 10 : 2,
    idleTimeout: 60000, // 60 seconds
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    queueLimit: 0,
  });
}

const pool = globalForDb.__caresyncPool ?? createPool();
const db = globalForDb.__caresyncDb ?? drizzle(pool);

// Preparing for multi-db setup (Read Replicas)
const readReplicaHost = process.env.DB_READ_REPLICA_HOST;
const readPool = readReplicaHost ? createPool(readReplicaHost) : pool;
const readDb = readReplicaHost ? drizzle(readPool) : db;

if (process.env.NODE_ENV !== "production") {
  globalForDb.__caresyncPool = pool;
  globalForDb.__caresyncDb = db;
}

export { db, readDb, pool, readPool };
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
