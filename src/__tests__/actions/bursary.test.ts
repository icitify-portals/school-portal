import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStudentFinancialSummary } from '../../actions/bursary';
import { db } from '@/db/db';
import { auth } from '@/auth';

describe('Bursary Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStudentFinancialSummary', () => {
    it('should return empty stats if student not found', async () => {
      (db.select as any).mockReturnValue({
          from: vi.fn(() => ({
              where: vi.fn().mockResolvedValue([])
          }))
      });
      const result = await getStudentFinancialSummary(1);
      expect(result.stats.totalCollections).toBe(0);
      expect(result.transactions).toHaveLength(0);
    });

    it('should calculate balance correctly from invoices and payments', async () => {
      (auth as any).mockResolvedValue({ user: { id: '1', role: 'student' } });
      
      let callCount = 0;
      (db.select as any).mockImplementation(() => {
        const count = callCount++;
        const results = [
          // Query 1: students
          [{ id: 1, walletBalance: "500.00" }],
          // Query 2: studentBills
          [{ id: 10, totalAmount: "1000.00", status: "unpaid" }],
          // Query 3: studentLedger totalPaidRes
          [{ total: "400.00" }]
        ];
        const data = results[count] || [];
        
        const chain: any = {
          where: vi.fn(() => Object.assign(data, chain)),
          orderBy: vi.fn(() => Object.assign(data, chain)),
        };
        
        return {
          from: vi.fn(() => Object.assign(data, chain))
        };
      });

      const result = await getStudentFinancialSummary(1);
      expect(result.success).toBe(true);
      expect(result.walletBalance).toBe(500);
      expect(result.outstandingBalance).toBe(1000);
      expect(result.totalPaid).toBe(400);
    });
  });
});
