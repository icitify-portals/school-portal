"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { users, students, parentStudentMappings, parents, institutionalUnits, programmes, departments } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getParentChildren() {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'parent') {
            return { error: "Unauthorized" };
        }

        const userId = parseInt(session.user.id!);

        const children = await db.select({
            id: students.id,
            firstName: students.firstName,
            lastName: students.lastName,
            matricNumber: students.matricNumber,
            currentLevel: students.currentLevel,
            unitName: institutionalUnits.name,
            programmeName: programmes.name,
            deptName: departments.name,
            relationship: parentStudentMappings.relationship,
        })
        .from(parentStudentMappings)
        .innerJoin(students, eq(parentStudentMappings.studentId, students.id))
        .leftJoin(institutionalUnits, eq(students.unitId, institutionalUnits.id))
        .leftJoin(programmes, eq(students.programmeId, programmes.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .where(eq(parentStudentMappings.parentId, userId));

        return { success: true, children };
    } catch (error) {
        console.error("Get Parent Children Error:", error);
        return { error: "Failed to fetch children data." };
    }
}

export async function linkChildToParent(matricNumber: string, relationship: 'father' | 'mother' | 'guardian' | 'other') {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'parent') {
            return { error: "Unauthorized" };
        }

        const userId = parseInt(session.user.id!);

        // Find student
        const studentRows = await db.select().from(students).where(eq(students.matricNumber, matricNumber)).limit(1);
        if (studentRows.length === 0) {
            return { error: "Student not found with the provided matric number." };
        }

        const student = studentRows[0];

        // Check if already linked
        const existingMapping = await db.select().from(parentStudentMappings).where(and(
            eq(parentStudentMappings.parentId, userId),
            eq(parentStudentMappings.studentId, student.id)
        )).limit(1);

        if (existingMapping.length > 0) {
            return { error: "This child is already linked to your account." };
        }

        // Link child
        await db.insert(parentStudentMappings).values({
            parentId: userId,
            studentId: student.id,
            relationship,
            isPrimary: true
        });

        revalidatePath("/parent/dashboard");
        return { success: true, message: "Child linked successfully." };
    } catch (error) {
        console.error("Link Child Error:", error);
        return { error: "Failed to link child." };
    }
}

export async function getParentProfile() {
    try {
        const session = await auth();
        if (!session?.user) return { error: "Unauthorized" };

        const userId = parseInt(session.user.id!);
        const profile = await db.select().from(parents).where(eq(parents.userId, userId)).limit(1);
        
        return { success: true, profile: profile[0] || null };
    } catch (error) {
        return { error: "Failed to fetch parent profile." };
    }
}

export async function getChildDetailedData(studentId: number) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'parent') {
            return { error: "Unauthorized" };
        }

        const userId = parseInt(session.user.id!);

        // Verify linkage
        const mapping = await db.select().from(parentStudentMappings).where(and(
            eq(parentStudentMappings.parentId, userId),
            eq(parentStudentMappings.studentId, studentId)
        )).limit(1);

        if (mapping.length === 0) {
            return { error: "You do not have permission to view this child's data." };
        }

        // Fetch student info
        const studentRows = await db.select({
            id: students.id,
            firstName: students.firstName,
            lastName: students.lastName,
            matricNumber: students.matricNumber,
            currentLevel: students.currentLevel,
            unitName: institutionalUnits.name,
            academicTier: institutionalUnits.academicTier,
            programmeName: programmes.name,
            deptName: departments.name,
        })
        .from(students)
        .leftJoin(institutionalUnits, eq(students.unitId, institutionalUnits.id))
        .leftJoin(programmes, eq(students.programmeId, programmes.id))
        .leftJoin(departments, eq(students.deptId, departments.id))
        .where(eq(students.id, studentId))
        .limit(1);

        const student = studentRows[0];

        // Fetch some stats (Mocking for now, as real data depends on other tables)
        const stats = [
            { name: "Attendance Rate", value: "85%", color: "text-green-600", bg: "bg-green-50" },
            { name: "GPA", value: "3.75", color: "text-amber-600", bg: "bg-amber-50" },
            { name: "Outstanding Fees", value: "₦0.00", color: "text-red-600", bg: "bg-red-50" },
            { name: "Active Courses", value: "6", color: "text-blue-600", bg: "bg-blue-50" },
        ];

        return { success: true, student, stats };
    } catch (error) {
        console.error("Get Child Detailed Data Error:", error);
        return { error: "Failed to fetch detailed child data." };
    }
}

export async function getChildActivityTimeline(studentId: number) {
    try {
        const session = await auth();
        if (!session?.user) return [];

        // In a real system, we'd query audit_logs, results, attendance, and transactions.
        // I'll simulate a chronological feed of recent events for this student.
        const events = [
            { id: 1, type: 'academic', title: 'New Result Uploaded', desc: 'Mathematics (First Term) result is now available.', date: new Date(Date.now() - 3600000 * 24) },
            { id: 2, type: 'finance', title: 'Payment Confirmed', desc: 'School fee payment of ₦50,000 received.', date: new Date(Date.now() - 3600000 * 48) },
            { id: 3, type: 'attendance', title: 'Daily Attendance', desc: 'Student checked in at 07:45 AM.', date: new Date(Date.now() - 3600000 * 5) },
            { id: 4, type: 'academic', title: 'Assignment Due', desc: 'Physics assignment submission deadline approaching.', date: new Date(Date.now() + 3600000 * 24) },
        ];

        return events.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
        return [];
    }
}
