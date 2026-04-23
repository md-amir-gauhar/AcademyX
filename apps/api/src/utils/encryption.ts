import crypto from "crypto";

// Encryption configuration
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ""; // Must be 32 bytes (256 bits)
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const AUTH_TAG_LENGTH = 16; // GCM auth tag length

/**
 * Validate encryption key is properly configured
 */
function validateEncryptionKey(): void {
  if (!ENCRYPTION_KEY) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. Please set a 32-byte key."
    );
  }

  const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be 32 bytes (64 hex characters). " +
        `Current length: ${keyBuffer.length} bytes. ` +
        "Generate with: openssl rand -hex 32"
    );
  }
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns base64 encoded string: iv:authTag:encryptedData
 */
export function encrypt(text: string): string {
  validateEncryptionKey();

  // Generate random initialization vector
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );

  // Encrypt the text
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Get authentication tag (for GCM mode integrity verification)
  const authTag = cipher.getAuthTag();

  // Combine iv, authTag, and encrypted data
  // Format: iv:authTag:encryptedData (all in hex)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive data encrypted with AES-256-GCM
 * Accepts format: iv:authTag:encryptedData (base64 encoded)
 */
export function decrypt(encryptedText: string): string {
  validateEncryptionKey();

  // Split the encrypted text into its components
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivHex, authTagHex, encryptedDataHex] = parts;

  // Convert from hex
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encryptedData = Buffer.from(encryptedDataHex, "hex");

  // Create decipher
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );

  // Set authentication tag (for GCM mode integrity verification)
  decipher.setAuthTag(authTag);

  // Decrypt the data
  let decrypted = decipher.update(encryptedData, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if a string is encrypted (has the format iv:authTag:encryptedData)
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  const parts = text.split(":");
  return parts.length === 3 && parts.every((part) => /^[0-9a-f]+$/i.test(part));
}

/**
 * Encrypt Razorpay credentials
 */
export function encryptRazorpayKey(key: string): string {
  return encrypt(key);
}

/**
 * Decrypt Razorpay credentials
 */
export function decryptRazorpayKey(encryptedKey: string): string {
  // If it's not encrypted (backward compatibility), return as-is
  if (!isEncrypted(encryptedKey)) {
    console.warn(
      "⚠️  WARNING: Razorpay key is not encrypted. Please encrypt it for security."
    );
    return encryptedKey;
  }
  return decrypt(encryptedKey);
}
