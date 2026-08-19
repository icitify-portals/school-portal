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
                        currentLevel: parseInt(row.level) || 1,
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

export async function getAllUsers(options: { search?: string, page?: number, pageSize?: number, facultyId?: number, deptId?: number, userType?: string, exportMode?: boolean } = {}) {
    try {
        const { search = "", page = 1, pageSize = 10, facultyId, deptId, userType, exportMode } = options;
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
        if (userType) {
            switch (userType) {
                case "Applicant":
                    conditions.push(eq(users.role, 'applicant'));
                    break;
                case "ND_1":
                    conditions.push(and(eq(students.programmeType, 'ND'), eq(students.currentLevel, 1)));
                    break;
                case "ND_2":
                    conditions.push(and(eq(students.programmeType, 'ND'), eq(students.currentLevel, 2)));
                    break;
                case "ND_GRADUATED":
                    conditions.push(eq(students.status, 'nd_graduated'));
                    break;
                case "HND_1":
                    conditions.push(and(eq(students.programmeType, 'HND'), eq(students.currentLevel, 1)));
                    break;
                case "HND_2":
                    conditions.push(and(eq(students.programmeType, 'HND'), eq(students.currentLevel, 2)));
                    break;
                case "HND_GRADUATED":
                    conditions.push(eq(students.status, 'hnd_graduated'));
                    break;
            }
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
        if (!['superadmin', 'icitify_dev', 'admin', 'dvc', 'bursar', 'registrar', 'admission_officer', 'hod', 'dean'].includes(actorRole)) {
            return { success: false, error: "Unauthorized access to reset password." };
        }

        const passwordToSet = newPassword || "welcome123";
        const passwordHash = await bcrypt.hash(passwordToSet, 10);

        await db.update(users).set({
            password: passwordHash,
            requiresPasswordChange: false,
            failedLoginAttempts: 0,
            lockoutUntil: null
        }).where(eq(users.id, userId));

        if (actorId) {
            await db.insert(systemAuditLogs).values({
                actorId,
                action: 'RESET_PASSWORD',
                targetId: userId.toString(),
                details: JSON.stringify({ userId, actorRole, timestamp: new Date() }),
                status: 'success'
            });
        }

        revalidatePath("/admin/users");
        revalidatePath("/admin/students");
        revalidatePath("/admin/hr");
        // SECURITY FIX M-2: Never include the password value in a server action response.
        // The password is never returned to the client — callers receive a generic acknowledgment.
        return { success: true, message: "Password has been reset successfully." };
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
        if (!['superadmin', 'icitify_dev', 'admin', 'dvc', 'bursar', 'registrar', 'admission_officer', 'hod', 'dean'].includes(actorRole)) {
            return { success: false, error: "Unauthorized access to update user status." };
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

export async function verifyUserEmailManually(userId: number) {
    try {
        const session = await auth();
        const actorId = session?.user?.id ? parseInt(session.user.id) : null;
        const actorRole = (session?.user as any)?.role?.toLowerCase() || "";
        if (!actorId || !['superadmin', 'icitify_dev', 'admin', 'dvc', 'bursar', 'registrar', 'admission_officer', 'hod', 'dean'].includes(actorRole)) {
            return { success: false, error: "Unauthorized access for email verification" };
        }
        
        await db.update(users).set({
            emailVerified: true
        }).where(eq(users.id, userId));
        
        if (actorId) {
            await db.insert(systemAuditLogs).values({
                actorId,
                action: 'MANUAL_EMAIL_VERIFICATION',
                targetId: userId.toString(),
                details: JSON.stringify({ userId, actorRole, timestamp: new Date() }),
                status: 'success'
            });
        }
        
        revalidatePath("/admin/users");
        revalidatePath("/admin/students");
        revalidatePath("/admin/admission/v2");
        return { success: true, message: "Email verified successfully." };
    } catch (error) {
        console.error("Manual Email Verification Error:", error);
        return { success: false, error: "Failed to verify email manually." };
    }
}

export async function updateUserBaseRole(userId: number, role: 'applicant' | 'student' | 'staff' | 'admin') {
    try {
        const session = await auth();
        const actorRole = (session?.user as any)?.role?.toLowerCase() || "";
        const actorId = session?.user?.id ? parseInt(session.user.id) : null;
        if (!['superadmin', 'icitify_dev', 'admin', 'dvc', 'bursar', 'registrar', 'admission_officer'].includes(actorRole)) {
            return { success: false, error: "Unauthorized: You do not have permission to change user roles." };
        }

        await db.update(users).set({
            role
        }).where(eq(users.id, userId));

        if (actorId) {
            await db.insert(systemAuditLogs).values({
                actorId,
                action: 'UPDATE_USER_BASE_ROLE',
                targetId: userId.toString(),
                details: JSON.stringify({ userId, role, timestamp: new Date() }),
                status: 'success'
            });
        }

        revalidatePath("/admin/users");
        revalidatePath("/admin/students");
        return { success: true, message: `User role successfully updated to ${role}.` };
    } catch (error) {
        console.error("Update User Role Error:", error);
        return { success: false, error: "Failed to update user role." };
    }
}

export async function createSingleUser(data: { name: string; email: string; role: 'applicant' | 'student' | 'staff' | 'admin' }) {
    try {
        const session = await auth();
        const actorRole = (session?.user as any)?.role?.toLowerCase() || "";
        const actorId = session?.user?.id ? parseInt(session.user.id) : null;
        if (!['superadmin', 'icitify_dev', 'admin', 'dvc', 'bursar', 'registrar', 'admission_officer'].includes(actorRole)) {
            return { success: false, error: "Unauthorized: You do not have permission to create users." };
        }

        const passwordHash = await bcrypt.hash("welcome123", 10);
        
        const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
        if (existing.length > 0) {
            return { success: false, error: "A user with this email already exists." };
        }

        const [newUser] = await db.insert(users).values({
            name: data.name,
            email: data.email,
            password: passwordHash,
            role: data.role,
            requiresPasswordChange: true,
            emailVerified: true
        });

        const userId = newUser.insertId;

        if (data.role === 'student') {
            await db.insert(students).values({
                userId,
                barcode: `${data.name} | PENDING`,
                currentLevel: 1,
            });
        } else if (data.role === 'staff') {
            await db.insert(staffProfiles).values({
                userId,
                jobTitle: "Staff",
            });
        }

        if (actorId) {
            await db.insert(systemAuditLogs).values({
                actorId,
                action: 'CREATE_USER',
                targetId: userId.toString(),
                details: JSON.stringify({ userId, role: data.role, timestamp: new Date() }),
                status: 'success'
            });
        }

        revalidatePath("/admin/users");
        return { success: true, message: "User created successfully! Default password is: welcome123" };
    } catch (error) {
        console.error("Create User Error:", error);
        return { success: false, error: "Failed to create user." };
    }
}

