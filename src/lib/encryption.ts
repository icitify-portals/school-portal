import crypto from "crypto";

// SECURITY FIX H-3 + H-6: Use a dedicated ENCRYPTION_KEY env var.
// Throw at module load if missing so misconfiguration is caught immediately at startup.
// Never reuse AUTH_SECRET for data encryption (different security contexts).
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY_RAW) {
    throw new Error(
        "[SECURITY] ENCRYPTION_KEY environment variable is not set. " +
        "Generate a 32-byte hex key with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" " +
        "and add it to your .env file as ENCRYPTION_KEY=<value>"
    );
}

// Ensure the key is exactly 32 bytes for AES-256
const ENCRYPTION_KEY_BUF = Buffer.from(ENCRYPTION_KEY_RAW.substring(0, 64), 'hex').slice(0, 32);
if (ENCRYPTION_KEY_BUF.length < 32) {
    throw new Error(
        "[SECURITY] ENCRYPTION_KEY must be at least a 32-byte hex string (64 hex characters)."
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// AES-256-GCM — Authenticated Encryption (SECURITY FIX H-3)
// GCM provides both confidentiality AND integrity. The 16-byte auth tag
// means tampered ciphertext is detected before decryption — unlike CBC.
// ─────────────────────────────────────────────────────────────────────────────

const GCM_IV_LENGTH = 12; // 96-bit nonce — recommended for AES-GCM
const GCM_TAG_LENGTH = 16;

/**
 * Encrypts text using AES-256-GCM (authenticated encryption).
 * Output format: <iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(GCM_IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY_BUF, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts AES-256-GCM ciphertext.
 * Supports legacy CBC format (two-part iv:data) for backward compatibility.
 */
export function decrypt(text: string): string {
    const parts = text.split(":");

    if (parts.length === 3) {
        // GCM format: iv:authTag:ciphertext
        const iv = Buffer.from(parts[0], "hex");
        const authTag = Buffer.from(parts[1], "hex");
        const encrypted = Buffer.from(parts[2], "hex");
        const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY_BUF, iv);
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    }

    // LEGACY: CBC format (iv:ciphertext) — read-only backward compatibility.
    // New data is always encrypted with GCM. This branch can be removed once
    // all existing CBC-encrypted rows have been re-encrypted.
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = Buffer.from(parts.slice(1).join(":"), "hex");
    // CBC requires AUTH_SECRET as key for legacy data
    const legacyKey = Buffer.from((process.env.AUTH_SECRET || "").substring(0, 32).padEnd(32, "0"));
    const decipher = crypto.createDecipheriv("aes-256-cbc", legacyKey, iv);
    return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString("utf8");
}

// ─────────────────────────────────────────────────────────────────────────────
// Structured Encryption for Messaging — GCM variant
// ─────────────────────────────────────────────────────────────────────────────

export function encryptMessage(text: string): { content: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(GCM_IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY_BUF, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
        content: encrypted.toString("hex"),
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
    };
}

export function decryptMessage(data: { content: string; iv: string; authTag: string } | string): string {
    if (typeof data === "string") return decrypt(data);

    const iv = Buffer.from(data.iv, "hex");
    const encryptedText = Buffer.from(data.content, "hex");
    const authTag = Buffer.from(data.authTag, "hex");

    // Detect legacy CBC-mode messages (authTag was 'cbcmode' placeholder)
    if (data.authTag === "cbcmode") {
        // Legacy CBC read path
        const legacyKey = Buffer.from((process.env.AUTH_SECRET || "").substring(0, 32).padEnd(32, "0"));
        const decipher = crypto.createDecipheriv("aes-256-cbc", legacyKey, iv);
        return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString("utf8");
    }

    // GCM read path
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY_BUF, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString("utf8");
}
