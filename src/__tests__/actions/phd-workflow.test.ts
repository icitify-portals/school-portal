import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    assignSupervisorsAction,
    submitSupervisorResponseAction,
    verifyCandidacyFeesAction,
    submitThesisReviewAction,
    submitCorrectedThesisAction,
    scheduleDefenseAction,
    confirmGraduationAction
} from '../../actions/phd-actions';
import { db } from '@/db/db';

// Mock Next.js next/cache
vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe('PhD Workflow Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup local mock for transaction
        (db.transaction as any) = vi.fn(async (cb) => await cb(db));
    });

    describe('assignSupervisorsAction', () => {
        it('should successfully assign supervisors and set status to supervisors_pending', async () => {
            (db.delete as any).mockReturnValue({
                where: vi.fn().mockResolvedValue({})
            });
            (db.insert as any).mockReturnValue({
                values: vi.fn().mockResolvedValue([{}])
            });
            (db.update as any).mockReturnValue({
                set: vi.fn(() => ({
                    where: vi.fn().mockResolvedValue({})
                }))
            });

            const supervisors = [
                { type: 'internal' as const, name: 'Dr. John Doe', email: 'jdoe@school.edu' },
                { type: 'external' as const, name: 'Prof. Alice Smith', email: 'asmith@external.edu' }
            ];

            const result = await assignSupervisorsAction(1, supervisors);
            expect(result.success).toBe(true);
        });
    });

    describe('submitSupervisorResponseAction', () => {
        it('should fail if invitation token does not exist', async () => {
            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue([])
                    }))
                }))
            });

            const result = await submitSupervisorResponseAction('invalid-token', true);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid supervisor invitation token');
        });

        it('should throw an error if the 14-day token expiration limit is exceeded', async () => {
            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - 15); // 15 days ago

            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue([{
                            id: 5,
                            phdApplicationId: 1,
                            token: 'expired-token',
                            invitedAt: expiredDate
                        }])
                    }))
                }))
            });

            (db.update as any).mockReturnValue({
                set: vi.fn(() => ({
                    where: vi.fn().mockResolvedValue({})
                }))
            });

            const result = await submitSupervisorResponseAction('expired-token', true);
            expect(result.success).toBe(false);
            expect(result.error).toContain('expired (14-day limit)');
        });
    });

    describe('verifyCandidacyFeesAction', () => {
        it('should successfully clear fees if bills are paid', async () => {
            let callCount = 0;
            (db.select as any).mockImplementation(() => {
                const count = callCount++;
                const responses = [
                    // First query: phdApplication
                    [{ id: 1, studentId: 10, status: 'applied' }],
                    // Second query: studentBill
                    [{ id: 100, studentId: 10, sessionId: 2, status: 'paid', totalAmount: '50000', amountPaid: '50000' }]
                ];
                const res = responses[count] || [];
                return {
                    from: vi.fn(() => ({
                        where: vi.fn(() => ({
                            limit: vi.fn().mockResolvedValue(res)
                        }))
                    }))
                };
            });

            (db.update as any).mockReturnValue({
                set: vi.fn(() => ({
                    where: vi.fn().mockResolvedValue({})
                }))
            });

            const result = await verifyCandidacyFeesAction(1, 2);
            expect(result.success).toBe(true);
        });

        it('should block clearance if current session bill has outstanding balance', async () => {
            let callCount = 0;
            (db.select as any).mockImplementation(() => {
                const count = callCount++;
                const responses = [
                    [{ id: 1, studentId: 10, status: 'applied' }],
                    [{ id: 100, studentId: 10, sessionId: 2, status: 'unpaid', totalAmount: '50000', amountPaid: '20000' }]
                ];
                const res = responses[count] || [];
                return {
                    from: vi.fn(() => ({
                        where: vi.fn(() => ({
                            limit: vi.fn().mockResolvedValue(res)
                        }))
                    }))
                };
            });

            const result = await verifyCandidacyFeesAction(1, 2);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Outstanding current session bills detected');
        });
    });

    describe('submitThesisReviewAction', () => {
        it('should reset thesis status and rollback application status on reject decision', async () => {
            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue([{ id: 10, phdApplicationId: 1, status: 'dept_review' }])
                    }))
                }))
            });

            (db.insert as any).mockReturnValue({
                values: vi.fn().mockResolvedValue([{}])
            });

            (db.update as any).mockReturnValue({
                set: vi.fn(() => ({
                    where: vi.fn().mockResolvedValue({})
                }))
            });

            const result = await submitThesisReviewAction(10, 2, 'department', 'reject', 'Major corrections required.');
            expect(result.success).toBe(true);
            expect(result.data?.message).toContain('State reset to reupload_required');
        });
    });

    describe('submitCorrectedThesisAction', () => {
        it('should throw plagiarism index error if Turnitin score exceeds setting threshold', async () => {
            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue([{ settingKey: 'phd_plagiarism_limit', settingValue: '15' }])
                    }))
                }))
            });

            const result = await submitCorrectedThesisAction(1, 'http://s3.pdf', 'http://s3-turnitin.pdf', 25);
            expect(result.success).toBe(false);
            expect(result.error).toContain('exceeds the maximum allowable threshold');
        });

        it('should save corrected version successfully if Turnitin score is within limit', async () => {
            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue([{ settingKey: 'phd_plagiarism_limit', settingValue: '15' }])
                    }))
                }))
            });

            (db.insert as any).mockReturnValue({
                values: vi.fn().mockResolvedValue([{ insertId: 20 }])
            });

            (db.update as any).mockReturnValue({
                set: vi.fn(() => ({
                    where: vi.fn().mockResolvedValue({})
                }))
            });

            const result = await submitCorrectedThesisAction(1, 'http://s3.pdf', 'http://s3-turnitin.pdf', 10);
            expect(result.success).toBe(true);
        });
    });

    describe('scheduleDefenseAction', () => {
        it('should successfully schedule defense if panel has exactly 3 external and 2 internal examiners', async () => {
            (db.delete as any).mockReturnValue({
                where: vi.fn().mockResolvedValue({})
            });
            (db.insert as any).mockReturnValue({
                values: vi.fn().mockResolvedValue([{}])
            });
            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue([])
                    }))
                }))
            });

            const examiners = [
                { name: 'Ex 1', email: 'ex1@test.com', type: 'external' as const, honorarium: 150000 },
                { name: 'Ex 2', email: 'ex2@test.com', type: 'external' as const, honorarium: 150000 },
                { name: 'Ex 3', email: 'ex3@test.com', type: 'external' as const, honorarium: 150000 },
                { name: 'In 1', email: 'in1@test.com', type: 'internal' as const, honorarium: 80000 },
                { name: 'In 2', email: 'in2@test.com', type: 'internal' as const, honorarium: 80000 },
            ];

            const result = await scheduleDefenseAction(1, new Date(), 'Conference Room A', examiners);
            expect(result.success).toBe(true);
        });

        it('should throw error if panel count constraint is violated', async () => {
            const examiners = [
                { name: 'Ex 1', email: 'ex1@test.com', type: 'external' as const, honorarium: 150000 },
                { name: 'In 1', email: 'in1@test.com', type: 'internal' as const, honorarium: 80000 },
            ];

            const result = await scheduleDefenseAction(1, new Date(), 'Conference Room A', examiners);
            expect(result.success).toBe(false);
            expect(result.error).toContain('exactly 3 External Examiners and 2 Internal Examiners');
        });
    });
});
