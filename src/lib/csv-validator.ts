// ═══════════════════════════════════════════════════════════════════
// CSV VALIDATOR & PREVIEW ENGINE
// Validates CSV data, detects anomalies, and generates preview
// ═══════════════════════════════════════════════════════════════════

import { parseMatric, validateScore } from './matric-parser';
import { matchStudent, StudentRecord, batchMatchStudents } from './student-matcher';

export interface CsvRow {
  matric_number: string;
  [courseCode: string]: any;
}

export interface ValidationResult {
  totalRows: number;
  totalCourses: number;
  validRows: number;
  errors: CsvError[];
  warnings: CsvWarning[];
  anomalies: Anomaly[];
  preview: PreviewRow[];
  summary: {
    autoImport: number;
    needsReview: number;
    willFail: number;
    duplicateCount: number;
    avgScore: number;
    scoreRange: { min: number; max: number };
  };
}

export interface CsvError {
  row: number;
  column: string;
  message: string;
  severity: 'error';
}

export interface CsvWarning {
  row: number;
  column: string;
  message: string;
  severity: 'warning';
}

export interface Anomaly {
  type: 'duplicate_in_csv' | 'score_out_of_range' | 'score_anomaly' | 'missing_student' | 'duplicate_across_batches';
  row: number;
  message: string;
  details: any;
}

export interface PreviewRow {
  rowIndex: number;
  matricNumber: string;
  studentName: string | null;
  studentId: number | null;
  matchConfidence: number;
  matchStrategy: string;
  scores: { courseCode: string; score: number; grade: string | null; isValid: boolean }[];
  status: 'ready' | 'review' | 'error';
}

/**
 * Detect anomalies in CSV data before import
 */
function detectAnomalies(
  rows: CsvRow[],
  courseColumns: string[],
  students: StudentRecord[],
  existingResults?: { studentId: number; courseId: number }[]
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const seenIdentifiers = new Map<string, number[]>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const id = row.matric_number?.trim().toLowerCase();
    if (!id) continue;

    // Track duplicates within CSV
    if (!seenIdentifiers.has(id)) {
      seenIdentifiers.set(id, []);
    }
    seenIdentifiers.get(id)!.push(i);

    // Check each score
    for (const cc of courseColumns) {
      const val = row[cc];
      if (val === undefined || val === null || val === '') continue;

      const numVal = Number(val);

      // Score out of range
      if (numVal > 100) {
        anomalies.push({
          type: 'score_out_of_range',
          row: i + 2,
          message: `Score ${numVal} for ${cc} exceeds 100`,
          details: { courseCode: cc, score: numVal, maxScore: 100 },
        });
      }

      // Negative score
      if (numVal < 0) {
        anomalies.push({
          type: 'score_out_of_range',
          row: i + 2,
          message: `Negative score ${numVal} for ${cc}`,
          details: { courseCode: cc, score: numVal },
        });
      }

      // Check for suspicious patterns: all same score across a column
      const colScores = rows
        .map(r => r[cc])
        .filter(v => v !== undefined && v !== null && v !== '' && !isNaN(Number(v)))
        .map(Number);
      if (colScores.length > 3) {
        const allSame = colScores.every(s => s === colScores[0]);
        if (allSame) {
          anomalies.push({
            type: 'score_anomaly',
            row: i + 2,
            message: `All ${colScores.length} students have the same score (${colScores[0]}) for ${cc} - possible default data`,
            details: { courseCode: cc, score: colScores[0], count: colScores.length },
          });
        }
      }

      // Check for very low or very high scores relative to the batch
      if (colScores.length > 5) {
        const avg = colScores.reduce((a, b) => a + b, 0) / colScores.length;
        const stdDev = Math.sqrt(colScores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / colScores.length);
        if (stdDev > 0 && Math.abs(numVal - avg) > 3 * stdDev) {
          anomalies.push({
            type: 'score_anomaly',
            row: i + 2,
            message: `Score ${numVal} for ${cc} is ${numVal > avg ? 'significantly higher' : 'significantly lower'} than average (${Math.round(avg)} ± ${Math.round(stdDev)})`,
            details: { courseCode: cc, score: numVal, avg: Math.round(avg), stdDev: Math.round(stdDev) },
          });
        }
      }
    }
  }

  // Report duplicates within CSV
  for (const [id, indices] of seenIdentifiers) {
    if (indices.length > 1) {
      for (const idx of indices) {
        anomalies.push({
          type: 'duplicate_in_csv',
          row: idx + 2,
          message: `Matric number '${rows[idx].matric_number}' appears ${indices.length} times in CSV (rows ${indices.map(x => x + 2).join(', ')})`,
          details: { identifier: rows[idx].matric_number, occurrences: indices.map(x => x + 2) },
        });
      }
    }
  }

  // Check for duplicate results across existing batches
  if (existingResults) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const student = students.find(
        s => s.matricNumber?.toLowerCase() === row.matric_number?.trim().toLowerCase()
      );
      if (!student) continue;

      for (const cc of courseColumns) {
        if (row[cc] === undefined || row[cc] === '' || isNaN(Number(row[cc]))) continue;
        // This is a simplified check - in production, you'd query the DB
        const exists = existingResults.some(
          r => r.studentId === student.id
        );
        if (exists) {
          anomalies.push({
            type: 'duplicate_across_batches',
            row: i + 2,
            message: `Student ${student.matricNumber} may already have results in another batch`,
            details: { studentId: student.id, studentName: student.name },
          });
        }
      }
    }
  }

  return anomalies;
}

