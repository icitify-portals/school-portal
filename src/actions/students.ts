"use strict";
"use server";

import { db } from "@/db/db";
import { users, students, programmes, userRoles, roles, courses, enrollments, quizAttempts, quizResponses, quizQuestions, lessonNotes, quizzes } from "@/db/schema";
import { eq, inArray, sql, or, like, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { generateMatricNumber } from "@/actions/matriculation";

export async function getStudents(options: { search?: string, page?: number, pageSize?: number } = {}) {
    try {
        const { search = "", page = 1, pageSize = 10 } = options;
        const offset = (page - 1) * pageSize;

        const searchPattern = `%${search}%`;

        // 1. Get total count
        const [countRes] = await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(search ? or(
                like(users.name, searchPattern),
                like(users.email, searchPattern),
                like(students.matricNumber, searchPattern)
            ) : undefined);
        const totalCount = countRes?.count || 0;

        // 2. Fetch paginated data
        const studentRows = await db.select({
            student: students,
            user: users,
            programme: programmes
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .where(search ? or(
                like(users.name, searchPattern),
                like(users.email, searchPattern),
                like(students.matricNumber, searchPattern)
            ) : undefined)
            .limit(pageSize)
            .offset(offset);

        return {
            success: true,
            data: studentRows.map(r => ({
                ...r.student,
                user: r.user,
                programme: r.programme
            })),
            totalCount
        };
    } catch (error) {
        console.error("Failed to fetch students:", error);
        return { success: false, error: "Failed to fetch students", data: [], totalCount: 0 };
    }
}

export async function approveStudent(userId: number, inputMatricNumber?: string) {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) return { success: false, error: "User not found" };

        const [studentRecord] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);

        let finalMatricNumber = inputMatricNumber?.trim();
        
        if (!finalMatricNumber && studentRecord) {
            // Fetch department and faculty if possible to generate the best number
            let deptId = undefined;
            let facultyId = undefined;
            if (studentRecord.programmeId) {
                const [prog] = await db.select().from(programmes).where(eq(programmes.id, studentRecord.programmeId)).limit(1);
                if (prog) {
                    deptId = prog.departmentId || undefined;
                    if (deptId) {
                        const [dept] = await db.select({ facultyId: sql<number>`faculty_id` }).from(sql`departments`).where(eq(sql`id`, deptId)).limit(1);
                        facultyId = dept?.facultyId;
                    }
                }
            }

            const genRes = await generateMatricNumber({
                year: studentRecord.admissionYear || new Date().getFullYear(),
                deptId: deptId,
                facultyId: facultyId
            });
            if (genRes.success && genRes.matricNumber) {
                finalMatricNumber = genRes.matricNumber;
            }
        }

        const finalMatricToSave = finalMatricNumber || `PENDING-${userId}`;
        const barcode = `${user.name} | ${finalMatricToSave}`;

        await db.update(students)
            .set({ matricNumber: finalMatricToSave, barcode })
            .where(eq(students.userId, userId));

        revalidatePath("/admin/students");
        return { success: true };
    } catch (error) {
        console.error("Failed to approve student:", error);
        return { success: false, error: "Failed to approve student" };
    }
}

export async function bulkImportStudents(data: any[]) {
    try {
        const passwordHash = await bcrypt.hash("welcome123", 10);

        // 1. Get the 'student' role ID
        const studentRole = await db.select().from(roles).where(eq(roles.name, "student")).limit(1);
        const roleId = studentRole[0]?.id;

        await db.transaction(async (tx) => {
            for (const row of data) {
                const { name, email, matricNumber, level, programmeId } = row;
                if (!email || !name) continue;

                // Check if user exists
                const existingUser = await tx.select().from(users).where(eq(users.email, email)).limit(1);
                if (existingUser.length > 0) continue;

                // Create User
                const [newUser] = await tx.insert(users).values({
                    name,
                    email,
                    password: passwordHash,
                    role: 'student'
                });

                // Assign granular role if it exists
                if (roleId) {
                    await tx.insert(userRoles).values({
                        userId: newUser.insertId,
                        roleId: roleId
                    });
                }

                // Determine final level based on Mode of Entry
                const entryMode = row.modeOfEntry?.toString().trim().toUpperCase() === 'DE' ? 'DE' : 'UTME';
                const parsedLevel = parseInt(level);
                let finalLevel = isNaN(parsedLevel) ? 100 : parsedLevel;
                if (entryMode === 'DE' && finalLevel === 100) {
                    finalLevel = 200;
                }

                // Parse Admission Year
                const parsedYear = parseInt(row.admissionYear);
                const finalYear = isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;

                // Create Student Profile
                const barcode = `${name} | ${matricNumber || 'PENDING'}`;
                await tx.insert(students).values({
                    userId: newUser.insertId,
                    matricNumber: matricNumber || null,
                    currentLevel: finalLevel,
                    modeOfEntry: entryMode,
                    admissionYear: finalYear,
                    programmeId: parseInt(programmeId) || null,
                    barcode: barcode
                });
            }
        });

        revalidatePath("/admin/students");
        return { success: true, message: `Successfully processed ${data.length} records.` };
    } catch (error) {
        console.error("Bulk Import Error:", error);
        return { success: false, error: "Failed to process bulk import. Ensure email and matric numbers are unique." };
    }
}

