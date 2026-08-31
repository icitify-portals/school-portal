// ═══════════════════════════════════════════════════════════════════
// MATRIC NUMBER PARSER & VALIDATOR
// Parses FSS Ibadan matric numbers into structured components
// ═══════════════════════════════════════════════════════════════════

export interface ParsedMatric {
  raw: string;
  isValid: boolean;
  format: string | null;
  faculty: string | null;
  department: string | null;
  mode: 'FT' | 'PT' | null;
  programmeType: 'ND' | 'HND' | null;
  year: number | null;
  serial: number | null;
  serialStr: string | null;
  confidence: number;
}

const DEPT_MAP: Record<string, string> = {
  CSC: 'Computer Science',
  CST: 'Computer Science Technology',
  CBT: 'Computer-Based Technology',
  LIB: 'Library Science',
  SLT: 'Science Laboratory Technology',
  STA: 'Statistics',
  MAT: 'Mathematics',
  PHY: 'Physics',
  CHM: 'Chemistry',
  BIO: 'Biology',
  ENG: 'Engineering',
  MTS: 'Mathematics',
  ACC: 'Accounting',
  BAF: 'Banking & Finance',
  MKT: 'Marketing',
  BUS: 'Business Administration',
  ECO: 'Economics',
  PUB: 'Public Administration',
  POL: 'Political Science',
  SOC: 'Sociology',
  CRK: 'Christian Religious Knowledge',
  IRS: 'Islamic Studies',
  YOR: 'Yoruba',
  ENG2: 'English',
  HIS: 'History',
  PHI: 'Philosophy',
  PSY: 'Psychology',
  GES: 'Geography',
};

const FACULTY_MAP: Record<string, string> = {
  FSS: 'Faculty of Social Sciences',
  FMS: 'Faculty of Management Sciences',
  FES: 'Faculty of Environmental Sciences',
  FGS: 'Faculty of Graduate Studies',
  FHS: 'Faculty of Health Sciences',
  FLS: 'Faculty of Life Sciences',
  FPS: 'Faculty of Physical Sciences',
  FED: 'Faculty of Education',
  FAW: 'Faculty of Arts',
  FLW: 'Faculty of Law',
  DPP: 'Daily Part-Time Programme',
};

/**
 * Parse an FSS Ibadan matriculation number.
 *
 * Supported formats:
 *   ND FT:  {DEPT}/FSS/IB/{YEAR}/{SERIAL}
 *   ND PT:  DPP/{DEPT}/FSS/IB/{YEAR}/{SERIAL}
 *   HND FT: HND/{DEPT}/FSS/IB/{YEAR}/{SERIAL}
 *   HND PT: DPP/HND/{DEPT}/FSS/IB/{YEAR}/{SERIAL}
 *
 * Also handles shorter forms like:
 *   {DEPT}/{YEAR}/{SERIAL} (e.g. CSC/2024/00123)
 *   {SERIAL} (e.g. 00123)
 */
