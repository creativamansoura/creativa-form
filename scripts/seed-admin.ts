#!/usr/bin/env tsx
/**
 * Seed script — run once to create the single admin account.
 * Usage:  npm run seed:admin
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from environment (use .env.local or export manually).
 * Upserts the admin doc so re-running is safe.
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "❌  Missing env vars. Set MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD before running."
  );
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log("✅  Connected to MongoDB");

  // Inline schema to avoid circular model caching issues in a script context
  const AdminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  });

  const Admin =
    mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD!, 12);

  await Admin.findOneAndUpdate(
    { email: ADMIN_EMAIL!.toLowerCase().trim() },
    { email: ADMIN_EMAIL!.toLowerCase().trim(), passwordHash },
    { upsert: true, new: true }
  );

  console.log(`✅  Admin upserted: ${ADMIN_EMAIL}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
