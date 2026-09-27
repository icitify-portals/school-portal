import { db } from "@/db/db";
import { transactions, payment_transactions } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export type AdmissionFeeKind = "acceptance" | "school";

export interface FeeEvidence {
  source: "transactions" | "payment_transactions";
  id: number;
  reference: string | null;
  purpose: string | null;
  amount: string | null;
  gateway: string | null;
  paidAt: Date | null;
  ignoredReason?: string;
}

export interface AdmissionFeeVerification {
  verified: boolean;
  acceptancePaid: boolean;
  schoolFeePaid: boolean;
  acceptanceEvidence: FeeEvidence[];
  schoolFeeEvidence: FeeEvidence[];
  missing: AdmissionFeeKind[];
  selfDeclaredAcceptanceFlag: string | null;
  flagContradicted: boolean;
  staleEvidence: FeeEvidence[];
}

export interface VerifyOptions {
  /**
   * The session the applicant is being admitted into, e.g. "2026/2027".
   * School fees are paid annually through Remita, so a school fee only qualifies
   * the holder for that specific session. Used together with `remitaOnlySchoolFee`.
   */
  sessionName?: string | null;
  /**
   * Reject school fees that did not arrive through Remita. This is the school
   * intake policy: only Remita school fees confer ND 1 / HND 1 standing.
   * The acceptance fee is deliberately exempt, since it is collected separately
   * through ALATPay earlier in the intake.
   */
  remitaOnlySchoolFee?: boolean;
  /**
   * Legacy `payment_transactions` rows carry no session identifier, so a school
   * fee paid for a previous academic year would otherwise satisfy admission into
   * a new session. Pass the earliest date a payment can legitimately count for
   * the session being admitted into (normally the start of that academic year)
   * and anything older is recorded as stale instead of counted.
   */
  notBefore?: Date | null;
}

const REF_PATTERN = /^(ACC|SCH|PROC|FORM)-(\d+)-/i;
const PURPOSE_APP_ID = /Application\s*ID:?\s*(\d+)/i;
const SESSION_TOKEN = /(\d{4}\s*\/\s*\d{4})/;
const REMITA_GATEWAY = /^remita$/i;

/** Normalise "2026 / 2027" and "2026/2027" to a single comparable form. */
export function normaliseSessionName(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = SESSION_TOKEN.exec(value);
  if (!match) return null;
  return match[1].replace(/\s+/g, "");
}

/**
 * Decide whether a piece of school-fee evidence actually confers standing for
 * the session being admitted into. Fails closed.
 *
 *  - the payment must have come through Remita
 *  - the payment must name the session it was made for
 */
export function schoolFeeQualifiesForSession(
  evidence: { gateway: string | null; purpose: string | null; reference: string | null },
  options: { sessionName?: string | null; remitaOnlySchoolFee?: boolean } = {}
): { qualifies: boolean; reason?: string } {
  const { sessionName = null, remitaOnlySchoolFee = false } = options;

  if (remitaOnlySchoolFee && !REMITA_GATEWAY.test((evidence.gateway || "").trim())) {
    return {
      qualifies: false,
      reason: `School fee not paid through Remita (gateway: ${evidence.gateway || "unknown"}).`,
    };
  }

  const wanted = normaliseSessionName(sessionName);
  if (wanted) {
    const seen = normaliseSessionName(`${evidence.purpose || ""} ${evidence.reference || ""}`);
    if (seen !== wanted) {
      return {
        qualifies: false,
        reason: seen
          ? `School fee was paid for session ${seen}, not ${wanted}.`
          : `School fee does not name the ${wanted} session, so it cannot be attributed to it.`,
      };
    }
  }

  return { qualifies: true };
}

/**
 * A legacy payment can only count when we know it was paid for the session being
 * admitted into. With no session column available we fall back to a date floor.
 * Missing dates fail closed.
 */
export function isEvidenceInScope(paidAt: Date | null, notBefore: Date | null): boolean {
  if (!notBefore) return true;
  if (!paidAt) return false;
  return new Date(paidAt).getTime() >= new Date(notBefore).getTime();
}

/**
 * Classify a completed `transactions` row against a specific application.
 * Returns null when the row belongs to a different application or is not a
 * gate fee (processing fees and application form fees do not qualify a student).
 *
 * Fails closed: anything that cannot be bound unambiguously to the application
 * is treated as "not paid".
 */
