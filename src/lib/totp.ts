import crypto from "crypto";

/**
 * Decodes a base32 encoded string into a Buffer.
 * Supports standard RFC 4648 base32 alphabet (A-Z, 2-7).
 */
export function decodeBase32(charSequence: string): Buffer {
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const cleanSeq = charSequence.toUpperCase().replace(/=+$/, "");
    let bits = 0;
    let value = 0;
    const bufferList: number[] = [];

    for (let i = 0; i < cleanSeq.length; i++) {
        const idx = base32chars.indexOf(cleanSeq[i]);
        if (idx === -1) {
            throw new Error("Invalid base32 character in key: " + cleanSeq[i]);
        }
        value = (value << 5) | idx;
        bits += 5;

        if (bits >= 8) {
            bufferList.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }
    return Buffer.from(bufferList);
}

/**
 * Encodes a buffer or string into a base32 string.
 */
export function encodeBase32(buffer: Buffer): string {
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = 0;
    let value = 0;
    let output = "";

    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;

        while (bits >= 5) {
            output += base32chars[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += base32chars[(value << (5 - bits)) & 31];
    }

    return output;
}

/**
 * Generates a TOTP code (6-digits by default) for a given base32 secret and time step offset.
 */
export function generateTOTP(secret: string, timeOffsetSteps = 0): string {
    const key = decodeBase32(secret);
    
    // Time counter (30 second intervals)
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30) + timeOffsetSteps;
    
    // Convert counter to 8-byte buffer
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(0, 0); // High 32 bits
    buffer.writeUInt32BE(counter, 4); // Low 32 bits
    
    // HMAC-SHA1
    const hmac = crypto.createHmac("sha1", key);
    hmac.update(buffer);
    const hmacResult = hmac.digest();
    
    // Dynamic truncation
    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const binary =
        ((hmacResult[offset] & 0x7f) << 24) |
        ((hmacResult[offset + 1] & 0xff) << 16) |
        ((hmacResult[offset + 2] & 0xff) << 8) |
        (hmacResult[offset + 3] & 0xff);
    
    // Get 6-digit code
    const otp = binary % 1000000;
    return otp.toString().padStart(6, "0");
}

/**
 * Verifies a 6-digit TOTP code against a secret key with allowed window drift.
 */
export function verifyTOTP(secret: string, code: string, windowSteps = 1): boolean {
    const cleanCode = code.replace(/\s+/g, "");
    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
        return false;
    }

    for (let i = -windowSteps; i <= windowSteps; i++) {
        if (generateTOTP(secret, i) === cleanCode) {
            return true;
        }
    }
    return false;
}

/**
 * Generates a random base32 encoded secret of a specific length (in bytes).
 * Default is 20 bytes (160 bits) which produces a 32 character base32 string.
 */
export function generateBase32Secret(byteLength = 20): string {
    const bytes = crypto.randomBytes(byteLength);
    return encodeBase32(bytes);
}

/**
 * Generates an array of random 8-character hex backup codes.
 */
export function generateBackupCodes(count = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        codes.push(crypto.randomBytes(4).toString("hex"));
    }
    return codes;
}
