// ═══════════════════════════════════════════════════════════════════
// MULTI-FIELD STUDENT MATCHER
// Matches CSV rows to students using multiple strategies
// ═══════════════════════════════════════════════════════════════════

import { parseMatric, extractSerial, getMatricVariants } from './matric-parser';

export interface StudentRecord {
  id: number;
  matricNumber: string | null;
  admissionNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  programmeType: string | null;
  deptId: number | null;
  level: string | null;
  [key: string]: any;
}

export interface MatchResult {
  student: StudentRecord | null;
  confidence: number;
  strategy: string;
  alternatives: { student: StudentRecord; confidence: number; strategy: string }[];
}

/**
 * Normalize a name for comparison
 */
function normalizeName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate name similarity (Levenshtein-inspired)
 */
function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);

  if (na === nb) return 1.0;
  if (!na || !nb) return 0;

  // Check if one contains the other
  if (na.includes(nb) || nb.includes(na)) return 0.9;

  // Split into parts and check overlap
  const partsA = na.split(' ').filter(Boolean);
  const partsB = nb.split(' ').filter(Boolean);

  if (partsA.length === 0 || partsB.length === 0) return 0;

  let matches = 0;
  for (const pa of partsA) {
    for (const pb of partsB) {
      if (pa === pb) { matches++; break; }
      // First 3 chars match
      if (pa.length >= 3 && pb.length >= 3 && pa.slice(0, 3) === pb.slice(0, 3)) {
        matches += 0.5;
        break;
      }
    }
  }

  return matches / Math.max(partsA.length, partsB.length);
}

/**
 * Match a single CSV row to a student using multiple strategies
 */
export function matchStudent(
  identifier: string,
  students: StudentRecord[],
  options?: {
    rowName?: string;
    rowDept?: string;
    rowLevel?: string;
    rowProgrammeType?: string;
  }
): MatchResult {
  const result: MatchResult = {
    student: null,
    confidence: 0,
    strategy: 'none',
    alternatives: [],
  };

  const candidates: { student: StudentRecord; confidence: number; strategy: string }[] = [];

  // ─── Strategy 1: Exact matric number match (100%) ───
  const identifierLower = identifier.trim().toLowerCase();
  for (const s of students) {
    if (s.matricNumber?.toLowerCase() === identifierLower) {
      candidates.push({ student: s, confidence: 1.0, strategy: 'exact_matric' });
    }
    if (s.admissionNumber?.toLowerCase() === identifierLower) {
      candidates.push({ student: s, confidence: 0.99, strategy: 'exact_admission' });
    }
  }

  // ─── Strategy 2: Matric variants (90-95%) ───
  if (candidates.length === 0) {
    const variants = getMatricVariants(identifier);
    for (const variant of variants) {
      for (const s of students) {
        if (s.matricNumber?.toLowerCase() === variant.toLowerCase()) {
          candidates.push({ student: s, confidence: 0.9, strategy: 'matric_variant' });
        }
      }
    }
  }

  // ─── Strategy 3: Serial number match (70-85%) ───
  if (candidates.length === 0) {
    const serial = extractSerial(identifier, 5);
    if (serial) {
      for (const s of students) {
        if (s.matricNumber) {
          const sSerial = extractSerial(s.matricNumber, 5);
          if (sSerial === serial) {
            candidates.push({ student: s, confidence: 0.75, strategy: 'serial_match' });
          }
        }
      }
    }
  }

  // ─── Strategy 4: Name + Department + Level match (60-80%) ───
  if (candidates.length === 0 && options?.rowName) {
    for (const s of students) {
      const nameSim = nameSimilarity(options.rowName, s.name || s.firstName + ' ' + s.lastName);
      if (nameSim >= 0.7) {
        let boost = 0;
        // Boost if dept matches
        if (options.rowDept && s.matricNumber) {
          const parsed = parseMatric(s.matricNumber);
          if (parsed.department && parsed.department.toLowerCase() === options.rowDept.toLowerCase()) {
            boost += 0.1;
          }
        }
        // Boost if level matches
        if (options.rowLevel && s.level) {
          if (s.level.toLowerCase() === options.rowLevel.toLowerCase()) {
            boost += 0.05;
          }
        }
        candidates.push({
          student: s,
          confidence: Math.min(nameSim * 0.8 + boost, 0.85),
          strategy: 'name_dept_match',
        });
      }
    }
  }

  // ─── Strategy 5: Name-only fuzzy match (50-70%) ───
  if (candidates.length === 0 && options?.rowName) {
    for (const s of students) {
      const nameSim = nameSimilarity(options.rowName, s.name || s.firstName + ' ' + s.lastName);
      if (nameSim >= 0.8) {
        candidates.push({
          student: s,
          confidence: nameSim * 0.7,
          strategy: 'name_fuzzy',
        });
      }
    }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);

  if (candidates.length > 0) {
    result.student = candidates[0].student;
    result.confidence = candidates[0].confidence;
    result.strategy = candidates[0].strategy;
    result.alternatives = candidates.slice(1);
  }

  return result;
}

/**
 * Batch match multiple CSV rows to students
 */
export function batchMatchStudents(
  rows: { identifier: string; rowName?: string; rowDept?: string; rowLevel?: string; rowIndex: number }[],
  students: StudentRecord[]
): {
  matches: { rowIndex: number; match: MatchResult }[];
  unmatched: { rowIndex: number; identifier: string; reason: string }[];
  lowConfidence: { rowIndex: number; match: MatchResult }[];
} {
  const matches: { rowIndex: number; match: MatchResult }[] = [];
  const unmatched: { rowIndex: number; identifier: string; reason: string }[] = [];
  const lowConfidence: { rowIndex: number; match: MatchResult }[] = [];

  for (const row of rows) {
    if (!row.identifier || row.identifier.trim() === '') {
      unmatched.push({ rowIndex: row.rowIndex, identifier: '', reason: 'Missing matric number' });
      continue;
    }

    const match = matchStudent(row.identifier, students, {
      rowName: row.rowName,
      rowDept: row.rowDept,
      rowLevel: row.rowLevel,
    });

    if (match.student) {
      matches.push({ rowIndex: row.rowIndex, match });
      if (match.confidence < 0.8) {
        lowConfidence.push({ rowIndex: row.rowIndex, match });
      }
    } else {
      unmatched.push({ rowIndex: row.rowIndex, identifier: row.identifier, reason: 'No matching student found' });
    }
  }

  return { matches, unmatched, lowConfidence };
}
