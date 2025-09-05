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

try {
  if (process.env.DATABASE_URL) {
    connection = postgres(process.env.DATABASE_URL, {
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
      max: 10,
      connect_timeout: 30,
      idle_timeout: 30,
      max_lifetime: 60 * 30,
      onnotice: () => {}, // Suppress notices
    });
    db = drizzle(connection, { schema });
    console.log("✅ Database connection initialized");
  } else {
    // Create a mock db object that will throw descriptive errors
    db = new Proxy({}, {
      get() {
        throw new Error("Database not configured - add DATABASE_URL environment variable");
      }
    });
  }
} catch (error) {
  console.error("❌ Failed to initialize database connection:", error.message);
  // Create a mock db object that will throw descriptive errors
  db = new Proxy({}, {
    get() {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  });
}

export { connection, db };
