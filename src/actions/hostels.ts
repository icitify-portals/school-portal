"use server";

import { db } from "@/db/db";
import {
    hostels, hostelBlocks, hostelRooms, hostelApplications,
    hostelSettings, students, users, academicSessions, programmes,
    hostelMaintenanceRequests, hostelInventoryItems, roomInventory
} from "@/db/schema";
import { eq, and, or, sql, desc, count, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Fetch all hostels with summary stats
 */
export async function getHostels() {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const data = await db.select({
            id: hostels.id,
            name: hostels.name,
            code: hostels.code,
            type: hostels.type,
            capacity: hostels.capacity,
            isActive: hostels.isActive,
            roomCount: sql<number>`(SELECT COUNT(*) FROM ${hostelRooms} r JOIN ${hostelBlocks} b ON r.block_id = b.id WHERE b.hostel_id = ${hostels.id})`,
            occupiedCount: sql<number>`(SELECT SUM(occupied_count) FROM ${hostelRooms} r JOIN ${hostelBlocks} b ON r.block_id = b.id WHERE b.hostel_id = ${hostels.id})`,
        })
            .from(hostels);

        return { success: true, data };
    } catch (error) {
        return { success: false, error: "Failed to fetch hostels" };
    }
}

/**
 * Get detailed hostel structure (blocks and rooms)
 */
export async function getHostelStructure(hostelId: number) {
    try {
        const blocks = await db.select().from(hostelBlocks).where(eq(hostelBlocks.hostelId, hostelId));
        const rooms = await db.select({
            id: hostelRooms.id,
            blockId: hostelRooms.blockId,
            roomNumber: hostelRooms.roomNumber,
            capacity: hostelRooms.capacity,
            occupiedCount: hostelRooms.occupiedCount,
            gender: hostelRooms.gender,
            price: hostelRooms.price,
            isAvailable: hostelRooms.isAvailable
        })
            .from(hostelRooms)
            .innerJoin(hostelBlocks, eq(hostelRooms.blockId, hostelBlocks.id))
            .where(eq(hostelBlocks.hostelId, hostelId));

        return { success: true, data: { blocks, rooms } } as { success: true, data: { blocks: any[], rooms: any[] } };
    } catch (error) {
        return { success: false, error: "Failed to fetch structure", data: undefined } as { success: false, error: string, data: undefined };
    }
}

/**
 * Apply for hostel - includes eligibility logic
 */
export async function applyForHostel(hostelId: number) {
    const session = await auth();
    const user = session?.user as any;
    if (!user || user.role !== 'student') return { success: false, error: "Only students can apply" };

    try {
        const [student] = await db.select({
            id: students.id,
            level: students.currentLevel,
            gender: students.gender,
            programmeId: students.programmeId,
        })
            .from(students)
            .where(eq(students.userId, parseInt(user.id)))
            .limit(1);

        if (!student) return { success: false, error: "Student profile not found" };

        const [programme] = await db.select()
            .from(programmes)
            .where(eq(programmes.id, student.programmeId!))
            .limit(1);

        const durationYears = (programme?.durationMonths || 48) / 12;
        const finalYearLevel = durationYears * 100;

        // Freshers (100L) and Final Year get priority
        const isPriority = student.level === 100 || student.level === finalYearLevel;

        const [activeSession] = await db.select()
            .from(academicSessions)
            .where(eq(academicSessions.isCurrent, true)) // Using isCurrent instead of isActive
            .limit(1);

        if (!activeSession) return { success: false, error: "No active academic session" };

        // Check if already applied this session
        const [existing] = await db.select()
            .from(hostelApplications)
            .where(and(
                eq(hostelApplications.studentId, student.id),
                eq(hostelApplications.sessionId, activeSession.id)
            ))
            .limit(1);

        if (existing) return { success: false, error: "You have already applied for this session" };

        await db.insert(hostelApplications).values({
            studentId: student.id,
            sessionId: activeSession.id,
            hostelId,
            isPriority,
            status: 'pending'
        });

        revalidatePath('/student/finance/hostel');
        return { success: true, message: "Application submitted successfully" };
    } catch (error) {
        return { success: false, error: "Application failed" };
    }
}

