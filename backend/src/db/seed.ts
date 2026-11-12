import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, pool } from "../config/db.js";
import { users, rewards } from "./schema.js";

async function seed() {
  try {
    console.log("Seeding initial data...");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@loyalty.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
    const adminName = "System Administrator";

    // Check if admin already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existing.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await db.insert(users).values({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        status: "approved",
        isActive: true,
        approvedAt: new Date(),
      });
      console.log(`[SEED] Admin created successfully: ${adminEmail} (password: ${adminPassword})`);
    } else {
      console.log(`[SEED] Admin already exists: ${adminEmail}`);
    }

    // Seed default rewards if empty
    const existingRewards = await db.select().from(rewards).limit(1);
    if (existingRewards.length === 0) {
      await db.insert(rewards).values([
        {
          name: "Amazon Gift Card",
          description: "Get a digital gift voucher for electronics and lifestyle purchases.",
          pointsRequired: 1000,
          stock: 50,
          image: "🎁",
          status: "active",
        },
        {
          name: "Shopping Voucher",
          description: "Enjoy instantaneous merchant discounts on partner ecommerce sites.",
          pointsRequired: 1500,
          stock: 40,
          image: "🛍️",
          status: "active",
        },
        {
          name: "Movie Ticket",
          description: "Redeem complimentary cinema and multiplex passes with your points.",
          pointsRequired: 800,
          stock: 100,
          image: "🎬",
          status: "active",
        },
        {
          name: "Premium Gift Box",
          description: "Curated luxury artisan package shipped directly to your address.",
          pointsRequired: 3000,
          stock: 20,
          image: "🎀",
          status: "active",
        },
        {
          name: "Dining Voucher",
          description: "Enjoy fine dining and casual gourmet discounts across partner venues.",
          pointsRequired: 1200,
          stock: 60,
          image: "🍔",
          status: "active",
        },
        {
          name: "Flight & Hotel Voucher",
          description: "Save big on your next domestic or international travel reservation.",
          pointsRequired: 4000,
          stock: 15,
          image: "✈️",
          status: "active",
        },
      ]);
      console.log("[SEED] Initial catalog rewards seeded successfully.");
    }
  } catch (error) {
    console.error("[SEED] Seeding failed:", error);
  } finally {
    await pool.end();
  }
}

seed();

