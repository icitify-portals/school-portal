/**
 * Course code normalisation helpers.
 *
 * The `courses` table historically accumulated codes with trailing tabs,
 * leading/trailing spaces and inconsistent inner spacing (e.g. "STA 111",
 * "STA 111\t", "   ACC 414     "). Matching a CSV cell against those values
 * with plain string equality silently misses, which is what allowed the
 * uploader to auto-create a second row for a course that already existed.
 *
 * These helpers are pure so they can be used from both server actions and
 * client components.
 */

export function normalizeCourseCode(value: unknown): string {
  return String(value ?? "")
    .replace(/[\u00a0\t\r\n\v\f]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim()
    .toUpperCase();
}

/** Loose key for grouping codes that differ only by spacing or punctuation. */
export function courseCodeKey(value: unknown): string {
  return normalizeCourseCode(value).replace(/[^A-Z0-9]+/g, "");
}

type CourseLike = { id: number; code: string };

/**
 * Resolve a course from a list using tolerant matching:
 * 1. exact match on the normalised code ("STA 111" === "STA 111")
 * 2. loose match on the alphanumeric key ("STA111" === "STA 111")
 */
export function findCourseByCode<T extends CourseLike>(
  courses: T[],
  code: unknown
): T | undefined {
  const normalized = normalizeCourseCode(code);
  if (!normalized) return undefined;

  const exact = courses.find((c) => normalizeCourseCode(c.code) === normalized);
  if (exact) return exact;

  const key = courseCodeKey(normalized);
  if (!key) return undefined;
  return courses.find((c) => courseCodeKey(c.code) === key);
}

/** Index a course list by both normalised code and loose key for O(1) lookups. */
export function buildCourseCodeIndex<T extends CourseLike>(courses: T[]) {
  const byNormalized = new Map<string, T>();
  const byKey = new Map<string, T>();

  for (const course of courses) {
    const normalized = normalizeCourseCode(course.code);
    if (normalized && !byNormalized.has(normalized)) byNormalized.set(normalized, course);

    const key = courseCodeKey(course.code);
    if (key && !byKey.has(key)) byKey.set(key, course);
  }

  return {
    find(code: unknown): T | undefined {
      const normalized = normalizeCourseCode(code);
      if (!normalized) return undefined;
      return byNormalized.get(normalized) ?? byKey.get(courseCodeKey(normalized));
    },
  };
}