/**
 * Approve application and set payment deadline
 */
export async function approveHostelApplication(applicationId: number) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const [application] = await db.select({
            id: hostelApplications.id,
            hostelId: hostelApplications.hostelId
        })
            .from(hostelApplications)
            .where(eq(hostelApplications.id, applicationId))
            .limit(1);

        if (!application) return { success: false, error: "Application not found" };

        const [settings] = await db.select()
            .from(hostelSettings)
            .where(eq(hostelSettings.hostelId, application.hostelId!))
            .limit(1);

        const windowDays = settings?.paymentWindowDays || 3;
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + windowDays);

        await db.update(hostelApplications)
            .set({
                status: 'approved',
                paymentDeadline: deadline
            })
            .where(eq(hostelApplications.id, applicationId));

        revalidatePath('/admin/hostels');
        return { success: true, message: "Application approved. Student notified to pay." };
    } catch (error) {
        return { success: false, error: "Approval failed" };
    }
}

/**
 * Allocate Room - Optional Dynamic Logic
 */
export async function allocateStudentToRoom(applicationId: number, roomId: number) {
    try {
        const [room] = await db.select()
            .from(hostelRooms)
            .where(eq(hostelRooms.id, roomId))
            .limit(1);

        if (!room || room.occupiedCount! >= room.capacity!) {
            return { success: false, error: "Room is full or unavailable" };
        }

        await db.transaction(async (tx) => {
            await tx.update(hostelApplications)
                .set({ status: 'allocated', allocatedRoomId: roomId })
                .where(eq(hostelApplications.id, applicationId));

            await tx.update(hostelRooms)
                .set({ occupiedCount: room.occupiedCount! + 1 })
                .where(eq(hostelRooms.id, roomId));
        });

        revalidatePath('/admin/hostels');
        return { success: true, message: "Room allocated successfully" };
    } catch (error) {
        return { success: false, error: "Allocation failed" };
    }
}

/**
 * Dynamic Allocation Logic
 */
export async function dynamicAllocateStudent(applicationId: number) {
    try {
        const [application] = await db.select().from(hostelApplications).where(eq(hostelApplications.id, applicationId)).limit(1);
        if (!application) return { success: false, error: "Application not found" };

        const [student] = await db.select().from(students).where(eq(students.id, application.studentId!)).limit(1);
        if (!student) return { success: false, error: "Student not found" };

        const [room] = await db.select()
            .from(hostelRooms)
            .innerJoin(hostelBlocks, eq(hostelRooms.blockId, hostelBlocks.id))
            .where(and(
                eq(hostelBlocks.hostelId, application.hostelId!),
                eq(hostelRooms.gender, student.gender as any),
                eq(hostelRooms.isAvailable, true),
                sql`${hostelRooms.occupiedCount} < ${hostelRooms.capacity}`
            ))
            .limit(1);

        if (!room) return { success: false, error: "No available rooms found for this gender" };

        return await allocateStudentToRoom(applicationId, room.hostel_rooms.id);
    } catch (error) {
        return { success: false, error: "Dynamic allocation failed" };
    }
}

/**
 * Batch Expiry for Nullification
 */
export async function nullifyExpiredApplications() {
    try {
        const now = new Date();
        await db.update(hostelApplications)
            .set({ status: 'expired' })
            .where(and(
                eq(hostelApplications.status, 'approved'),
                eq(hostelApplications.paymentStatus, 'unpaid'),
                sql`${hostelApplications.paymentDeadline} < ${now}`
            ));

        return { success: true };
    } catch (error) {
        console.error("Nullification failed:", error);
        return { success: false, error: "Nullification failed" };
    }
}

