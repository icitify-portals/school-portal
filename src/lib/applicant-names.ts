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

export interface ExtractedBiodata {
    surname: string;
    firstName: string;
    middleName: string;
    fullName: string;
    gender: string;
    dob: string;
    stateOfOrigin: string;
    lga: string;
    nin: string;
    phone: string;
    email: string;
    jambNumber: string;
}

export function extractBiodataFields(params: {
    formData?: Record<string, any> | null;
    student?: Record<string, any> | null;
    user?: Record<string, any> | null;
    application?: Record<string, any> | null;
}): ExtractedBiodata {
    const fd = params.formData || {};
    const s = params.student || {};
    const u = params.user || {};
    const app = params.application || {};

    const formNames = extractNameParts(fd);

    let surname = String(u.surname || formNames.lastName || s.lastName || s.last_name || '').trim();
    let middleName = String(u.middleName || u.middle_name || s.otherNames || s.other_names || formNames.middleName || '').trim();
    let firstName = String(u.firstName || u.first_name || formNames.firstName || s.firstName || s.first_name || '').trim();

    // If student.firstName had "First Middle" combined and middleName was missing or appended, split cleanly
    if (firstName && !middleName && firstName.includes(' ')) {
        const parts = firstName.split(/\s+/);
        firstName = parts[0];
        middleName = parts.slice(1).join(' ');
    } else if (firstName && middleName && firstName.toLowerCase().endsWith(' ' + middleName.toLowerCase())) {
        firstName = firstName.slice(0, firstName.length - middleName.length).trim();
    }

    // Fallback to user.name if surname or firstName is still empty
    if ((!surname || !firstName) && u.name) {
        const parts = String(u.name).trim().split(/\s+/);
        if (!surname && parts.length > 0) surname = parts[0];
        if (!firstName && parts.length > 1) firstName = parts[1];
        if (!middleName && parts.length > 2) middleName = parts.slice(2).join(' ');
    }

    const fullName = buildFullName({ lastName: surname, firstName, middleName });

    const rawGenderFromForm = findFormValue(fd, ['gender', 'sex']);
    const rawStuGender = String(s.gender || '').trim();
    const chosenGender = (rawStuGender && rawStuGender.toLowerCase() !== 'other')
        ? rawStuGender
        : (rawGenderFromForm || rawStuGender || '');
    const gender = chosenGender
        ? chosenGender.charAt(0).toUpperCase() + chosenGender.slice(1).toLowerCase()
        : '';

    const dob = String(
        s.dob ||
        findFormValue(fd, ['date of birth', 'dob', 'date_of_birth', 'birth date', 'birthdate']) ||
        (fd.__ninData && (fd.__ninData.birthdate || fd.__ninData.dob || fd.__ninData.dateOfBirth)) ||
        ''
    ).trim();

    const stateOfOrigin = String(
        s.stateOfOrigin ||
        s.state_of_origin ||
        findFormValue(fd, ['state of origin', 'stateoforigin', 'state_of_origin', 'state']) ||
        ''
    ).trim();

    const lga = String(
        s.lga ||
        findFormValue(fd, ['l.g.a', 'l.g.a.', 'lga', 'local government', 'local government area', 'lga of origin', 'local_government']) ||
        ''
    ).trim();

    const ninCandidate = String(
        s.nin ||
        app.nin ||
        findFormValue(fd, ['nin', 'national identification number', 'national id', 'nin_number', 'nin number']) ||
        (fd.__ninData && (fd.__ninData.nin || fd.__ninData.idNumber)) ||
        ''
    ).trim();

    const phone = String(
        u.phone ||
        u.phoneNumber ||
        findFormValue(fd, ['phone', 'phone number', 'phone_number', 'phonenumber', 'telephone', 'mobile', 'whatsapp number', 'whatsapp']) ||
        s.guardianPhone ||
        s.guardian_phone ||
        ''
    ).trim();

    const email = String(
        u.email ||
        findFormValue(fd, ['email', 'email address', 'email_address']) ||
        ''
    ).trim();

    const rawJamb = String(
        s.jambNumber ||
        s.jamb_number ||
        app.jambRegNumber ||
        app.jamb_reg_number ||
        findFormValue(fd, [
            'jamb registration number',
            'jamb reg number',
            'jambregnumber',
            'jamb_reg_number',
            'jamb number',
            'jamb_number',
            'jamb no',
            'utme reg no',
            'utme number'
        ]) ||
        ''
    ).trim();
    const jambNumber = /^0+$/.test(rawJamb) || ['NONE', 'NIL', 'N/A', 'NA', 'NULL', 'DIRECT', 'TEMP'].includes(rawJamb.toUpperCase())
        ? ''
        : rawJamb;

    return {
        surname,
        firstName,
        middleName,
        fullName,
        gender,
        dob,
        stateOfOrigin,
        lga,
        nin: ninCandidate,
        phone,
        email,
        jambNumber,
    };
}
