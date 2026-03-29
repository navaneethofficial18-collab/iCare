import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const poolConnection = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "caresync",
  database: process.env.DB_NAME || "caresync",
  port: parseInt(process.env.DB_PORT || "3300", 10),
});

export const db = drizzle(poolConnection, { schema, mode: "default" });