export function parseMatric(raw: string): ParsedMatric {
  const clean = raw.trim().toUpperCase().replace(/\s+/g, '');
  const result: ParsedMatric = {
    raw,
    isValid: false,
    format: null,
    faculty: null,
    department: null,
    mode: null,
    programmeType: null,
    year: null,
    serial: null,
    serialStr: null,
    confidence: 0,
  };

  if (!clean) return result;

  // Strategy 1: Full format - DPP/HND/DEPT/FSS/IB/YEAR/SERIAL
  const fullPattern = /^(DPP\/)?(HND\/)?([A-Z]{2,4})\/FSS\/IB\/(\d{4})\/(\d{4,6})$/;
  let m = clean.match(fullPattern);
  if (m) {
    result.format = 'full';
    result.faculty = 'FSS';
    result.department = DEPT_MAP[m[3]] ? m[3] : m[3];
    result.mode = m[1] ? 'PT' : 'FT';
    result.programmeType = m[2] ? 'HND' : 'ND';
    result.year = parseInt(m[4]);
    result.serial = parseInt(m[5]);
    result.serialStr = m[5];
    result.isValid = true;
    result.confidence = 1.0;
    return result;
  }

  // Strategy 2: Medium format - DEPT/FSS/IB/YEAR/SERIAL
  const medPattern = /^([A-Z]{2,4})\/FSS\/IB\/(\d{4})\/(\d{4,6})$/;
  m = clean.match(medPattern);
  if (m) {
    result.format = 'medium';
    result.faculty = 'FSS';
    result.department = DEPT_MAP[m[1]] ? m[1] : m[1];
    result.mode = 'FT';
    result.programmeType = 'ND';
    result.year = parseInt(m[2]);
    result.serial = parseInt(m[3]);
    result.serialStr = m[3];
    result.isValid = true;
    result.confidence = 0.95;
    return result;
  }

  // Strategy 3: Short format - DEPT/YEAR/SERIAL
  const shortPattern = /^([A-Z]{2,4})\/(\d{4})\/(\d{4,6})$/;
  m = clean.match(shortPattern);
  if (m) {
    result.format = 'short';
    result.department = DEPT_MAP[m[1]] ? m[1] : m[1];
    result.year = parseInt(m[2]);
    result.serial = parseInt(m[3]);
    result.serialStr = m[3];
    result.isValid = true;
    result.confidence = 0.85;
    return result;
  }

  // Strategy 4: Serial only (e.g. "00123" or "12345")
  if (/^\d{4,6}$/.test(clean)) {
    result.format = 'serial';
    result.serial = parseInt(clean);
    result.serialStr = clean;
    result.isValid = true;
    result.confidence = 0.6;
    return result;
  }

  // Strategy 5: Contains serial in various formats (partial match)
  const serialMatch = clean.match(/(\d{4,6})$/);
  if (serialMatch) {
    result.serial = parseInt(serialMatch[1]);
    result.serialStr = serialMatch[1];
    result.confidence = 0.4;

    // Try to extract dept from the beginning
    const deptMatch = clean.match(/^([A-Z]{2,4})/);
    if (deptMatch && DEPT_MAP[deptMatch[1]]) {
      result.department = deptMatch[1];
      result.confidence = 0.5;
    }

    // Try to extract year
    const yearMatch = clean.match(/(20\d{2})/);
    if (yearMatch) {
      result.year = parseInt(yearMatch[1]);
      result.confidence = 0.55;
    }

    result.isValid = true;
    result.format = 'partial';
    return result;
  }

  return result;
}

/**
 * Extract the last N digits from a matric number (for fuzzy matching)
 */
export function extractSerial(matric: string, digits: number = 5): string | null {
  const parsed = parseMatric(matric);
  if (parsed.serial !== null) {
    return String(parsed.serial).padStart(digits, '0');
  }
  // Fallback: just get the last digits from the raw string
  const clean = matric.replace(/[^0-9]/g, '');
  if (clean.length >= digits) {
    return clean.slice(-digits);
  }
  return clean || null;
}

/**
 * Get matric number variants for fuzzy matching
 */
export function getMatricVariants(matric: string): string[] {
  const variants = new Set<string>();
  const clean = matric.trim().toLowerCase();
  variants.add(clean);

  const parsed = parseMatric(matric);
  if (parsed.serial !== null) {
    // Add serial as a variant
    variants.add(String(parsed.serial));
    variants.add(String(parsed.serial).padStart(5, '0'));
    variants.add(String(parsed.serial).padStart(6, '0'));
  }

  // Add without special characters
  variants.add(clean.replace(/[^a-z0-9]/g, ''));

  // Add uppercase version
  variants.add(clean.toUpperCase());

  return Array.from(variants);
}

/**
 * Infer programme type from serial number range
 * (Serial ranges may vary by institution - this is an example)
 */
export function inferProgrammeTypeFromSerial(serial: number): 'ND' | 'HND' | null {
  if (serial >= 1 && serial <= 9999) return 'ND';
  if (serial >= 10000 && serial <= 19999) return 'HND';
  return null;
}

/**
 * Validate a score against expected range
 */
export function validateScore(score: number | string, totalMarks: number = 100): {
  isValid: boolean;
  warning: string | null;
} {
  const num = typeof score === 'string' ? parseFloat(score) : score;

  if (isNaN(num)) return { isValid: false, warning: 'Score is not a number' };
  if (num < 0) return { isValid: false, warning: 'Score cannot be negative' };
  if (num > totalMarks) return { isValid: false, warning: `Score ${num} exceeds total marks ${totalMarks}` };
  if (num === 0) return { isValid: true, warning: 'Score is zero - is this correct?' };
  if (num > totalMarks * 0.95) return { isValid: true, warning: `Score ${num} is very high (${Math.round(num / totalMarks * 100)}%)` };

  return { isValid: true, warning: null };
}

/**
 * Get department code from name
 */
export function getDeptCode(name: string): string | null {
  const upper = name.toUpperCase();
  for (const [code, fullName] of Object.entries(DEPT_MAP)) {
    if (fullName.toUpperCase() === upper || code === upper) return code;
  }
  return null;
}

export { DEPT_MAP, FACULTY_MAP };