export async function getHostelApplications(hostelId?: number) {
    try {
        await nullifyExpiredApplications();
        let query = db.select({
            id: hostelApplications.id,
            status: hostelApplications.status,
            paymentStatus: hostelApplications.paymentStatus,
            paymentDeadline: hostelApplications.paymentDeadline,
            appliedAt: hostelApplications.appliedAt,
            isPriority: hostelApplications.isPriority,
            student: {
                id: students.id,
                name: users.name,
                matricNumber: students.matricNumber,
                level: students.currentLevel,
                gender: students.gender
            },
            hostel: hostels
        })
            .from(hostelApplications)
            .innerJoin(students, eq(hostelApplications.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .innerJoin(hostels, eq(hostelApplications.hostelId, hostels.id));

        if (hostelId) {
            query = query.where(eq(hostelApplications.hostelId, hostelId)) as any;
        }

        return await query.orderBy(desc(hostelApplications.appliedAt));
    } catch (error) {
        return [];
    }
}

export async function getHostelSettings(hostelId: number) {
    try {
        const [data] = await db.select().from(hostelSettings).where(eq(hostelSettings.hostelId, hostelId)).limit(1);
        return data;
    } catch (error) {
        return null;
    }
}

export async function updateHostelSettings(hostelId: number, values: any) {
    try {
        const existing = await getHostelSettings(hostelId);
        if (existing) {
            await db.update(hostelSettings).set(values).where(eq(hostelSettings.hostelId, hostelId));
        } else {
            await db.insert(hostelSettings).values({ hostelId, ...values });
        }
        revalidatePath('/admin/hostels');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update settings" };
    }
}

/**
 * Maintenance Actions
 */
export async function createMaintenanceRequest(values: {
    title: string,
    description: string,
    category: 'plumbing' | 'electrical' | 'carpentry' | 'masonry' | 'other',
    priority: 'low' | 'medium' | 'high' | 'urgent'
}) {
    const session = await auth();
    const user = session?.user as any;
    if (!user || user.role !== 'student') return { error: "Unauthorized" };

    try {
        const [student] = await db.select({ id: students.id }).from(students).where(eq(students.userId, parseInt(user.id))).limit(1);
        if (!student) return { error: "Student not found" };

        // Get currently allocated room
        const [application] = await db.select({ roomId: hostelApplications.allocatedRoomId })
            .from(hostelApplications)
            .where(and(
                eq(hostelApplications.studentId, student.id),
                eq(hostelApplications.status, 'allocated')
            ))
            .limit(1);

        if (!application?.roomId) return { error: "You are not currently allocated to any room" };

        await db.insert(hostelMaintenanceRequests).values({
            studentId: student.id,
            roomId: application.roomId,
            ...values,
            status: 'pending'
        });

        revalidatePath('/student/finance/hostel');
        return { success: true, message: "Maintenance request submitted successfully" };
    } catch (error) {
        return { error: "Failed to submit request" };
    }
}

export async function getStudentMaintenanceRequests() {
    const session = await auth();
    const user = session?.user as any;
    if (!user) return [];

    try {
        const [student] = await db.select({ id: students.id }).from(students).where(eq(students.userId, parseInt(user.id))).limit(1);
        if (!student) return [];

        const requests = await db.select().from(hostelMaintenanceRequests)
            .where(eq(hostelMaintenanceRequests.studentId, student.id))
            .orderBy(desc(hostelMaintenanceRequests.createdAt));
        
        if (requests.length === 0) return [];

        const roomIds = Array.from(new Set(requests.map(r => r.roomId)));
        const roomsList = await db.select().from(hostelRooms).where(inArray(hostelRooms.id, roomIds));

        return requests.map(r => ({
            ...r,
            room: roomsList.find(room => room.id === r.roomId)
        }));
    } catch (error) {
        return [];
    }
}

export async function getAdminMaintenanceRequests(hostelId?: number) {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const requests = await db.select().from(hostelMaintenanceRequests).orderBy(desc(hostelMaintenanceRequests.createdAt));
        if (requests.length === 0) return [];

        const studentIds = Array.from(new Set(requests.map(r => r.studentId).filter((id): id is number => id !== null)));
        const roomIds = Array.from(new Set(requests.map(r => r.roomId).filter((id): id is number => id !== null)));
        const staffIds = Array.from(new Set(requests.map(r => r.assignedStaffId).filter((id): id is number => id !== null)));

        const [studentsList, roomsList, staffList] = await Promise.all([
            studentIds.length > 0 ? db.select().from(students).where(inArray(students.id, studentIds)) : [],
            roomIds.length > 0 ? db.select().from(hostelRooms).where(inArray(hostelRooms.id, roomIds)) : [],
            staffIds.length > 0 ? db.select().from(users).where(inArray(users.id, staffIds)) : []
        ]);

        const userIds = Array.from(new Set(studentsList.map(s => s.userId).filter((id): id is number => id !== null)));
        const studentUsers = userIds.length > 0 ? await db.select().from(users).where(inArray(users.id, userIds)) : [];

        const blockIds = Array.from(new Set(roomsList.map(r => r.blockId).filter((id): id is number => id !== null)));
        const blocksList = blockIds.length > 0 ? await db.select().from(hostelBlocks).where(inArray(hostelBlocks.id, blockIds)) : [];

        return requests.map(r => {
            const student = studentsList.find(s => s.id === r.studentId);
            const room = roomsList.find(rm => rm.id === r.roomId);
            return {
                ...r,
                student: student ? { ...student, user: studentUsers.find(u => u.id === student.userId) } : null,
                room: room ? { ...room, block: blocksList.find(b => b.id === room.blockId) } : null,
                assignedStaff: staffList.find(u => u.id === r.assignedStaffId)
            };
        });
    } catch (error) {
        return [];
    }
}

export async function updateMaintenanceStatus(id: number, values: {
    status: 'pending' | 'in-progress' | 'resolved' | 'cancelled',
    resolutionNotes?: string,
    assignedStaffId?: number
}) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        const updateData: any = { ...values };
        if (values.status === 'resolved') {
            updateData.resolvedAt = new Date();
        }

        await db.update(hostelMaintenanceRequests)
            .set(updateData)
            .where(eq(hostelMaintenanceRequests.id, id));

        revalidatePath('/admin/hostels');
        return { success: true, message: "Request updated successfully" };
    } catch (error) {
        return { error: "Failed to update request" };
    }
}

