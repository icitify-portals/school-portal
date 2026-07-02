// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateCourseSettings, getCourseContent } from '../../actions/lms';
import { db } from '@/db/db';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

let selectCount = 0;
let mockSelectResults: any[][] = [];

vi.mock('@/db/db', () => ({
  db: {
    select: vi.fn(() => {
      const idx = selectCount++;
      const data = mockSelectResults[idx] || [];
      
      const chain: any = {
        leftJoin: vi.fn(() => Object.assign(data, chain)),
        innerJoin: vi.fn(() => Object.assign(data, chain)),
        where: vi.fn(() => Object.assign(data, chain)),
        orderBy: vi.fn(() => Object.assign(data, chain)),
        limit: vi.fn(() => Object.assign(data, chain)),
      };
      
      return {
        from: vi.fn(() => Object.assign(data, chain))
      };
    }),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => []),
        })),
      })),
    })),
  },
}));

describe('Moodle Course Format & Settings Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCount = 0;
    mockSelectResults = [];
  });

  describe('updateCourseSettings', () => {
    it('should successfully update course format and lock settings', async () => {
      const updateMock = vi.fn().mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => [])
          }))
        }))
      });
      (db.update as any).mockImplementation(updateMock);

      const result = await updateCourseSettings(1, {
        courseFormat: 'weeks',
        courseStartDate: '2026-05-01',
        totalDurationWeeks: 8,
        flowControl: 'sequential',
        minPassingScore: 80
      });

      expect(result.success).toBe(true);
      expect(updateMock).toHaveBeenCalled();
    });
  });

  describe('getCourseContent flow controls', () => {
    it('should correctly fetch and structure Moodle formats and locks', async () => {
      mockSelectResults = [
        // 0: Course Settings
        [{ 
          id: 1, 
          name: 'History', 
          courseFormat: 'days', 
          courseStartDate: '2026-05-24', 
          flowControl: 'sequential', 
          minPassingScore: 80 
        }],
        // 1: Modules
        [{ id: 10, title: 'Day 1 Topic', order: 1, isLocked: false }],
        // 2: Lessons
        [{ id: 100, moduleId: 10, title: 'Day 1 Material', order: 1, contentType: 'text', isPublished: true }],
        // 3: Assignments
        [],
        // 4: Quizzes
        []
      ];

      const result = await getCourseContent(1);

      expect(result.success).toBe(true);
      expect(result.courseFormat).toBe('days');
      expect(result.flowControl).toBe('sequential');
      expect(result.minPassingScore).toBe(80);
      // @ts-expect-error - Auto-suppressed by script
      // @ts-expect-error - Auto-suppressed by script
      // @ts-expect-error - TS18048: Auto-suppressed for build
      expect(result.content![0].lessons[0].title).toBe('Day 1 Material');
    });
  });
});
