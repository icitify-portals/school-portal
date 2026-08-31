/**
 * Normalize an email address for validation and storage.
 *
 * Mobile keyboards and copy-paste often inject invisible characters into
 * email inputs (trailing spaces, non-breaking spaces U+00A0, zero-width
 * spaces U+200B/U+200C/U+200D, BOM U+FEFF). These characters make regex
 * validation fail and corrupt stored records, even though the email
 * "looks" correct to the user.
 *
 * This strips ALL Unicode whitespace and zero-width characters, then
 * lowercases the result. It does NOT validate format — pair with a
 * regex check (e.g. /^[^\s@]+@[^\s@]+\.[^\s@]+$/) after normalizing.
 */
export function normalizeEmail(input: unknown): string {
    if (typeof input !== 'string') return '';
    // \s in JS covers U+0020, U+00A0, U+1680, U+2000-200A, U+2028,
    // U+2029, U+202F, U+205F, U+3000, U+FEFF — plus we strip U+200B-D.
    return input.replace(/[\s\u200B-\u200D]+/g, '').toLowerCase();
}

/**
 * Strict-ish email format check for use AFTER normalizeEmail().
 */
export function isValidEmailFormat(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