export function classifyTransactionForApplication(
  tx: { purpose: string | null; gatewayReference: string | null },
  applicationId: number
): AdmissionFeeKind | null {
  const ref = (tx.gatewayReference || "").trim();
  const purpose = (tx.purpose || "").trim();
  const lowerPurpose = purpose.toLowerCase();

  const refMatch = REF_PATTERN.exec(ref);
  if (refMatch) {
    const boundAppId = parseInt(refMatch[2], 10);
    if (boundAppId !== applicationId) return null;
    const prefix = refMatch[1].toUpperCase();
    if (prefix === "ACC") return "acceptance";
    if (prefix === "SCH") return "school";
    return null; // PROC / FORM are not gating fees
  }

  // Newer ALATPay rows use UUID gateway references, so the purpose string is the
  // only binding. The application id must appear as an explicit "Application ID".
  const purposeMatch = PURPOSE_APP_ID.exec(purpose);
  if (!purposeMatch) return null;
  if (parseInt(purposeMatch[1], 10) !== applicationId) return null;

  if (lowerPurpose.includes("acceptance")) return "acceptance";
  if (lowerPurpose.includes("school fee") || lowerPurpose.includes("tuition")) return "school";
  return null;
}

/**
 * Classify a legacy `payment_transactions` row. These are user-scoped rather
 * than application-scoped, so no application id binding is required.
 */
export function classifyLegacyTransactionForUser(
  tx: { transactionType: string | null }
): AdmissionFeeKind | null {
  const type = (tx.transactionType || "").toLowerCase();
  if (type.includes("acceptance")) return "acceptance";
  if (type.includes("school") || type.includes("tuition")) return "school";
  return null;
}

export interface GatewayTxRow {
  id: number;
  purpose: string | null;
  gatewayReference: string | null;
  gatewayTransactionId?: string | null;
  amount?: unknown;
  gateway: string | null;
  createdAt: Date | null;
}

export interface LegacyTxRow {
  id: number;
  transactionType: string | null;
  transactionReference: string | null;
  amount?: unknown;
  paymentGateway: string | null;
  createdAt: Date | null;
}

export interface ApplicationRef {
  id: number;
  applicantId: number | null;
  acceptancePaymentStatus?: string | null;
}

function toAmountString(amount: unknown): string | null {
  return amount === null || amount === undefined ? null : String(amount);
}

/**
 * Pure evaluator: decides admission eligibility from already-loaded payment rows.
 * Kept separate from the database so a whole cohort can be verified with two
 * queries instead of two per applicant, and so the policy is unit-testable.
 */
