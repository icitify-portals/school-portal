import crypto from "crypto";

const ENCRYPTION_KEY = process.env.AUTH_SECRET || "default_secret_key_32_chars_long!!"; // Fallback for dev
const IV_LENGTH = 16; 

/**
 * AES-256-CBC Encryption Utility
 */

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string): string {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

/** 
 * Structured Encryption for Messaging (with authTag support)
 */
export function encryptMessage(text: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return {
        content: encrypted.toString("hex"),
        iv: iv.toString("hex"),
        authTag: "cbcmode" // Placeholder for CBC compatibility if schema requires it
    };
}

export function decryptMessage(data: { content: string, iv: string, authTag: string } | string): string {
    if (typeof data === 'string') return decrypt(data);
    
    const iv = Buffer.from(data.iv, "hex");
    const encryptedText = Buffer.from(data.content, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
