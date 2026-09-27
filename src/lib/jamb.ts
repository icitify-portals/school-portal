export interface JambResolution {
    /** The raw candidate as derived, kept for study-mode inference. */
    raw: string;
    /** Safe to persist, or null when the candidate is not a real JAMB number. */
    persistable: string | null;
    /** True when the candidate looks like a genuine JAMB/UTME number. */
    plausible: boolean;
}

// Form fields whose keys contain "jamb" but which are not registration numbers.
const NON_REGNO_KEY = /(score|date|result|total|subtotal|aggregate|subject|centre|center|status)/;

// A JAMB/UTME number is a short alphanumeric token. Real examples are
// "202660003248HI" and "202331672293CAP". Placeholders ("0", "00000", "N/A")
// must never be persisted because students.jamb_number is uniquely indexed.
const PLAUSIBLE = /^[A-Za-z0-9]{8,20}$/;

// Placeholders that are otherwise well-formed (e.g. the literal "undefined",
// which is 9 alphanumeric characters and would slip past PLAUSIBLE).
const PLACEHOLDER = /^(0+|x+|n\/?a|na|none|null|nil|undefined|unknown|notset|not_?set|pending|tbd|temp|temporary|default|test|dummy|placeholder)$/i;

/**
 * Resolve a JAMB/UTME registration number for an application.
 *
 * Preference order:
 *  1. the dedicated `jambRegNumber` column, then
 *  2. a form field whose key mentions jamb/utme but is clearly a registration
 *     number (score/date/result style fields are skipped).
 *
 * The previous implementation took the first key containing "jamb", which for
 * forms carrying both "JAMB Score" and "JAMB Registration Number" captured the
 * score (e.g. "0") and then collided with the unique index on
 * students.jamb_number.
 */
export function resolveJambNumber(
    jambRegNumber: string | null | undefined,
    formData: Record<string, unknown> | null | undefined
): JambResolution {
    let raw = (jambRegNumber || "").trim();

    if (!raw) {
        const data = formData || {};
        const key = Object.keys(data).find((k) => {
            const lk = k.toLowerCase();
            if (!lk.includes("jamb") && !lk.includes("utme")) return false;
            return !NON_REGNO_KEY.test(lk);
        });
        if (key) raw = String(data[key] ?? "").trim();
    }

    const plausible = PLAUSIBLE.test(raw) && !PLACEHOLDER.test(raw);
    return { raw, persistable: plausible ? raw : null, plausible };
}
