/**
 * Pure Post-UTME screening logic.
 * Kept out of 'use server' modules: Next.js only allows async function
 * exports from server-action files, and these helpers are synchronous
 * pure functions shared by actions, tests, and UI.
 */

/** Screening % = combined Math + English total out of 200, expressed as a percentage. */
export function computeScreeningPercentage(totalScore: number): number {
    return parseFloat(((totalScore / 200) * 100).toFixed(2));
}

/**
 * Decision rule: offered when percentage >= cut-off AND not marked absent.
 * Absent applicants keep 'screened' regardless of score.
 */
export function decideFromScreening(percentage: number, cutoffPercent: number, attendance: string | null | undefined): 'admitted' | 'screened' {
    if (attendance === 'absent') return 'screened';
    return percentage >= cutoffPercent ? 'admitted' : 'screened';
}
