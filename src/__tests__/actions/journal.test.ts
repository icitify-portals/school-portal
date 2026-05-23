import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateArticleDoi, getAllJournals, getJournalBySlug } from '../../actions/journal';
import { db } from '@/db/db';

vi.mock('@/db/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  }
}));

describe('Journal Management System Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllJournals', () => {
    it('should return a list of active journals', async () => {
      const mockJournals = [
        { id: 1, name: 'Journal A', slug: 'journal-a', isActive: true },
        { id: 2, name: 'Journal B', slug: 'journal-b', isActive: true }
      ];

      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue(mockJournals)
        }))
      });

      const result = await getAllJournals();
      expect(result).toEqual(mockJournals);
    });

    it('should handle errors gracefully and return an empty array', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn().mockRejectedValue(new Error('Database error'))
        }))
      });

      const result = await getAllJournals();
      expect(result).toEqual([]);
    });
  });

  describe('getJournalBySlug', () => {
    it('should return a journal matching the given slug', async () => {
      const mockJournal = { id: 1, name: 'Journal A', slug: 'journal-a', isActive: true };

      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([mockJournal])
          }))
        }))
      });

      const result = await getJournalBySlug('journal-a');
      expect(result).toEqual(mockJournal);
    });

    it('should return null if no journal is found or on database failure', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockRejectedValue(new Error('Journal not found'))
          }))
        }))
      });

      const result = await getJournalBySlug('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('generateArticleDoi', () => {
    it('should return failure if article is not found', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([])
          }))
        }))
      });

      const result = await generateArticleDoi(999);
      expect(result).toEqual({ success: false, error: 'Article not found' });
    });

    it('should generate a standard-compliant DOI and save it to the DB', async () => {
      const mockArticle = { id: 3, journalId: 1, issueId: 5, title: 'Test Article' };
      const mockJournal = { id: 1, slug: 'fss-test' };
      const mockIssue = { id: 5, volume: 2, number: 1 };

      // Set up sequential mocks for selecting article, then journal, then issue
      const mockSelect = vi.fn();
      mockSelect
        .mockReturnValueOnce({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([mockArticle])
            }))
          }))
        })
        .mockReturnValueOnce({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([mockJournal])
            }))
          }))
        })
        .mockReturnValueOnce({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([mockIssue])
            }))
          }))
        });

      db.select = mockSelect;

      const mockUpdateSet = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({ success: true })
      });
      db.update = vi.fn().mockReturnValue({
        set: mockUpdateSet
      });

      const result = await generateArticleDoi(3);
      expect(result.success).toBe(true);
      expect(result.doi).toBe('10.5555/fss-test.v2i1.3');
      expect(db.update).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith({ doi: '10.5555/fss-test.v2i1.3' });
    });
  });
});
