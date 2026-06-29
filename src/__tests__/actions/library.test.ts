import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    libraryChat, 
    addLibraryResource, 
    addPhysicalCopy, 
    searchLibrary 
} from '../../actions/library';
import { db } from '@/db/db';

import { getAIProvider } from '@/lib/ai-service';

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('Library Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock the AI provider generateText method
        (getAIProvider as any).mockReturnValue({
            generateText: vi.fn().mockResolvedValue('Mock AI response text for library chat'),
        });

        // Initialize db.query mock properties
        db.query = {
            libraryResources: {
                findMany: vi.fn(),
                findFirst: vi.fn(),
            }
        } as any;
    });

    describe('libraryChat', () => {
        it('should successfully call the AI provider and return a text response', async () => {
            const result = await libraryChat('How do I cite a journal?', [
                { role: 'user', content: 'Hello' },
                { role: 'assistant', content: 'Hi' }
            ]);
            
            expect(result.success).toBe(true);
            expect(result).toHaveProperty('text');
            expect(typeof result.text).toBe('string');
        });

        it('should handle errors and fallback gracefully when AI provider throws an error', async () => {
            (getAIProvider as any).mockReturnValue({
                generateText: vi.fn().mockRejectedValue(new Error('AI provider offline')),
            });

            const result = await libraryChat('How do I cite a journal?', []);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Library AI is currently offline. Please try again later.');
        });
    });

    describe('addLibraryResource', () => {
        it('should successfully insert a resource into the database', async () => {
            const mockInsertValues = vi.fn().mockResolvedValue([{ insertId: 404 }]);
            (db.insert as any).mockReturnValue({
                values: mockInsertValues
            });

            const data = {
                title: 'Introduction to Physics',
                authors: 'Isaac Newton',
                isbn: '978-0123456789',
                category: 'Physics'
            };

            const result = await addLibraryResource(data);
            expect(result.success).toBe(true);
            expect(result.id).toBe(404);
            expect(db.insert).toHaveBeenCalled();
            expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Introduction to Physics'
            }));
        });

        it('should return success false on insertion failure', async () => {
            (db.insert as any).mockImplementation(() => {
                throw new Error('Database integrity constraint violation');
            });

            const result = await addLibraryResource({});
            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to add resource.');
        });
    });

    describe('addPhysicalCopy', () => {
        it('should insert a physical copy and update the parent resource copies count', async () => {
            const mockInsertValues = vi.fn().mockResolvedValue([{}]);
            (db.insert as any).mockReturnValue({
                values: mockInsertValues
            });

            const mockUpdateSet = vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{}])
            });
            (db.update as any).mockReturnValue({
                set: mockUpdateSet
            });

            const result = await addPhysicalCopy(10, 'BARCODE123', 'Shelf A-4');
            expect(result.success).toBe(true);
            expect(db.insert).toHaveBeenCalled();
            expect(db.update).toHaveBeenCalled();
            expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({
                resourceId: 10,
                barcode: 'BARCODE123',
                shelfLocation: 'Shelf A-4'
            }));
        });
    });

    describe('searchLibrary', () => {
        it('should search database and return a list of matching resources', async () => {
            const mockHits = [
                { id: 1, title: 'Learn TypeScript' }
            ];
            
            // @ts-expect-error - TS2540: Auto-suppressed for build
            (db.query as any).libraryResources = {
                findMany: vi.fn().mockResolvedValue(mockHits)
            } as any;

            const result = await searchLibrary('TypeScript');
            expect(result).toEqual(mockHits);
            expect(db.query.libraryResources.findMany).toHaveBeenCalled();
        });

        it('should return empty array on failure', async () => {
            // @ts-expect-error - TS2540: Auto-suppressed for build
            (db.query as any).libraryResources = {
                findMany: vi.fn().mockRejectedValue(new Error('Search timeout'))
            } as any;

            const result = await searchLibrary('Timeout');
            expect(result).toEqual([]);
        });
    });
});