/**
 * Inventory Actions
 */
export async function getHostelInventory(hostelId: number) {
    try {
        return await db.select().from(hostelInventoryItems).where(eq(hostelInventoryItems.hostelId, hostelId));
    } catch (error) {
        return [];
    }
}

export async function upsertHostelInventoryItem(values: {
    id?: number,
    hostelId: number,
    name: string,
    description?: string,
    totalQuantity: number
}) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        if (values.id) {
            await db.update(hostelInventoryItems).set(values).where(eq(hostelInventoryItems.id, values.id));
        } else {
            await db.insert(hostelInventoryItems).values(values as any);
        }
        revalidatePath('/admin/hostels');
        return { success: true, message: "Inventory item updated" };
    } catch (error) {
        return { error: "Failed to update inventory" };
    }
}

export async function getRoomInventory(roomId: number) {
    try {
        const records = await db.select().from(roomInventory)
            .where(eq(roomInventory.roomId, roomId))
            .orderBy(desc(roomInventory.updatedAt));
        
        if (records.length === 0) return [];

        const itemIds = Array.from(new Set(records.map(r => r.inventoryItemId)));
        const items = itemIds.length > 0 ? await db.select().from(hostelInventoryItems).where(inArray(hostelInventoryItems.id, itemIds)) : [];

        return records.map(r => ({
            ...r,
            item: items.find(i => i.id === r.inventoryItemId)
        }));
    } catch (error) {
        return [];
    }
}

