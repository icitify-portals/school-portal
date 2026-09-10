/**
 * Feature flags for course module enhancements — all default false (no breaking)
 * Enable via env: NEXT_PUBLIC_ENABLE_COURSE_ENHANCEMENTS=true
 */
export const FEATURES = {
  COURSE_CAPACITY: process.env.NEXT_PUBLIC_ENABLE_COURSE_CAPACITY === "true",
  PREREQ_GRAPH: process.env.NEXT_PUBLIC_ENABLE_PREREQ_GRAPH === "true",
  CBT_UNIFIED: process.env.NEXT_PUBLIC_ENABLE_CBT_UNIFIED === "true",
  LESSON_VERSIONING: process.env.NEXT_PUBLIC_ENABLE_LESSON_VERSIONING === "true",
} as const;

export function isFeatureEnabled(flag: keyof typeof FEATURES): boolean {
  return !!FEATURES[flag];
}
