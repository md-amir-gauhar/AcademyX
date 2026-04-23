import { db } from "../db";
import { organizationConfig } from "../db/schema";
import { encryptRazorpayKey, isEncrypted } from "../utils/encryption";
import { eq } from "drizzle-orm";

/**
 * Migration script to encrypt existing Razorpay keys in the database
 * Run this once after deploying the encryption feature
 *
 * Usage: npx tsx src/scripts/encrypt-razorpay-keys.ts
 */
async function encryptExistingRazorpayKeys() {
  console.log("🔐 Starting Razorpay key encryption migration...\n");

  try {
    // Fetch all organization configs
    const configs = await db.query.organizationConfig.findMany();

    console.log(`Found ${configs.length} organization configurations\n`);

    let encryptedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const config of configs) {
      try {
        const updates: any = {};
        let needsUpdate = false;

        // Check and encrypt razorpayKeyId if needed
        if (config.razorpayKeyId) {
          if (isEncrypted(config.razorpayKeyId)) {
            console.log(
              `  ✓ Organization ${config.slug}: razorpayKeyId already encrypted`
            );
            skippedCount++;
          } else {
            updates.razorpayKeyId = encryptRazorpayKey(config.razorpayKeyId);
            needsUpdate = true;
            console.log(
              `  🔒 Organization ${config.slug}: Encrypting razorpayKeyId...`
            );
          }
        }

        // Check and encrypt razorpayKeySecret if needed
        if (config.razorpayKeySecret) {
          if (isEncrypted(config.razorpayKeySecret)) {
            console.log(
              `  ✓ Organization ${config.slug}: razorpayKeySecret already encrypted`
            );
            if (!needsUpdate) skippedCount++;
          } else {
            updates.razorpayKeySecret = encryptRazorpayKey(
              config.razorpayKeySecret
            );
            needsUpdate = true;
            console.log(
              `  🔒 Organization ${config.slug}: Encrypting razorpayKeySecret...`
            );
          }
        }

        // Update if needed
        if (needsUpdate) {
          // Update the database with encrypted keys
          await db
            .update(organizationConfig)
            .set(updates)
            .where(
              eq(organizationConfig.organizationId, config.organizationId)
            );
          encryptedCount++;
          console.log(
            `  ✅ Organization ${config.slug}: Successfully encrypted Razorpay keys\n`
          );
        }
      } catch (error) {
        errorCount++;
        console.error(
          `  ❌ Organization ${config.slug}: Error encrypting keys:`,
          error
        );
        console.error();
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`  Total organizations: ${configs.length}`);
    console.log(`  Successfully encrypted: ${encryptedCount}`);
    console.log(`  Already encrypted (skipped): ${skippedCount}`);
    console.log(`  Errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log("\n✅ Migration completed successfully!");
    } else {
      console.log(
        "\n⚠️  Migration completed with some errors. Please check the logs above."
      );
    }

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
encryptExistingRazorpayKeys();
