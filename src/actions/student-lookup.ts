"use server";

import { db } from "@/db/db";
import { students, users, departments, programmes } from "@/db/schema";
import { eq, or, like, notLike, and, sql, isNull, inArray, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";

function maskEmail(email: string | null | undefined): string {
    if (!email || !email.includes('@')) return email || 'Not assigned';
    const [userPart, domain] = email.split('@');
    if (userPart.length <= 2) return `${userPart[0]}***@${domain}`;
    return `${userPart[0]}***${userPart[userPart.length - 1]}@${domain}`;
}

// ========================================================
// HIGH-CONCURRENCY IN-MEMORY QUERY CACHE
// Caches search queries for 60 seconds (handles 200-300 simultaneous users without DB strain)
// ========================================================
interface CacheEntry {
    data: any[];
    timestamp: number;
}
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const MAX_CACHE_SIZE = 1000;

function getCachedResults(key: string): any[] | null {
    const entry = searchCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        searchCache.delete(key);
        return null;
    }
    return entry.data;
}

function setCachedResults(key: string, data: any[]) {
    if (searchCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = searchCache.keys().next().value;
        if (oldestKey) searchCache.delete(oldestKey);
    }
    searchCache.set(key, { data, timestamp: Date.now() });
}

export async function searchPublicStudents(query: string) {
    try {
        const cleanQuery = String(query ?? '').trim();
        if (cleanQuery.length < 3) {
            return {
                success: false,
                error: "Please enter at least 3 characters to search (e.g. part of your name, matric number, or email).",
                data: []
            };
        }

        const cacheKey = cleanQuery.toLowerCase();
        const cached = getCachedResults(cacheKey);
        if (cached) {
            return {
                success: true,
                data: cached,
                totalFound: cached.length,
                fromCache: true
            };
        }

        const pattern = `%${cleanQuery}%`;
        const norm = cleanQuery.toUpperCase().replace(/\s+/g, '');
        const slashNorm = norm.replace(/_/g, '/');
        const underNorm = norm.replace(/\//g, '_');

        // Determine query characteristics for targeted index usage
        const isEmail = cleanQuery.includes('@');
        const isNumericOrCode = /^[0-9A-Za-z\/\-_]+$/.test(cleanQuery) && (/\d/.test(cleanQuery) || cleanQuery.includes('/'));
        const words = cleanQuery.split(/\s+/).filter(w => w.length >= 2);

        let whereClause: any;

        const activeCondition = and(
            isNull(students.deletedAt),
            ne(students.status, 'withdrawn'),
            notLike(students.matricNumber, '%.retired.%'),
            notLike(users.email, 'retired.%')
        );

        if (isEmail) {
            // Fast indexed search on users.email
            whereClause = and(
                activeCondition,
                or(
                    eq(users.email, cleanQuery.toLowerCase()),
                    like(users.email, `${cleanQuery.toLowerCase()}%`)
                )
            );
        } else if (isNumericOrCode) {
            // Fast indexed search on matricNumber and admissionNumber
            whereClause = and(
                activeCondition,
                or(
                    eq(students.matricNumber, norm),
                    eq(students.matricNumber, slashNorm),
                    eq(students.matricNumber, underNorm),
                    eq(students.admissionNumber, cleanQuery),
                    like(students.matricNumber, `${cleanQuery}%`),
                    like(students.matricNumber, pattern),
                    like(students.admissionNumber, pattern)
                )
            );
        } else if (words.length >= 2) {
            // Fast indexed search on first_name and last_name composite
            const w1 = `%${words[0]}%`;
            const w2 = `%${words[1]}%`;
            whereClause = and(
                activeCondition,
                or(
                    and(like(students.firstName, w1), like(students.lastName, w2)),
                    and(like(students.firstName, w2), like(students.lastName, w1)),
                    like(users.name, pattern)
                )
            );
        } else {
            // Single word name or code search using indexed columns
            whereClause = and(
                activeCondition,
                or(
                    like(students.matricNumber, pattern),
                    like(students.admissionNumber, pattern),
                    like(students.lastName, pattern),
                    like(students.firstName, pattern),
                    like(users.name, pattern)
                )
            );
        }

        const rows = await db
            .select({
                studentId: students.id,
                userId: students.userId,
                firstName: students.firstName,
                lastName: students.lastName,
                otherNames: students.otherNames,
                matricNumber: students.matricNumber,
                admissionNumber: students.admissionNumber,
                programmeType: students.programmeType,
                currentLevel: students.currentLevel,
                status: students.status,
                userEmail: users.email,
                userName: users.name,
                deptName: departments.name,
                programmeName: programmes.name,
            })
            .from(students)
            .leftJoin(users, eq(students.userId, users.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .where(whereClause)
            .limit(12);

        const data = rows
            .filter((r) => {
                if (!r.matricNumber || r.matricNumber.includes('.retired.')) return false;
                if (r.status === 'withdrawn') return false;
                if (r.userEmail && r.userEmail.startsWith('retired.')) return false;
                return true;
            })
            .map((r) => {
            const rawEmail = r.userEmail || '';
            const isInstitutional = rawEmail.endsWith('@student.fss.edu.ng');
            const fullName = [r.firstName, r.lastName, r.otherNames].filter(Boolean).join(' ') || r.userName || 'Unnamed Student';

            return {
                studentId: r.studentId,
                userId: r.userId,
                fullName,
                matricNumber: r.matricNumber || 'Pending / Not Assigned',
                admissionNumber: r.admissionNumber,
                department: r.deptName || 'Not Assigned',
                programme: r.programmeName || `${r.programmeType || ''} Level ${r.currentLevel || 1}`,
                programmeType: r.programmeType || 'ND',
                level: r.currentLevel || 1,
                status: r.status || 'active',
                email: rawEmail,
                maskedEmail: maskEmail(rawEmail),
                isInstitutionalEmail: isInstitutional,
            };
        });

        setCachedResults(cacheKey, data);

        return {
            success: true,
            data,
            totalFound: data.length
        };
    } catch (error: any) {
        console.error("Public Student Search Error:", error);
        return {
            success: false,
            error: error?.message || "An error occurred while searching. Please try again.",
            data: []
        };
    }
}

export async function resetPasswordToDefaultAction(studentId: number) {
    try {
        if (!studentId || isNaN(Number(studentId))) {
            return { success: false, error: "Invalid student identifier." };
        }

        const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
        if (!student) {
            return { success: false, error: "Student record not found." };
        }

        const userId = student.userId;
        if (!userId) {
            return { success: false, error: "No user account linked to this student record." };
        }

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) {
            return { success: false, error: "Linked user account could not be found." };
        }

        // Hash default password 'welcome123'
        const defaultPasswordHash = await bcrypt.hash("welcome123", 10);

        // Update the primary user account
        await db.update(users)
            .set({
                password: defaultPasswordHash,
                requiresPasswordChange: true,
                failedLoginAttempts: 0,
                lockoutUntil: null,
            })
            .where(eq(users.id, userId));

        // Unlock student profile
        await db.update(students)
            .set({
                isProfileLocked: false,
            })
            .where(eq(students.id, studentId));

        // Invalidate in-memory cache entries
        searchCache.clear();

        // Also check if student has companion twin accounts and synchronize password
        try {
            const twinConditions = [];
            if (student.admissionNumber) {
                twinConditions.push(eq(students.admissionNumber, student.admissionNumber));
            }
            if (student.firstName && student.lastName) {
                twinConditions.push(
                    and(
                        eq(students.firstName, student.firstName),
                        eq(students.lastName, student.lastName)
                    )
                );
            }

            if (twinConditions.length > 0) {
                const twins = await db.select({ id: students.id, userId: students.userId })
                    .from(students)
                    .where(and(or(...twinConditions), isNull(students.deletedAt)));

                const companionUserIds = twins
                    .map(t => t.userId)
                    .filter((uid): uid is number => !!uid && uid !== userId);

                if (companionUserIds.length > 0) {
                    await db.update(users)
                        .set({
                            password: defaultPasswordHash,
                            requiresPasswordChange: true,
                            failedLoginAttempts: 0,
                            lockoutUntil: null,
                        })
                        .where(inArray(users.id, companionUserIds));
                }
            }
        } catch (syncErr) {
            console.warn("Companion twin sync notice:", syncErr);
        }

        const loginIdentifier = student.matricNumber || user.email;
        const studentDisplayName = [student.firstName, student.lastName].filter(Boolean).join(' ') || user.name || 'Student';

        return {
            success: true,
            studentName: studentDisplayName,
            loginId: loginIdentifier,
            message: `Password has been reset to "welcome123" for ${studentDisplayName}. You will be prompted to set your private password upon login.`
        };
    } catch (error: any) {
        console.error("Default Password Reset Error:", error);
        return {
            success: false,
            error: error?.message || "Failed to reset password. Please try again."
        };
    }
}
