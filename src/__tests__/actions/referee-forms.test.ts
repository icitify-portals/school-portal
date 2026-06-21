import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    createRefereeInvitationAction,
    getRefereeInvitationAction,
    submitRefereeResponseAction
} from '../../actions/referee-actions';
import { db } from '@/db/db';

vi.mock('@/db/schema', () => ({
  refereeInvitations: { token: 'token' }
}));

describe('Referee Module Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createRefereeInvitationAction', () => {
        it('should successfully create invitation and return token link', async () => {
            (db.insert as any).mockReturnValue({
                values: vi.fn().mockResolvedValue({})
            });

            const result = await createRefereeInvitationAction({
                applicationId: 10,
                applicationType: 'postgraduate',
                refereeName: 'Prof. Helen Troy',
                refereeEmail: 'htroy@uni.edu'
            });

            expect(result.success).toBe(true);
            expect(result.data?.token).toBeDefined();
        });
    });

    describe('getRefereeInvitationAction', () => {
        it('should retrieve invitation details if token is valid and active', async () => {
            const validDate = new Date();
            validDate.setDate(validDate.getDate() - 5); // 5 days ago

            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue([{
                            id: 1,
                            applicationId: 10,
                            applicationType: 'postgraduate',
                            refereeName: 'Prof. Helen Troy',
                            refereeEmail: 'htroy@uni.edu',
                            token: 'valid-token',
                            status: 'pending',
                            invitedAt: validDate
                        }])
                    }))
                }))
            });

            const result = await getRefereeInvitationAction('valid-token');
            expect(result.success).toBe(true);
            expect(result.data?.refereeName).toBe('Prof. Helen Troy');
        });

        it('should fail if token has exceeded the 14-day lifetime limit', async () => {
            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - 15); // 15 days ago

            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue([{
                            id: 1,
                            applicationId: 10,
                            token: 'expired-token',
                            invitedAt: expiredDate
                        }])
                    }))
                }))
            });

            const result = await getRefereeInvitationAction('expired-token');
            expect(result.success).toBe(false);
            expect(result.error).toContain('form link has expired');
        });
    });

    describe('submitRefereeResponseAction', () => {
        it('should save referee appraisal responses and set status to completed', async () => {
            const validDate = new Date();
            (db.select as any).mockReturnValue({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue([{
                            id: 1,
                            token: 'valid-token',
                            invitedAt: validDate
                        }])
                    }))
                }))
            });

            (db.update as any).mockReturnValue({
                set: vi.fn(() => ({
                    where: vi.fn().mockResolvedValue({})
                }))
            });

            const refereeData = {
                relationshipCapacity: 'Academic Advisor',
                relationshipYears: 4,
                recommendationLevel: 'highly_recommend' as const,
                referenceLetter: 'He is an exceptionally talented scholar.',
                ratings: {
                    intellectual_capability: 5,
                    research_potential: 5,
                    writing_capability: 4
                }
            };

            const result = await submitRefereeResponseAction('valid-token', refereeData);
            expect(result.success).toBe(true);
        });
    });
});
