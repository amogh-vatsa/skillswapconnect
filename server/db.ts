import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not set. Database operations will fail gracefully.");
  console.warn("📝 To connect to a database, add DATABASE_URL environment variable.");
}

// Create connection for Render's PostgreSQL with better error handling
let connection: any;
let db: any;

// DATABASE CONNECTION DISABLED to prevent ECONNRESET errors
// This ensures no database connection attempts are made
console.log("🔧 Database connection disabled - running in database-free mode");

// Create a mock db object that never attempts connections
db = new Proxy({}, {
  get() {
    throw new Error("Database disabled - app running in database-free mode");
  }
});

export { connection, db };
