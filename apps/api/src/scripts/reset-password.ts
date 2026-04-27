import "dotenv/config";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { user } from "../db/schema";

/**
 * Reset a user's password.
 *
 * Usage:
 *   npx tsx src/scripts/reset-password.ts <email> <newPassword>
 *
 * Example:
 *   npx tsx src/scripts/reset-password.ts admin@acme-academy.test "Windows@10"
 *
 * The user must already exist. The script also marks them as verified so
 * they can log in immediately.
 */

async function main() {
  const [email, newPassword] = process.argv.slice(2);

  if (!email || !newPassword) {
    console.error(
      "Usage: tsx src/scripts/reset-password.ts <email> <newPassword>",
    );
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in .env");
  }

  const matches = await db.select().from(user).where(eq(user.email, email));
  if (matches.length === 0) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }
  if (matches.length > 1) {
    console.error(
      `Multiple users with email ${email} (one per organization). Aborting to avoid ambiguity.`,
    );
    process.exit(1);
  }

  const target = matches[0];
  const hashed = await bcrypt.hash(newPassword, 10);

  await db
    .update(user)
    .set({
      password: hashed,
      isVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(user.id, target.id));

  console.log(`Password reset for ${email}`);
  console.log(`  user id        : ${target.id}`);
  console.log(`  organizationId : ${target.organizationId}`);
  console.log(`  role           : ${target.role}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });
