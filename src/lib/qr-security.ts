import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';

// QR Data Schema Validation
export const QRPassSchema = z.object({
  type: z.enum(['library_book', 'visitor_pass', 'student_gate', 'staff_gate', 'transport_pass']),
  entityId: z.number(),
  entityType: z.enum(['user', 'library_resource', 'visitor', 'student']),
  schoolPortalId: z.string().optional(),
  issuedAt: z.number(),
  expiresAt: z.number(),
  issuer: z.string(),
  barcode: z.string().optional(),
  visitorName: z.string().optional(),
  purpose: z.string().optional(),
  destinationType: z.string().optional(),
  destinationName: z.string().optional(),
  expectedCheckIn: z.number().optional(),
  expectedCheckOut: z.number().optional(),
  // Transportation specific fields
  studentId: z.number().optional(),
  routeId: z.number().optional(),
  registrationType: z.string().optional(),
  validFrom: z.number().optional(),
  validTo: z.number().optional(),
});

export type QRPassData = z.infer<typeof QRPassSchema>;

// JWT Secret Key (should be stored in environment variables)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
);

/**
 * Generate a tamper-proof QR pass with JWT signing
 */
export async function generateSecureQRPass(data: Omit<QRPassData, 'issuedAt' | 'expiresAt' | 'issuer'>): Promise<{
  qrData: string;
  expiresAt: Date;
}> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + (24 * 60 * 60); // 24 hours expiration

  const signedData = {
    ...data,
    issuedAt: now,
    expiresAt,
    issuer: 'school-portal-security',
  };

  const jwt = await new SignJWT(signedData)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .sign(JWT_SECRET);

  return {
    qrData: jwt,
    expiresAt: new Date(expiresAt * 1000),
  };
}

/**
 * Verify and decode a QR pass
 */
export async function verifyQRPass(qrData: string): Promise<{
  success: boolean;
  data?: QRPassData;
  error?: string;
}> {
  try {
    const { payload } = await jwtVerify(qrData, JWT_SECRET);
    
    // Validate the payload structure
    const validatedData = QRPassSchema.parse(payload);
    
    // Check if expired
    if (validatedData.expiresAt < Math.floor(Date.now() / 1000)) {
      return {
        success: false,
        error: 'QR pass has expired',
      };
    }

    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    console.error('QR verification error:', error);
    return {
      success: false,
      error: 'Invalid QR pass',
    };
  }
}

/**
 * Generate QR data for library book checkout
 */
export async function generateLibraryBookQR(
  resourceId: number,
  barcode: string,
  patronId: number,
  schoolPortalId: string
) {
  return generateSecureQRPass({
    type: 'library_book',
    entityId: resourceId,
    entityType: 'library_resource',
    schoolPortalId,
    barcode,
  });
}

/**
 * Generate QR data for visitor pass
 */
export async function generateVisitorPassQR(
  visitorId: number,
  visitorName: string,
  purpose: string,
  destinationType?: string,
  destinationName?: string,
  expectedCheckIn?: Date,
  expectedCheckOut?: Date
) {
  return generateSecureQRPass({
    type: 'visitor_pass',
    entityId: visitorId,
    entityType: 'visitor',
    visitorName,
    purpose,
    destinationType,
    destinationName,
    expectedCheckIn: expectedCheckIn ? Math.floor(expectedCheckIn.getTime() / 1000) : undefined,
    expectedCheckOut: expectedCheckOut ? Math.floor(expectedCheckOut.getTime() / 1000) : undefined,
  });
}

/**
 * Generate QR data for transportation pass
 */
export async function generateTransportPassQR(
  studentId: number,
  routeId: number,
  registrationType: string,
  validFrom?: Date,
  validTo?: Date
) {
  return generateSecureQRPass({
    type: 'transport_pass',
    entityId: studentId,
    entityType: 'student',
    studentId,
    routeId,
    registrationType,
    validFrom: validFrom ? Math.floor(validFrom.getTime() / 1000) : undefined,
    validTo: validTo ? Math.floor(validTo.getTime() / 1000) : undefined,
  });
}

/**
 * Generate QR data for student gate pass (Exeat)
 */
export async function generateStudentGateQR(
  studentId: number,
  schoolPortalId: string
) {
  return generateSecureQRPass({
    type: 'student_gate',
    entityId: studentId,
    entityType: 'user',
    schoolPortalId,
  });
}

/**
 * Generate QR data for staff gate pass
 */
export async function generateStaffGateQR(
  staffId: number,
  schoolPortalId: string
) {
  return generateSecureQRPass({
    type: 'staff_gate',
    entityId: staffId,
    entityType: 'user',
    schoolPortalId,
  });
}

/**
 * Nigerian phone number validation
 */
export const NigerianPhoneSchema = z.string().regex(
  /^(?:\+234|0)?[789][01]\d{8}$/,
  'Invalid Nigerian phone number format'
);

/**
 * Nigerian ID validation (simplified)
 */
export const NigerianIDSchema = z.string().min(8).max(20, 'Invalid ID format');

/**
 * Validate Nigerian phone number
 */
export function validateNigerianPhone(phone: string): boolean {
  return NigerianPhoneSchema.safeParse(phone).success;
}

/**
 * Validate Nigerian ID
 */
export function validateNigerianID(id: string): boolean {
  return NigerianIDSchema.safeParse(id).success;
}
