import { describe, it, expect } from 'vitest';
import {
    classifyTransactionForApplication,
    classifyLegacyTransactionForUser,
    isEvidenceInScope,
    schoolFeeQualifiesForSession,
    normaliseSessionName,
    verifyAgainstEvidence,
    describeMissingFees
} from '@/services/AdmissionFeeVerificationService';

const tx = (purpose: string | null, gatewayReference: string | null) => ({ purpose, gatewayReference });

describe('classifyTransactionForApplication', () => {
    it('binds ACC- and SCH- reference prefixes to the application', () => {
        expect(classifyTransactionForApplication(tx('Acceptance Fee Payment', 'ACC-99-1789975014189'), 99)).toBe('acceptance');
        expect(classifyTransactionForApplication(tx('2026/2027 Session School Fees', 'SCH-99-1790245503738'), 99)).toBe('school');
    });

    it('ignores reference prefixes belonging to a different application', () => {
        expect(classifyTransactionForApplication(tx('Acceptance Fee Payment', 'ACC-515-1790008684006'), 400)).toBeNull();
        expect(classifyTransactionForApplication(tx('School Fees', 'SCH-111-1790176948421'), 400)).toBeNull();
    });

    it('handles newer ALATPay rows that use UUID gateway references', () => {
        expect(
            classifyTransactionForApplication(
                tx('Acceptance Fee Payment - Application ID: 400', '19bb8aaa-9922-4cd2-8f40-2ea7ff681cbf'),
                400
            )
        ).toBe('acceptance');
    });

    it('does not let one application id prefix-match another', () => {
        // "Application ID: 44" must not be treated as application 4
        expect(
            classifyTransactionForApplication(tx('Acceptance Fee Payment - Application ID: 44', null), 4)
        ).toBeNull();
        expect(
            classifyTransactionForApplication(tx('Acceptance Fee Payment - Application ID: 4', null), 44)
        ).toBeNull();
    });

    it('does not treat processing or form fees as gating fees', () => {
        expect(classifyTransactionForApplication(tx('Processing Fee', 'PROC-111-1790177103530'), 111)).toBeNull();
        expect(classifyTransactionForApplication(tx('Admission Form Application ID: 111', 'PAY-ADM-2026-101091'), 111)).toBeNull();
    });

    it('fails closed when a school fee payment cannot be bound to the application', () => {
        expect(
            classifyTransactionForApplication(tx('2026/2027 Session School Fees & Processing Fee', null), 400)
        ).toBeNull();
        expect(
            classifyTransactionForApplication(tx('2026/2027 Session School Fees & Processing Fee', 'a0b1c2d3-0000-0000-0000-000000000000'), 400)
        ).toBeNull();
    });

    it('recognises tuition as a school fee', () => {
        expect(
            classifyTransactionForApplication(tx('Tuition Payment - Application ID: 12', null), 12)
        ).toBe('school');
    });

    it('returns null for rows with no reference and no application id', () => {
        expect(classifyTransactionForApplication(tx('School Fees', null), 99)).toBeNull();
        expect(classifyTransactionForApplication(tx(null, null), 99)).toBeNull();
    });
});

describe('classifyLegacyTransactionForUser', () => {
    it('classifies the legacy FSS fee types', () => {
        expect(classifyLegacyTransactionForUser({ transactionType: 'Legacy FSS acceptance_fee' })).toBe('acceptance');
        expect(classifyLegacyTransactionForUser({ transactionType: 'Legacy FSS school_fee' })).toBe('school');
    });

    it('ignores unrelated legacy fee types', () => {
        expect(classifyLegacyTransactionForUser({ transactionType: 'Legacy FSS courseform_payment' })).toBeNull();
        expect(classifyLegacyTransactionForUser({ transactionType: 'wallet_topup' })).toBeNull();
        expect(classifyLegacyTransactionForUser({ transactionType: null })).toBeNull();
    });
});