export async function assignInventoryToRoom(values: {
    roomId: number,
    inventoryItemId: number,
    quantity: number,
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'broken',
    notes?: string
}) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        // Check if item already exists in room
        const [existing] = await db.select()
            .from(roomInventory)
            .where(and(
                eq(roomInventory.roomId, values.roomId),
                eq(roomInventory.inventoryItemId, values.inventoryItemId)
            ))
            .limit(1);

        if (existing) {
            await db.update(roomInventory).set(values).where(eq(roomInventory.id, existing.id));
        } else {
            await db.insert(roomInventory).values(values as any);
        }

        revalidatePath('/admin/hostels');
        return { success: true, message: "Room inventory updated" };
    } catch (error) {
        return { error: "Failed to assign inventory" };
    }
}

export async function deleteRoomInventory(id: number) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        await db.delete(roomInventory).where(eq(roomInventory.id, id));
        revalidatePath('/admin/hostels');
        return { success: true, message: "Item removed from room" };
    } catch (error) {
        return { error: "Failed to remove item" };
    }
}

/**
 * Check-in / Check-out Workflow
 */
export async function checkInApplicant(applicationId: number, notes?: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        await db.update(hostelApplications)
            .set({
                checkedInAt: new Date(),
                checkInNotes: notes
            })
            .where(eq(hostelApplications.id, applicationId));

        revalidatePath('/admin/hostels');
        revalidatePath('/student/finance/hostel');
        return { success: true, message: "Student checked in successfully" };
    } catch (error) {
        return { error: "Failed to check in student" };
    }
}

export async function checkOutApplicant(applicationId: number, notes?: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        // Find application to get room ID
        const [app] = await db.select().from(hostelApplications).where(eq(hostelApplications.id, applicationId)).limit(1);
        if (!app) return { error: "Application not found" };

        await db.transaction(async (tx) => {
            // 1. Update application status
            await tx.update(hostelApplications)
                .set({
                    checkedOutAt: new Date(),
                    checkOutNotes: notes,
                    status: 'expired' // Mark as completed for the session
                })
                .where(eq(hostelApplications.id, applicationId));

            // 2. Decrement room occupancy if it was allocated
            if (app.allocatedRoomId) {
                await tx.update(hostelRooms)
                    .set({
                        occupiedCount: sql`${hostelRooms.occupiedCount} - 1`
                    })
                    .where(eq(hostelRooms.id, app.allocatedRoomId));
            }
        });

        revalidatePath('/admin/hostels');
        revalidatePath('/student/finance/hostel');
        return { success: true, message: "Student checked out successfully" };
    } catch (error) {
        console.error(error);
        return { error: "Failed to check out student" };
    }
}

/**
 * Hostel Clearance & Session Transition
 */
export async function clearHostelAllocations(hostelId: number) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        await db.transaction(async (tx) => {
            // 1. Mark all applications for this hostel as expired
            await tx.update(hostelApplications)
                .set({ status: 'expired' })
                .where(and(
                    eq(hostelApplications.hostelId, hostelId),
                    or(
                        eq(hostelApplications.status, 'approved'),
                        eq(hostelApplications.status, 'allocated')
                    )
                ));

            // 2. Reset all room occupancies for this hostel to 0
            const roomsInHostel = await tx.select({ id: hostelRooms.id })
                .from(hostelRooms)
                .innerJoin(hostelBlocks, eq(hostelRooms.blockId, hostelBlocks.id))
                .where(eq(hostelBlocks.hostelId, hostelId));

            const roomIds = roomsInHostel.map(r => r.id);
            if (roomIds.length > 0) {
                await tx.update(hostelRooms)
                    .set({ occupiedCount: 0 })
                    .where(sql`${hostelRooms.id} IN (${sql.join(roomIds, sql`, `)})`);
            }
        });

        revalidatePath('/admin/hostels');
        return { success: true, message: "Hostel cleared for new session" };
    } catch (error) {
        console.error(error);
        return { error: "Failed to clear hostel" };
    }
}

