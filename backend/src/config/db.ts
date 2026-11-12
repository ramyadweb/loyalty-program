import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

//Create PostgreSQL connect pool
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

//Create Drizzle database connection
export const db = drizzle(pool);

//Check database connection
pool.on("connect", () => {
    console.log("PostgreSQL connected successfully!");
});

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL error:", error);
});


