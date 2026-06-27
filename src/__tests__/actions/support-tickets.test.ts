import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createSupportTicketAction,
    getTicketWithMessagesAction,
    addMessageAction,
    updateTicketStatusAction
} from '../../actions/support-tickets';
import { db } from '@/db/db';
import { auth } from '@/auth';
import { users, supportTickets, supportTicketMessages, staffProfiles } from '@/db/schema';

describe('Support Tickets Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock database select query routing by table with support for joins
        (db.select as any).mockImplementation(() => {
            const mockValue: any[] = [];
            const chain: any = {
                innerJoin: vi.fn(() => chain),
                leftJoin: vi.fn(() => chain),
                where: vi.fn(() => Object.assign(mockValue, chain)),
                orderBy: vi.fn(() => Object.assign(mockValue, chain)),
                limit: vi.fn().mockResolvedValue(mockValue)
            };

            return {
                from: vi.fn((table) => {
                    let tableMockValue: any[] = [];
                    if (table === users) {
                        tableMockValue = [{ id: 100, role: 'student', name: 'Student User', email: 'mock@school.com' }];
                    } else if (table === supportTickets) {
                        tableMockValue = [{ id: 404, ticketNumber: 'TKT-12345', title: 'Internet issue', userId: 100, status: 'open' }];
                    } else if (table === supportTicketMessages) {
                        tableMockValue = [{ id: 1000, messageText: 'Help me', senderId: 100 }];
                    } else if (table === staffProfiles) {
                        tableMockValue = [{ id: 1, userId: 1, name: 'Support Staff' }];
                    }
                    
                    const tableChain: any = {
                        innerJoin: vi.fn(() => tableChain),
                        leftJoin: vi.fn(() => tableChain),
                        where: vi.fn(() => Object.assign(tableMockValue, tableChain)),
                        orderBy: vi.fn(() => Object.assign(tableMockValue, tableChain)),
                        limit: vi.fn().mockResolvedValue(tableMockValue)
                    };
                    return Object.assign(tableMockValue, tableChain);
                })
            };
        });

        // Mock db.insert to return mysql2 insert headers reliably
        (db.insert as any).mockImplementation(() => {
            return {
                values: vi.fn().mockResolvedValue([{ insertId: 404 }])
            };
        });

        // Mock db.update implementation
        (db.update as any).mockImplementation(() => {
            return {
                set: vi.fn(() => ({
                    where: vi.fn().mockResolvedValue([{ affectedRows: 1 }])
                }))
            };
        });
    });

    describe('createSupportTicketAction', () => {
        it('should successfully create a new ticket and route to IT support queue', async () => {
            (auth as any).mockResolvedValue({ user: { id: '100', email: 'mock@school.com', role: 'student' } });

            const result = await createSupportTicketAction({
                title: 'Internet issue',
                description: 'Wifi is slow in block A',
                category: 'technical',
                priority: 'low'
            });

            expect((result as any).error).toBeUndefined();
            expect(result.success).toBe(true);
            const successRes = result as { ticketId: number; ticketNumber: string };
            expect(successRes.ticketId).toBe(404);
            expect(successRes.ticketNumber).toBeDefined();
        });

        it('should fail if user is not logged in', async () => {
            (auth as any).mockResolvedValue(null);
            
            // Override select to return empty if not logged in
            (db.select as any).mockImplementation(() => ({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue([])
                    }))
                }))
            }));

            const result = await createSupportTicketAction({
                title: 'Issue',
                description: 'Description',
                category: 'technical',
                priority: 'low'
            });
            expect(result.success).toBe(false);
            expect((result as any).error).toBe('Unauthorized: Please log in');
        });
    });

    describe('getTicketWithMessagesAction', () => {
        it('should allow the owner to view their ticket and messages', async () => {
            (auth as any).mockResolvedValue({ user: { id: '100', email: 'mock@school.com', role: 'student' } });

            const result = await getTicketWithMessagesAction(404);
            expect(result.success).toBe(true);
            const successRes = result as { data: any };
            expect(successRes.data.id).toBe(404);
            expect(successRes.data.messages).toHaveLength(1);
        });

        it('should block non-owners without permissions from viewing ticket', async () => {
            (auth as any).mockResolvedValue({ user: { id: '200', email: 'other@school.com', role: 'student' } });

            // Override users select to return the non-owner student
            (db.select as any).mockImplementation(() => {
                return {
                    from: vi.fn((table) => {
                        let mockValue: any[] = [];
                        if (table === users) {
                            mockValue = [{ id: 200, role: 'student', name: 'Other User', email: 'other@school.com' }];
                        } else if (table === supportTickets) {
                            mockValue = [{ id: 404, ticketNumber: 'TKT-12345', title: 'Internet issue', userId: 100, status: 'open' }];
                        }
                        
                        const chain: any = {
                            innerJoin: vi.fn(() => chain),
                            leftJoin: vi.fn(() => chain),
                            where: vi.fn(() => Object.assign(mockValue, chain)),
                            orderBy: vi.fn(() => Object.assign(mockValue, chain)),
                            limit: vi.fn().mockResolvedValue(mockValue)
                        };
                        return Object.assign(mockValue, chain);
                    })
                };
            });

            const result = await getTicketWithMessagesAction(404);
            expect(result.success).toBe(false);
            expect((result as any).error).toContain('Unauthorized');
        });
    });

    describe('addMessageAction', () => {
        it('should allow the ticket owner to append a message reply', async () => {
            (auth as any).mockResolvedValue({ user: { id: '100', email: 'mock@school.com', role: 'student' } });

            const result = await addMessageAction(404, { messageText: 'Still not working' });
            expect((result as any).error).toBeUndefined();
            expect(result.success).toBe(true);
        });
    });

    describe('updateTicketStatusAction', () => {
        it('should update ticket status if user has permission', async () => {
            (auth as any).mockResolvedValue({ user: { id: '1', email: 'admin@school.com', role: 'admin' } });

            // Override users select to return the admin user
            (db.select as any).mockImplementation(() => {
                return {
                    from: vi.fn((table) => {
                        let mockValue: any[] = [];
                        if (table === users) {
                            mockValue = [{ id: 1, role: 'admin', name: 'Admin User', email: 'admin@school.com' }];
                        } else if (table === supportTickets) {
                            mockValue = [{ id: 404, ticketNumber: 'TKT-12345', userId: 100, status: 'open' }];
                        }
                        
                        const chain: any = {
                            innerJoin: vi.fn(() => chain),
                            leftJoin: vi.fn(() => chain),
                            where: vi.fn(() => Object.assign(mockValue, chain)),
                            orderBy: vi.fn(() => Object.assign(mockValue, chain)),
                            limit: vi.fn().mockResolvedValue(mockValue)
                        };
                        return Object.assign(mockValue, chain);
                    })
                };
            });

            const result = await updateTicketStatusAction(404, 'resolved');
            expect((result as any).error).toBeUndefined();
            expect(result.success).toBe(true);
        });
    });
});
