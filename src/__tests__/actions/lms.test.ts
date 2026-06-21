import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCourseContent, updateProgress, updateLessonSettings } from '../../actions/lms';
import { db } from '@/db/db';
import { auth } from '@/auth';

// Mock next/cache to avoid Next.js static generation store Invariant error during tests
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

let selectCount = 0;
let mockSelectResults: any[][] = [];

// Robust mock for drizzle db that mirrors method chains (leftJoin, innerJoin, where, orderBy, etc.)
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
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => []),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => []),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => []),
    })),
  },
}));

describe('LMS Upgraded Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCount = 0;
    mockSelectResults = [];
  });

  describe('getCourseContent', () => {
    it('should return default course parameters and section contents', async () => {
      // Configure mock query answers sequentially
      mockSelectResults = [
        // 0: Course settings
        [{ id: 1, name: 'Moodle 101', courseFormat: 'weeks', flowControl: 'sequential', minPassingScore: 75 }],
        // 1: Modules
        [{ id: 10, title: 'Introduction to Moodle', order: 1 }],
        // 2: Lessons
        [{ id: 100, moduleId: 10, title: 'Lesson 1', order: 1, contentType: 'text', isPublished: true }],
        // 3: Assignments
        [],
        // 4: Quizzes
        []
      ];

      const result = await getCourseContent(1);
      
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('courseFormat', 'weeks');
      expect(result).toHaveProperty('flowControl', 'sequential');
      expect(result).toHaveProperty('minPassingScore', 75);
      expect(result.content).toBeDefined();
    });

    it('should enforce future scheduled release date lockouts', async () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      // Configure mock query answers sequentially
      mockSelectResults = [
        // 0: Course settings
        [{ id: 1, name: 'Physics' }],
        // 1: Modules
        [{ id: 10, title: 'Mod 1', order: 1 }],
        // 2: Lessons
        [{ id: 100, moduleId: 10, title: 'Scheduled Lesson', order: 1, contentType: 'text', releaseDate: futureDate, isPublished: true }],
        // 3: Assignments
        [],
        // 4: Quizzes
        []
      ];

      const result = await getCourseContent(1);

      expect(result.success).toBe(true);
      const lesson = result.content[0].lessons[0];
      // Lock must be active due to future release date
      expect(lesson.isLocked).toBe(true);
    });

    it('should completely hide unpublished draft lessons from student views', async () => {
      // Configure mock query answers sequentially
      mockSelectResults = [
        // 0: Course settings
        [{ id: 1, name: 'Chemistry' }],
        // 1: Modules
        [{ id: 10, title: 'Mod 1', order: 1 }],
        // 2: Lessons (one published, one unpublished draft)
        [
          { id: 100, moduleId: 10, title: 'Published Lesson', order: 1, contentType: 'text', isPublished: true },
          { id: 101, moduleId: 10, title: 'Draft Lesson', order: 2, contentType: 'text', isPublished: false }
        ],
        // 3: Assignments
        [],
        // 4: Quizzes
        [],
        // 5: Student Progress
        [],
        // 6: Submissions
        []
      ];

      // Query content WITH studentId (student context)
      const result = await getCourseContent(1, 99);

      expect(result.success).toBe(true);
      const lessonsList = result.content[0].lessons;
      // Draft lesson must be completely filtered out for students
      expect(lessonsList).toHaveLength(1);
      expect(lessonsList[0].title).toBe('Published Lesson');
    });
  });

  describe('updateLessonSettings', () => {
    it('should successfully save prerequisites and publishing schedule', async () => {
      const updateMock = vi.fn().mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => [])
          }))
        }))
      });
      (db.update as any).mockImplementation(updateMock);

      const release = new Date();
      const result = await updateLessonSettings(100, 1, {
        prerequisiteLessonId: 99,
        releaseDate: release,
        isPublished: false
      });

      expect(result.success).toBe(true);
      expect(updateMock).toHaveBeenCalled();
    });
  });
});