export async function getStudentByUserId(userId: number) {
    try {
        const student = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
        if (!student.length) return null;
        return student[0];
    } catch (error) {
        console.error("Failed to fetch student profile:", error);
        return null;
    }
}
export async function getStudentById(id: number) {
    try {
        const [student] = await db.select().from(students).where(eq(students.id, id));
        if (!student) return null;

        const [user] = await db.select().from(users).where(eq(users.id, student.userId!));
        const [programme] = await db.select().from(programmes).where(eq(programmes.id, student.programmeId!));

        return {
            ...student,
            user,
            programme
        };
    } catch (error) {
        console.error("Failed to fetch student by ID:", error);
        return null;
    }
}

export async function getStudentProfile() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const userId = parseInt(session.user.id);

        let studentRows = await db.select({
            student: students,
            user: users,
            programme: programmes
        })
            .from(students)
            .leftJoin(users, eq(students.userId, users.id))
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .where(eq(students.userId, userId))
            .limit(1);

        // JIT Profile Creation: If no student record exists but user is a student, create one.
        if (studentRows.length === 0) {
            const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            if (user && user.role === 'student') {
                const barcode = `${user.name} | PENDING`;
                await db.insert(students).values({
                    userId: userId,
                    currentLevel: 100,
                    barcode: barcode
                });

                // Re-fetch now that it exists
                studentRows = await db.select({
                    student: students,
                    user: users,
                    programme: programmes
                })
                    .from(students)
                    .leftJoin(users, eq(students.userId, users.id))
                    .leftJoin(programmes, eq(students.programmeId, programmes.id))
                    .where(eq(students.userId, userId))
                    .limit(1);
            }
        }

        if (studentRows.length === 0) return null;

        const studentData = studentRows[0].student;
        const enrollmentsWithCourses = await db.select({
            enrollment: enrollments,
            course: courses
        })
            .from(enrollments)
            .leftJoin(courses, eq(enrollments.courseId, courses.id))
            .where(eq(enrollments.studentId, studentData.id));

        return {
            ...studentData,
            user: studentRows[0].user,
            programme: studentRows[0].programme,
            enrollments: enrollmentsWithCourses.map(e => ({
                ...e.enrollment,
                course: e.course
            }))
        };
    } catch (error) {
        console.error("Failed to fetch current student profile:", error);
        return null;
    }
}

export async function getPersonalizedRecommendations() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, recommendations: [] };

        const userId = parseInt(session.user.id);
        const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
        if (!student) return { success: false, recommendations: [] };

        const { getAIProvider } = await import("@/lib/ai-service");

        // 1. Fetch recent poor performances (Score < 50%)
        const poorAttempts = await db.select({
            attempt: quizAttempts,
            quiz: { title: quizzes.title, id: quizzes.id },
            course: courses
        })
            .from(quizAttempts)
            .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
            .innerJoin(courses, eq(quizzes.courseId, courses.id))
            .where(and(eq(quizAttempts.studentId, student.id), sql`${quizAttempts.score} < 50`))
            .limit(5);

        // 2. Fetch recent lessons for those courses
        const weakCourseIds = [...new Set(poorAttempts.map(p => p.course.id))];
        let recommendedLessons: any[] = [];
        
        if (weakCourseIds.length > 0) {
            recommendedLessons = await db.select()
                .from(lessonNotes)
                .where(and(inArray(lessonNotes.courseId, weakCourseIds), eq(lessonNotes.isPublished, true)))
                .limit(3);
        } else {
            // Default: Most recent published lessons for enrolled courses
            const studentEnrollments = await db.select().from(enrollments).where(eq(enrollments.studentId, student.id));
            const enrolledIds = studentEnrollments.map(e => e.courseId).filter(id => id !== null) as number[];
            
            if (enrolledIds.length > 0) {
                recommendedLessons = await db.select()
                    .from(lessonNotes)
                    .where(and(inArray(lessonNotes.courseId, enrolledIds), eq(lessonNotes.isPublished, true)))
                    .limit(3);
            }
        }

        if (recommendedLessons.length === 0) return { success: true, recommendations: [] };

        // 3. Use AI to generate personalized coaching text
        const provider = getAIProvider(process.env.AI_PROVIDER || 'gemini');
        const lessonTitles = recommendedLessons.map(l => l.title).join(", ");
        
        const prompt = `
        The student is struggling with some topics in their recent quizzes.
        Recommended Lessons: ${lessonTitles}
        
        Generate a very short, encouraging coaching note (max 30 words) for the student dashboard.
        Include a tip on why these lessons will help them improve.
        `;

        const coachingNote = await provider.generateText(prompt);

        return {
            success: true,
            recommendations: recommendedLessons.map(l => ({
                id: l.id,
                title: l.title,
                courseId: l.courseId,
                type: 'lesson',
                reason: 'Topic Mastery'
            })),
            coachingNote
        };

    } catch (error) {
        console.error("Recommendations Error:", error);
        return { success: false, error: "Failed to load recommendations" };
    }
}
