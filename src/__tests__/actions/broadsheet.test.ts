import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBroadsheetAction } from '../../actions/broadsheet';
import { db } from '@/db/db';
import { auth } from '@/auth';

vi.mock('@/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/services/BroadsheetService', () => ({
    BroadsheetService: {
        compileClassBroadsheet: vi.fn().mockResolvedValue({
            classGroupName: "Group #1",
            sessionName: "2026/2027 Session",
            termName: "First Term",
            subjects: [],
            rows: [],
            statistics: {}
        })
    }
}));

describe('Broadsheet Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fail with unauthorized when session is not available', async () => {
        (auth as any).mockResolvedValue(null);

        const result = await getBroadsheetAction(1, 1, 1);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Unauthorized');
    });

    it('should successfully authorize and load broadsheet data for superadmins', async () => {
        (auth as any).mockResolvedValue({
            user: { id: '1', role: 'superadmin' }
        });

        // Mock database select query responses
        const mockSelect = vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([{ name: '2026/2027 Session' }])
                })
            })
        });
        (db.select as any).mockImplementation(mockSelect);

        const result = await getBroadsheetAction(1, 1, 1);
        expect(result.success).toBe(true);
        expect(result).toHaveProperty('data');
    });

    it('should fail when teacher is not assigned to class group arm', async () => {
        (auth as any).mockResolvedValue({
            user: { id: '15', role: 'staff' }
        });

        // Mock select query to return staff details but empty assignments
        const mockSelect = vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([]) // No staff or class assignment matches
                })
            })
        });
        (db.select as any).mockImplementation(mockSelect);

        const result = await getBroadsheetAction(2, 1, 1);
        expect(result.success).toBe(false);
        expect(result.error).toContain('not authorized');
    });
});
