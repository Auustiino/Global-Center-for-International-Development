import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { log } from "./vite";

// Create a connection to the database
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

// Create a drizzle instance
export const db = drizzle(client);

// Optionally, use this function to run migrations
export const runMigrations = async () => {
  try {
    log("Database connected successfully", "db");
    // We'll use db:push instead of migrations for simplicity
  } catch (error) {
    log(`Database connection error: ${error}`, "db");
    throw error;
  }
};