/**
 * Canonical academic level handling for the whole portal.
 *
 * The portal presents four levels only: ND 1, ND 2, HND 1 and HND 2.
 *
 * Two conventions exist in storage and must never leak into the UI:
 *   - students.current_level and registration_level_controls.level use 1 / 2
 *   - course_department_settings.level uses 100 / 200 / 300 / 400
 *
 * resolveLevel() is the single place that bridges them.
 */

export type CanonicalLevel = 1 | 2;
export type ProgrammeType = 'ND' | 'HND';

/** The only course_department_settings.level values the portal defines. */
export type CourseLevel = 100 | 200 | 300 | 400;

export const COURSE_LEVELS: CourseLevel[] = [100, 200, 300, 400];

export interface ResolvedLevel {
    /** Canonical level: 1 or 2. This is what the student sees and what we store on students. */
    level: CanonicalLevel;
    /** Matching course_department_settings.level. */
    numeric: CourseLevel;
    programmeType: ProgrammeType;
    /** Display label, e.g. "ND 1". */
    label: string;
    /** Set when the stored value was not 1 or 2 and had to be translated. */
    normalised: boolean;
}

/**
 * Reads the programme type defensively. HND is detected from any spelling so
 * that a stray "HND", "hnd" or "H.N.D" still resolves correctly.
 */
export function toProgrammeType(value: string | null | undefined): ProgrammeType {
    return String(value ?? '').toUpperCase().replace(/[^A-Z]/g, '').includes('HND')
        ? 'HND'
        : 'ND';
}

/**
 * Resolves any stored level (1, 2, 100, 200, 300, 400 or the legacy 500) to
 * the canonical four-level model.
 *
 * A 500 is HND 3, which no longer exists in the ND 1 / ND 2 / HND 1 / HND 2
 * model, so it collapses to HND 2. `normalised` is true whenever the input was
 * not already canonical, which lets callers log the translation.
 *
 * Returns null only for values that cannot be interpreted at all.
 */
export function resolveLevel(
    level: number | string | null | undefined,
    programmeType?: string | null
): ResolvedLevel | null {
    if (level === null || level === undefined || level === '') return null;

    const raw = typeof level === 'string' ? parseInt(level, 10) : level;
    if (!Number.isFinite(raw)) return null;

    // Numeric 100-500 implies the programme type on its own.
    if (raw >= 100) {
        if (raw === 500) {
            return { level: 2, numeric: 400, programmeType: 'HND', label: 'HND 2', normalised: true };
        }
        const numeric = raw as CourseLevel;
        if (!COURSE_LEVELS.includes(numeric)) return null;
        const type: ProgrammeType = numeric >= 300 ? 'HND' : 'ND';
        const lvl: CanonicalLevel = numeric % 200 === 0 ? 2 : 1;
        return { level: lvl, numeric, programmeType: type, label: `${type} ${lvl}`, normalised: true };
    }

    if (raw === 1 || raw === 2) {
        const type = toProgrammeType(programmeType);
        const numeric: CourseLevel = type === 'HND'
            ? (raw === 1 ? 300 : 400)
            : (raw === 1 ? 100 : 200);
        return {
            level: raw,
            numeric,
            programmeType: type,
            label: `${type} ${raw}`,
            normalised: programmeType ? type !== toProgrammeType(programmeType) : false
        };
    }

    return null;
}

/** Display label, e.g. "ND 2". Falls back to the raw value rather than lying. */
export function levelLabel(
    level: number | string | null | undefined,
    programmeType?: string | null
): string {
    const resolved = resolveLevel(level, programmeType);
    if (resolved) return resolved.label;
    if (level === null || level === undefined || level === '') return 'N/A';
    return String(level);
}

/** All four levels a programme may offer, for admin selectors. */
export function allLevelsFor(programmeType?: string | null) {
    const type = toProgrammeType(programmeType);
    return ([1, 2] as CanonicalLevel[]).map((lvl) => resolveLevel(lvl, type)!);
}

/**
 * Only an unambiguous F is treated as a carry-over. The official grading scale
 * in this portal defines A, B, C and F (F = 0 points, marks 0-49). Any other
 * letter stored in student_results is outside the scale and must not be
 * guessed at, because a wrong guess forces a student into a lower-level course.
 */
export const CARRY_OVER_GRADES = ['F'] as const;

/**
 * Resolves a course_department_settings.level row back to the student's
 * programme type, so a level can be compared across the two conventions.
 */
export function numericForLevel(level: CanonicalLevel, programmeType?: string | null): CourseLevel {
    return resolveLevel(level, programmeType)!.numeric;
}