describe('schoolFeeQualifiesForSession', () => {
    const remita = '2026/2027 Session School Fees & Processing Fee';

    it('accepts a remita school fee naming the target session', () => {
        expect(
            schoolFeeQualifiesForSession(
                { gateway: 'remita', purpose: remita, reference: 'SCH-99-abc' },
                { sessionName: '2026/2027', remitaOnlySchoolFee: true }
            ).qualifies
        ).toBe(true);
    });

    it('rejects a school fee that did not go through remita', () => {
        const result = schoolFeeQualifiesForSession(
            { gateway: null, purpose: 'Legacy FSS school_fee', reference: 'LEG-1' },
            { sessionName: '2026/2027', remitaOnlySchoolFee: true }
        );
        expect(result.qualifies).toBe(false);
        expect(result.reason).toMatch(/not paid through Remita/);
    });

    it('rejects a school fee paid for a different session', () => {
        const result = schoolFeeQualifiesForSession(
            { gateway: 'remita', purpose: '2025/2026 Session School Fees', reference: 'SCH-9-x' },
            { sessionName: '2026/2027', remitaOnlySchoolFee: true }
        );
        expect(result.qualifies).toBe(false);
        expect(result.reason).toMatch(/2025\/2026, not 2026\/2027/);
    });

    it('rejects a school fee that does not name any session', () => {
        const result = schoolFeeQualifiesForSession(
            { gateway: 'remita', purpose: 'School Fees', reference: 'SCH-9-x' },
            { sessionName: '2026/2027', remitaOnlySchoolFee: true }
        );
        expect(result.qualifies).toBe(false);
        expect(result.reason).toMatch(/does not name the 2026\/2027 session/);
    });

    it('tolerates spacing differences in the session label', () => {
        expect(normaliseSessionName('2026 / 2027')).toBe('2026/2027');
        expect(normaliseSessionName('Session 2026/2027')).toBe('2026/2027');
        expect(normaliseSessionName('2026/2027')).toBe('2026/2027');
    });
});

describe('isEvidenceInScope', () => {
    const floor = new Date('2026-01-01T00:00:00Z');

    it('accepts any evidence when no floor is supplied', () => {
        expect(isEvidenceInScope(new Date('2024-08-31T00:00:00Z'), null)).toBe(true);
        expect(isEvidenceInScope(null, null)).toBe(true);
    });

    it('rejects legacy payments from a previous academic year', () => {
        expect(isEvidenceInScope(new Date('2025-01-14T08:39:10Z'), floor)).toBe(false);
        expect(isEvidenceInScope(new Date('2025-07-29T13:02:39Z'), floor)).toBe(false);
    });

    it('accepts payments inside the session academic year', () => {
        expect(isEvidenceInScope(new Date('2026-06-29T06:53:10Z'), floor)).toBe(true);
        expect(isEvidenceInScope(new Date('2026-09-24T07:16:54Z'), floor)).toBe(true);
    });

    it('fails closed when the payment date is unknown', () => {
        expect(isEvidenceInScope(null, floor)).toBe(false);
    });
});

