import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function setup() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "caresync",
      port: parseInt(process.env.DB_PORT || "3306", 10),
    });

    const dbName = process.env.DB_NAME || "caresync";
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Database '${dbName}' verified/created successfully.`);
    await connection.end();
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

setup();
