/**
 * Password Strength Validator and Policy Enforcement
 *
 * Rules:
 * 1. Minimum 8 characters.
 * 2. Cannot consist of numbers alone (e.g. phone numbers, PINs).
 * 3. Cannot consist of letters alone.
 * 4. Must contain at least one letter and at least one number.
 * 5. Strong passwords also incorporate uppercase, lowercase, and special characters.
 */

export interface PasswordChecks {
    minLength: boolean;
    hasLetter: boolean;
    hasNumber: boolean;
    notNumbersOnly: boolean;
    notLettersOnly: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasSpecial: boolean;
}

export interface PasswordValidationResult {
    isValid: boolean;
    score: number; // 0 - 5
    label: string;
    color: string;
    barColor: string;
    errors: string[];
    firstError?: string;
    checks: PasswordChecks;
}

export function validatePasswordStrength(password: string | null | undefined): PasswordValidationResult {
    const clean = String(password ?? '').trim();

    const minLength = clean.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(clean);
    const hasNumber = /[0-9]/.test(clean);
    const isNumbersOnly = clean.length > 0 && /^[0-9]+$/.test(clean);
    const isLettersOnly = clean.length > 0 && /^[a-zA-Z]+$/.test(clean);
    const hasUppercase = /[A-Z]/.test(clean);
    const hasLowercase = /[a-z]/.test(clean);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(clean);

    const checks: PasswordChecks = {
        minLength,
        hasLetter,
        hasNumber,
        notNumbersOnly: !isNumbersOnly,
        notLettersOnly: !isLettersOnly,
        hasUppercase,
        hasLowercase,
        hasSpecial,
    };

    const errors: string[] = [];

    if (!clean) {
        errors.push("Password cannot be empty.");
    } else {
        if (isNumbersOnly) {
            errors.push("Password cannot consist of numbers alone. Please include at least one letter and one number for account security.");
        }
        if (isLettersOnly) {
            errors.push("Password cannot consist of letters alone. Please include at least one number.");
        }
        if (!minLength) {
            errors.push(`Password must be at least 8 characters long (currently ${clean.length} characters).`);
        }
        if (!hasLetter && !isNumbersOnly) {
            errors.push("Password must contain at least one letter (a-z or A-Z).");
        }
        if (!hasNumber && !isLettersOnly) {
            errors.push("Password must contain at least one number (0-9).");
        }
    }

    const isValid = clean.length >= 8 && hasLetter && hasNumber && !isNumbersOnly && !isLettersOnly;

    // Calculate score (0-5)
    let score = 0;
    if (clean.length >= 8) score++;
    if (clean.length >= 12) score++;
    if (hasLetter && hasNumber) score++;
    if (hasUppercase && hasLowercase) score++;
    if (hasSpecial) score++;

    if (!isValid) {
        score = Math.min(score, 1);
    }

    let label = "Weak";
    let color = "text-rose-500";
    let barColor = "bg-rose-500";

    if (!clean) {
        label = "";
        color = "text-slate-400";
        barColor = "bg-slate-200";
    } else if (isNumbersOnly) {
        label = "Insecure (Numbers Only)";
        color = "text-rose-600";
        barColor = "bg-rose-600";
    } else if (!isValid) {
        label = "Too Weak";
        color = "text-rose-500";
        barColor = "bg-rose-500";
    } else if (score >= 5) {
        label = "Very Strong";
        color = "text-emerald-600";
        barColor = "bg-emerald-600";
    } else if (score >= 4) {
        label = "Strong";
        color = "text-emerald-500";
        barColor = "bg-emerald-500";
    } else if (score >= 3) {
        label = "Medium";
        color = "text-amber-500";
        barColor = "bg-amber-500";
    } else {
        label = "Fair";
        color = "text-orange-500";
        barColor = "bg-orange-500";
    }

    return {
        isValid,
        score,
        label,
        color,
        barColor,
        errors,
        firstError: errors[0],
        checks,
    };
}