export function verifyAgainstEvidence(
  application: ApplicationRef,
  gatewayTxs: GatewayTxRow[],
  legacyTxs: LegacyTxRow[],
  options: VerifyOptions = {}
): AdmissionFeeVerification {
  const { notBefore = null, sessionName = null, remitaOnlySchoolFee = false } = options;
  const acceptanceEvidence: FeeEvidence[] = [];
  const schoolFeeEvidence: FeeEvidence[] = [];
  const staleEvidence: FeeEvidence[] = [];

  for (const tx of gatewayTxs) {
    const kind = classifyTransactionForApplication(tx, application.id);
    if (!kind) continue;
    const evidence: FeeEvidence = {
      source: "transactions",
      id: tx.id,
      reference: tx.gatewayReference || tx.gatewayTransactionId || null,
      purpose: tx.purpose,
      amount: toAmountString(tx.amount),
      gateway: tx.gateway || null,
      paidAt: tx.createdAt || null,
    };
    if (kind === "acceptance") {
      acceptanceEvidence.push(evidence);
      continue;
    }

    const schoolCheck = schoolFeeQualifiesForSession(
      { gateway: tx.gateway, purpose: tx.purpose, reference: tx.gatewayReference },
      { sessionName, remitaOnlySchoolFee }
    );
    if (!schoolCheck.qualifies) {
      evidence.ignoredReason = schoolCheck.reason;
      staleEvidence.push(evidence);
      continue;
    }

    schoolFeeEvidence.push(evidence);
  }

  for (const tx of legacyTxs) {
    const kind = classifyLegacyTransactionForUser(tx);
    if (!kind) continue;
    const evidence: FeeEvidence = {
      source: "payment_transactions",
      id: tx.id,
      reference: tx.transactionReference,
      purpose: tx.transactionType,
      amount: toAmountString(tx.amount),
      gateway: tx.paymentGateway || null,
      paidAt: tx.createdAt || null,
    };

    if (!isEvidenceInScope(tx.createdAt || null, notBefore)) {
      evidence.ignoredReason = `Paid ${tx.createdAt ? new Date(tx.createdAt).toISOString().slice(0, 10) : "unknown"} — before ${notBefore?.toISOString().slice(0, 10)}, so it cannot be attributed to the session being admitted into.`;
      staleEvidence.push(evidence);
      continue;
    }

    if (kind === "acceptance") {
      acceptanceEvidence.push(evidence);
      continue;
    }

    // Legacy school fees were collected in the old portal without a gateway and
    // without a session label, so they cannot confer standing for the session
    // being admitted into. Discard them rather than counting them.
    const schoolCheck = schoolFeeQualifiesForSession(
      { gateway: tx.paymentGateway, purpose: tx.transactionType, reference: tx.transactionReference },
      { sessionName, remitaOnlySchoolFee }
    );
    if (!schoolCheck.qualifies) {
      evidence.ignoredReason = schoolCheck.reason;
      staleEvidence.push(evidence);
      continue;
    }

    schoolFeeEvidence.push(evidence);
  }

  const acceptancePaid = acceptanceEvidence.length > 0;
  const schoolFeePaid = schoolFeeEvidence.length > 0;
  const missing: AdmissionFeeKind[] = [];
  if (!acceptancePaid) missing.push("acceptance");
  if (!schoolFeePaid) missing.push("school");

  const selfDeclared = application.acceptancePaymentStatus ?? null;

  return {
    verified: acceptancePaid && schoolFeePaid,
    acceptancePaid,
    schoolFeePaid,
    acceptanceEvidence,
    schoolFeeEvidence,
    missing,
    selfDeclaredAcceptanceFlag: selfDeclared,
    flagContradicted: selfDeclared === "paid" && !acceptancePaid,
    staleEvidence,
  };
}

export async function loadPaymentEvidence(
  applicantIds: number[]
): Promise<{ gatewayTxs: GatewayTxRow[]; legacyByUser: Map<number, LegacyTxRow[]> }> {
  const gatewayTxs = await db
    .select({
      id: transactions.id,
      purpose: transactions.purpose,
      gatewayReference: transactions.gatewayReference,
      gatewayTransactionId: transactions.gatewayTransactionId,
      amount: transactions.amount,
      gateway: transactions.gateway,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(eq(transactions.status, "completed"));

  const legacyByUser = new Map<number, LegacyTxRow[]>();
  if (applicantIds.length === 0) return { gatewayTxs, legacyByUser };

  const legacyTxs = await db
    .select({
      id: payment_transactions.id,
      userId: payment_transactions.userId,
      transactionType: payment_transactions.transactionType,
      transactionReference: payment_transactions.transactionReference,
      amount: payment_transactions.amount,
      paymentGateway: payment_transactions.paymentGateway,
      createdAt: payment_transactions.createdAt,
    })
    .from(payment_transactions)
    .where(
      and(
        inArray(payment_transactions.userId, applicantIds),
        eq(payment_transactions.status, "completed")
      )
    );

  for (const tx of legacyTxs) {
    if (tx.userId === null || tx.userId === undefined) continue;
    const bucket = legacyByUser.get(tx.userId) ?? [];
    bucket.push(tx);
    legacyByUser.set(tx.userId, bucket);
  }

  return { gatewayTxs, legacyByUser };
}

export async function verifyAdmissionFeesForApplication(
  application: ApplicationRef,
  options: VerifyOptions = {}
): Promise<AdmissionFeeVerification> {
  const { gatewayTxs, legacyByUser } = await loadPaymentEvidence(
    application.applicantId ? [application.applicantId] : []
  );
  return verifyAgainstEvidence(
    application,
    gatewayTxs,
    application.applicantId ? legacyByUser.get(application.applicantId) ?? [] : [],
    options
  );
}

const KIND_LABEL: Record<AdmissionFeeKind, string> = {
  acceptance: "acceptance fee",
  school: "school fee",
};

export function describeMissingFees(verification: AdmissionFeeVerification): string {
  if (verification.verified) return "";
  const labels = verification.missing.map((k) => KIND_LABEL[k]);
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
  return `Payment verification failed: no confirmed ${list} payment found. An applicant may only be registered as ND 1 or HND 1 once both the acceptance fee and the school fee are verified against completed payment records.`;
}