/**
 * Admin: Create/Update Hostels
 */
export async function createHostel(values: any) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await db.insert(hostels).values(values);
        revalidatePath('/admin/hostels/buildings');
        return { success: true, message: "Hostel created successfully" };
    } catch (error) {
        return { success: false, error: "Failed to create hostel" };
    }
}

export async function updateHostel(id: number, values: any) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await db.update(hostels).set(values).where(eq(hostels.id, id));
        revalidatePath('/admin/hostels/buildings');
        return { success: true, message: "Hostel updated successfully" };
    } catch (error) {
        return { success: false, error: "Failed to update hostel" };
    }
}

/**
 * Admin: Management of Blocks & Rooms
 */
export async function createHostelBlock(values: any) {
    try {
        await db.insert(hostelBlocks).values(values);
        revalidatePath('/admin/hostels/buildings');
        return { success: true, message: "Block added" };
    } catch (error) {
        return { success: false, error: "Failed to add block" };
    }
}

export async function createHostelRoom(values: any) {
    try {
        await db.insert(hostelRooms).values(values);
        // Room creation might affect hostel total capacity depending on how it's calculated
        revalidatePath('/admin/hostels/buildings');
        return { success: true, message: "Room added" };
    } catch (error) {
        return { success: false, error: "Failed to add room" };
    }
}

export async function updateHostelRoom(id: number, values: any) {
    try {
        await db.update(hostelRooms).set(values).where(eq(hostelRooms.id, id));
        revalidatePath('/admin/hostels/buildings');
        return { success: true, message: "Room updated" };
    } catch (error) {
        return { success: false, error: "Failed to update room" };
    }
}

export async function deleteHostelRoom(id: number) {
    try {
        await db.delete(hostelRooms).where(eq(hostelRooms.id, id));
        revalidatePath('/admin/hostels/buildings');
        return { success: true, message: "Room deleted" };
    } catch (error) {
        return { success: false, error: "Failed to delete room" };
    }
}

export async function rejectHostelApplication(applicationId: number) {
    try {
        await db.update(hostelApplications)
            .set({ status: 'rejected' })
            .where(eq(hostelApplications.id, applicationId));
        revalidatePath('/admin/hostels/allocations');
        return { success: true, message: "Application rejected" };
    } catch (error) {
        return { success: false, error: "Operation failed" };
    }
}

export async function getAllMaintenanceRequests() {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const data = await db.select({
            id: hostelMaintenanceRequests.id,
            title: hostelMaintenanceRequests.title,
            description: hostelMaintenanceRequests.description,
            category: hostelMaintenanceRequests.category,
            priority: hostelMaintenanceRequests.priority,
            status: hostelMaintenanceRequests.status,
            createdAt: hostelMaintenanceRequests.createdAt,
            student: {
                name: users.name,
                matricNumber: students.matricNumber
            },
            room: {
                roomNumber: hostelRooms.roomNumber
            }
        })
            .from(hostelMaintenanceRequests)
            .innerJoin(students, eq(hostelMaintenanceRequests.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .innerJoin(hostelRooms, eq(hostelMaintenanceRequests.roomId, hostelRooms.id))
            .orderBy(desc(hostelMaintenanceRequests.createdAt));

        return data;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function updateMaintenanceRequest(id: number, values: any) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await db.update(hostelMaintenanceRequests)
            .set({
                ...values,
                updatedAt: new Date(),
                resolvedAt: values.status === 'resolved' ? new Date() : undefined
            })
            .where(eq(hostelMaintenanceRequests.id, id));

        revalidatePath('/admin/hostels/maintenance');
        return { success: true, message: "Request updated successfully" };
    } catch (error) {
        return { success: false, error: "Failed to update request" };
    }
}