describe('verifyAgainstEvidence', () => {
    const opts = { sessionName: '2026/2027', remitaOnlySchoolFee: true, notBefore: new Date('2026-01-01T00:00:00Z') };
    const app = { id: 99, applicantId: 500, acceptancePaymentStatus: 'paid' };
    const acc = (id: number, appId = 99) => ({
        id, purpose: `Acceptance Fee Payment - Application ID: ${appId}`,
        gatewayReference: `ALATPAY-uuid-${id}`, gateway: 'alatpay', amount: '37500.00',
        createdAt: new Date('2026-09-21T07:16:54Z'),
    });
    const sch = (id: number, appId = 99) => ({
        id, purpose: '2026/2027 Session School Fees & Processing Fee',
        gatewayReference: `SCH-${appId}-${id}`, gateway: 'remita', amount: '58500.00',
        createdAt: new Date('2026-09-24T10:25:03Z'),
    });

    it('verifies an applicant with acceptance plus a remita school fee for the session', () => {
        const r = verifyAgainstEvidence(app, [acc(1), sch(2)], [], opts);
        expect(r.verified).toBe(true);
        expect(r.acceptanceEvidence).toHaveLength(1);
        expect(r.schoolFeeEvidence).toHaveLength(1);
        expect(r.missing).toEqual([]);
    });

    it('does not verify on acceptance alone', () => {
        const r = verifyAgainstEvidence(app, [acc(1)], [], opts);
        expect(r.verified).toBe(false);
        expect(r.missing).toEqual(['school']);
    });

    it('does not verify on a remita school fee alone', () => {
        const r = verifyAgainstEvidence(app, [sch(2)], [], opts);
        expect(r.verified).toBe(false);
        expect(r.missing).toEqual(['acceptance']);
    });

    it('does not accept another applicant’s payments', () => {
        const r = verifyAgainstEvidence(app, [acc(1, 126), sch(2, 126)], [], opts);
        expect(r.verified).toBe(false);
        expect(r.acceptancePaid).toBe(false);
        expect(r.schoolFeePaid).toBe(false);
    });

    it('discards a legacy school fee but still counts a legacy acceptance', () => {
        const legacy = [
            { id: 10, transactionType: 'Legacy FSS acceptance_fee', transactionReference: 'L1', paymentGateway: null, amount: '35000', createdAt: new Date('2026-02-02T08:05:04Z') },
            { id: 11, transactionType: 'Legacy FSS school_fee', transactionReference: 'L2', paymentGateway: null, amount: '55000', createdAt: new Date('2026-02-02T08:08:11Z') },
        ];
        const r = verifyAgainstEvidence(app, [], legacy, opts);
        expect(r.acceptancePaid).toBe(true);
        expect(r.schoolFeePaid).toBe(false);
        expect(r.staleEvidence.map(e => e.id)).toEqual([11]);
        expect(r.staleEvidence[0].ignoredReason).toMatch(/not paid through Remita/);
    });

    it('flags a self-declared paid flag that no payment supports', () => {
        const r = verifyAgainstEvidence(app, [], [], opts);
        expect(r.flagContradicted).toBe(true);
        expect(r.selfDeclaredAcceptanceFlag).toBe('paid');
    });

    it('does not flag a contradiction when the flag is not paid', () => {
        const r = verifyAgainstEvidence({ ...app, acceptancePaymentStatus: 'pending' }, [], [], opts);
        expect(r.flagContradicted).toBe(false);
    });

    it('discards a school fee paid for a previous session even on remita', () => {
        const old = [{ ...sch(3), purpose: '2025/2026 Session School Fees & Processing Fee' }];
        const r = verifyAgainstEvidence(app, [acc(1), ...old], [], opts);
        expect(r.schoolFeePaid).toBe(false);
        expect(r.staleEvidence[0].ignoredReason).toMatch(/2025\/2026, not 2026\/2027/);
    });
});

describe('describeMissingFees', () => {
    const base = {
        acceptanceEvidence: [],
        schoolFeeEvidence: [],
        staleEvidence: [],
        selfDeclaredAcceptanceFlag: 'paid',
        flagContradicted: false,
    };

    it('names both fees when neither is verified', () => {
        const msg = describeMissingFees({
            ...base,
            verified: false, acceptancePaid: false, schoolFeePaid: false,
            missing: ['acceptance', 'school'], flagContradicted: true,
        });
        expect(msg).toContain('acceptance fee');
        expect(msg).toContain('school fee');
    });

    it('names only the school fee when acceptance is verified', () => {
        const msg = describeMissingFees({
            ...base,
            verified: false, acceptancePaid: true, schoolFeePaid: false,
            missing: ['school'],
        });
        expect(msg).toContain('no confirmed school fee payment found');
        expect(msg).not.toContain('no confirmed acceptance fee');
    });

    it('returns an empty string once both fees are verified', () => {
        expect(
            describeMissingFees({
                ...base,
                verified: true, acceptancePaid: true, schoolFeePaid: true,
                missing: [],
            })
        ).toBe('');
    });
});