/**
 * Generate preview of CSV import
 */
function generatePreview(
  rows: CsvRow[],
  courseColumns: string[],
  students: StudentRecord[],
  resolveGrade: (score: number, rules: string) => { grade: string; gradePoint: number }
): PreviewRow[] {
  return rows.map((row, i) => {
    const id = row.matric_number?.trim() || '';
    const match = matchStudent(id, students);

    const scores = courseColumns
      .filter(cc => row[cc] !== undefined && row[cc] !== '' && !isNaN(Number(row[cc])))
      .map(cc => {
        const score = Number(row[cc]);
        const validation = validateScore(score);
        let grade: string | null = null;
        try {
          const g = resolveGrade(score, '[]');
          grade = g.grade;
        } catch {}
        return {
          courseCode: cc,
          score,
          grade,
          isValid: validation.isValid,
        };
      });

    let status: 'ready' | 'review' | 'error' = 'ready';
    if (!match.student) status = 'error';
    else if (match.confidence < 0.8) status = 'review';

    return {
      rowIndex: i + 2,
      matricNumber: id,
      studentName: match.student?.name || null,
      studentId: match.student?.id || null,
      matchConfidence: match.confidence,
      matchStrategy: match.strategy,
      scores,
      status,
    };
  });
}

/**
 * Full CSV validation pipeline
 */
export async function validateCsvImport(
  rows: CsvRow[],
  courseColumns: string[],
  students: StudentRecord[],
  resolveGrade: (score: number, rules: string) => { grade: string; gradePoint: number },
  options?: {
    existingResults?: { studentId: number; courseId: number }[];
    gradingScaleRules?: string;
  }
): Promise<ValidationResult> {
  const errors: CsvError[] = [];
  const warnings: CsvWarning[] = [];

  // ─── Validate each row ───
  rows.forEach((row, i) => {
    if (!row.matric_number || String(row.matric_number).trim() === '') {
      errors.push({ row: i + 2, column: 'matric_number', message: 'Missing matric number', severity: 'error' });
    }

    for (const cc of courseColumns) {
      const val = row[cc];
      if (val === undefined || val === null || val === '') continue;

      const numVal = Number(val);
      if (isNaN(numVal)) {
        errors.push({ row: i + 2, column: cc, message: `Non-numeric value '${val}'`, severity: 'error' });
      } else {
        const validation = validateScore(numVal);
        if (!validation.isValid) {
          errors.push({ row: i + 2, column: cc, message: validation.warning || 'Invalid score', severity: 'error' });
        } else if (validation.warning) {
          warnings.push({ row: i + 2, column: cc, message: validation.warning, severity: 'warning' });
        }
      }
    }
  });

  // ─── Detect anomalies ───
  const anomalies = detectAnomalies(rows, courseColumns, students, options?.existingResults);

  // ─── Batch match students ───
  const matchInput = rows.map((row, i) => ({
    identifier: row.matric_number?.trim() || '',
    rowIndex: i,
  }));
  const matchResults = batchMatchStudents(matchInput, students);

  // Add unmatched errors
  for (const u of matchResults.unmatched) {
    errors.push({ row: u.rowIndex + 2, column: 'matric_number', message: u.reason, severity: 'error' });
  }

  // ─── Generate preview ───
  const preview = generatePreview(rows, courseColumns, students, resolveGrade);

  // ─── Compute summary ───
  const scoreValues: number[] = [];
  for (const row of rows) {
    for (const cc of courseColumns) {
      const val = Number(row[cc]);
      if (!isNaN(val)) scoreValues.push(val);
    }
  }

  const summary = {
    autoImport: preview.filter(p => p.status === 'ready').length,
    needsReview: preview.filter(p => p.status === 'review').length,
    willFail: preview.filter(p => p.status === 'error').length,
    duplicateCount: anomalies.filter(a => a.type === 'duplicate_in_csv').length,
    avgScore: scoreValues.length > 0 ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : 0,
    scoreRange: {
      min: scoreValues.length > 0 ? Math.min(...scoreValues) : 0,
      max: scoreValues.length > 0 ? Math.max(...scoreValues) : 0,
    },
  };

  return {
    totalRows: rows.length,
    totalCourses: courseColumns.length,
    validRows: rows.length - matchResults.unmatched.length,
    errors,
    warnings,
    anomalies,
    preview,
    summary,
  };
}
