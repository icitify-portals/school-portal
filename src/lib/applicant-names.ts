/**
 * Robust applicant name extraction from admission form data.
 *
 * Application templates use inconsistent field labels for the same
 * concept ("FirstName", "First Name", "first_name", "Surname",
 * "Last Name", ...). Ad-hoc `formData.firstName || formData['First Name']`
 * chains silently miss some spellings — e.g. template 17/18 use
 * "FirstName" (no space) and "Last Name" (with space), which wiped
 * users.first_name/surname and corrupted users.name to the middle name
 * when admins edited an applicant.
 *
 * extractNameParts() matches keys case-insensitively across all known
 * aliases and trims the values (applicants often leave leading/trailing
 * spaces, e.g. " PRECIOUS").
 */

const FIRST_NAME_ALIASES = ['firstname', 'first name', 'first_name'];
const MIDDLE_NAME_ALIASES = ['middlename', 'middle name', 'middle_name', 'othernames', 'other names', 'other_names'];
const LAST_NAME_ALIASES = ['lastname', 'last name', 'last_name', 'surname'];

// Labels are authored by hand in the template builder, so they drift in more
// ways than case: "Last  Name" (double space) and " Last Name " (padded) are
// the same field as "Last Name". Normalize both sides before comparing,
// otherwise a stray space silently drops the value.
function normalizeKey(k: unknown): string {
    return String(k ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function findValue(formData: Record<string, any>, aliases: string[]): string {
    const keys = Object.keys(formData || {});
    for (const alias of aliases) {
        const key = keys.find(k => normalizeKey(k) === normalizeKey(alias));
        if (key) {
            const v = formData[key];
            if (typeof v === 'string' && v.trim()) return v.replace(/\s+/g, ' ').trim();
            if (typeof v === 'number') return String(v);
        }
    }
    return '';
}

/**
 * Resolve a field value from admission form data across label aliases,
 * matching keys case-insensitively (e.g. "Gender"/"gender"/"Sex").
 * Form templates key the data JSON by field label, so direct `formData.gender`
 * chains silently miss labels like "Gender".
 */
export function findFormValue(formData: Record<string, any>, aliases: string[]): string {
    const keys = Object.keys(formData || {});
    for (const alias of aliases) {
        const key = keys.find(k => normalizeKey(k) === normalizeKey(alias));
        if (key) {
            const v = formData[key];
            if (typeof v === 'string' && v.trim()) return v.replace(/\s+/g, ' ').trim();
            if (typeof v === 'number') return String(v);
        }
    }
    return '';
}

export function extractNameParts(formData: Record<string, any>): { firstName: string; middleName: string; lastName: string } {
    return {
        firstName: findValue(formData, FIRST_NAME_ALIASES),
        middleName: findValue(formData, MIDDLE_NAME_ALIASES),
        lastName: findValue(formData, LAST_NAME_ALIASES),
    };
}

/** Full name in portal convention: SURNAME First Middle */
export function buildFullName(parts: { firstName?: string; middleName?: string; lastName?: string }): string {
    return `${parts.lastName || ''} ${parts.firstName || ''} ${parts.middleName || ''}`
        .replace(/\s+/g, ' ')
        .trim();
}
