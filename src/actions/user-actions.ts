"use strict";
"use server";

import { db } from "@/db/db";
import { users, students, staffProfiles, userRoles, roles, departments, faculties, academicSessions, systemAuditLogs } from "@/db/schema";
import { eq, sql, or, and, like, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

export async function bulkImportUsers(data: any[]) {
    try {
        const passwordHash = await bcrypt.hash("welcome123", 10);

        // Pre-fetch roles for faster lookup
        const allRoles = await db.select().from(roles);

        await db.transaction(async (tx) => {
            for (const row of data) {
                const { name, email, role: roleName, type } = row;
                if (!email || !name) continue;

                // Check if user exists
                const existingUser = await tx.select().from(users).where(eq(users.email, email)).limit(1);
                if (existingUser.length > 0) continue;

                // 1. Create User
                const [newUser] = await tx.insert(users).values({
                    name,
                    email,
                    password: passwordHash,
                    role: (roleName?.toLowerCase() === 'admin' || roleName?.toLowerCase() === 'staff') ? roleName.toLowerCase() : 'student',
                    // SECURITY FIX: Force users to change the default "welcome123" password on first login
                    requiresPasswordChange: true,
                });

                const userId = newUser.insertId;

                // 2. Assign Granular Role
                if (roleName) {
                    const matchedRole = allRoles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
                    if (matchedRole) {
                        await tx.insert(userRoles).values({
                            userId,
                            roleId: matchedRole.id
                        });
                    }
                }

                // 3. Create Profile (Student or Staff)
                if (type?.toLowerCase() === 'student' || (!type && roleName?.toLowerCase() === 'student')) {
                    const barcode = `${name} | PENDING`;
                    await tx.insert(students).values({
                        userId,
                        barcode,
                        currentLevel: parseInt(row.level) || 100,
                    });
                } else if (type?.toLowerCase() === 'staff' || roleName?.toLowerCase() === 'teacher' || roleName?.toLowerCase() === 'manager') {
                    await tx.insert(staffProfiles).values({
                        userId,
                        jobTitle: row.jobTitle || roleName || "Staff",
                    });
                }
            }
        });

        revalidatePath("/admin/rbac");
        revalidatePath("/admin/identity");
        return { success: true, message: `Successfully processed ${data.length} records.` };
    } catch (error) {
        console.error("Bulk Import User Error:", error);
        return { success: false, error: "Failed to process bulk import." };
    }
}

export async function getAllUsers(options: { search?: string, page?: number, pageSize?: number, facultyId?: number, deptId?: number, level?: number, exportMode?: boolean } = {}) {
    try {
        const { search = "", page = 1, pageSize = 10, facultyId, deptId, level, exportMode } = options;
        const offset = (page - 1) * pageSize;

        const searchPattern = `%${search}%`;
        
        const conditions = [];
        if (search) {
            conditions.push(or(like(users.name, searchPattern), like(users.email, searchPattern)));
        }
        if (facultyId) {
            conditions.push(eq(faculties.id, facultyId));
        }
        if (deptId) {
            conditions.push(eq(departments.id, deptId));
        }
        if (level) {
            conditions.push(eq(students.currentLevel, level));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // 1. Get total count
        const [countRes] = await db.select({ count: sql<number>`count(*)` })
            .from(users)
            .leftJoin(students, eq(users.id, students.userId))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .leftJoin(faculties, eq(departments.facultyId, faculties.id))
            .where(whereClause);
        const totalCount = countRes?.count || 0;

        // 2. Fetch paginated data
        let query = db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            status: users.status,
            createdAt: users.createdAt,
            level: students.currentLevel,
            department: departments.name,
            faculty: faculties.name,
            session: academicSessions.name,
        }).from(users)
            .leftJoin(students, eq(users.id, students.userId))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .leftJoin(faculties, eq(departments.facultyId, faculties.id))
            .leftJoin(academicSessions, eq(students.admissionSessionId, academicSessions.id))
            .where(whereClause)
            .orderBy(desc(users.id))
            .$dynamic();
            
        if (!exportMode) {
            query = query.limit(pageSize).offset(offset);
        }
        
        const data = await query;

        return {
            success: true,
            data,
            totalCount
        };
    } catch (error) {
        console.error("Failed to fetch all users:", error);
        return { success: false, error: "Failed to fetch users", data: [], totalCount: 0 };
    }
}

export async function resetUserPassword(userId: number, newPassword?: string) {
    try {
        const session = await auth();
        const actorRole = (session?.user as any)?.role?.toLowerCase() || "";
        const actorId = session?.user?.id ? parseInt(session.user.id) : null;
        if (!['superadmin', 'admin', 'dvc', 'bursar', 'registrar'].includes(actorRole)) {
            return { success: false, error: "Unauthorized: Only superadmin, vice chancellor, bursar, and registrar can edit." };
        }

        const passwordToSet = newPassword || "welcome123";
        const passwordHash = await bcrypt.hash(passwordToSet, 10);

        await db.update(users).set({
            password: passwordHash
        }).where(eq(users.id, userId));

        if (actorId) {
            await db.insert(systemAuditLogs).values({
                actorId,
                action: 'RESET_PASSWORD',
                targetId: userId.toString(),
                details: JSON.stringify({ userId, timestamp: new Date() }),
                status: 'success'
            });
        }

        revalidatePath("/admin/users");
        // SECURITY FIX M-2: Never include the password value in a server action response.
        // The password is never returned to the client — callers receive a generic acknowledgment.
        return { success: true, message: "Password has been reset. The user will be prompted to change it on next login." };
    } catch (error) {
        console.error("Reset Password Error:", error);
        return { success: false, error: "Failed to reset password." };
    }
}

export async function updateUserStatus(userId: number, status: 'active' | 'suspended') {
    try {
        const session = await auth();
        const actorRole = (session?.user as any)?.role?.toLowerCase() || "";
        const actorId = session?.user?.id ? parseInt(session.user.id) : null;
        if (!['superadmin', 'admin', 'dvc', 'bursar', 'registrar'].includes(actorRole)) {
            return { success: false, error: "Unauthorized: Only superadmin, vice chancellor, bursar, and registrar can edit." };
        }

        await db.update(users).set({
            status
        }).where(eq(users.id, userId));

        if (actorId) {
            await db.insert(systemAuditLogs).values({
                actorId,
                action: 'UPDATE_USER_STATUS',
                targetId: userId.toString(),
                details: JSON.stringify({ userId, status, timestamp: new Date() }),
                status: 'success'
            });
        }

        revalidatePath("/admin/users");
        revalidatePath("/admin/students");
        revalidatePath("/admin/hr");
        return { success: true, message: `User status updated to ${status}.` };
    } catch (error) {
        console.error("Update User Status Error:", error);
        return { success: false, error: "Failed to update user status." };
    }
}
