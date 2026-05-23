"use server";

import { db } from "@/db/db";
import { 
    institutionalUnits, studentGroups, students, users, 
    courses, enrollments, results, academicSessions,
    gradingSystems, gradePoints, gradingSystemAssignments
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { RankingService } from "@/services/RankingService";

export async function seedResultsDemo() {
    try {
        console.log("Starting Ultra-Resilient Results Seeding...");

        // 1. Setup Academic Session
        let [session] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
        if (!session) {
             const [res] = await db.insert(academicSessions).values({
                 name: "2024/2025",
                 isCurrent: true,
                 startDate: new Date(),
                 endDate: new Date(Date.now() + 31536000000)
             });
             session = { id: res.insertId, name: "2024/2025", isCurrent: true } as any;
        }

        // 2. K-12 Institution Setup
        let unitId: number;
        const [existingUnit] = await db.select().from(institutionalUnits).where(eq(institutionalUnits.code, "GPS")).limit(1);
        if (existingUnit) {
            unitId = existingUnit.id;
        } else {
            const [unitRes] = await db.insert(institutionalUnits).values({
                name: "Greenwood Preparatory School",
                code: "GPS",
                slug: "greenwood-prep-" + Date.now(),
                academicTier: "k12",
                settings: JSON.stringify({ caWeight: 40, examWeight: 60 })
            });
            unitId = unitRes.insertId;
        }

        // 3. Class Arms
        const getOrCreateGroup = async (name: string, level: number) => {
            const [existing] = await db.select().from(studentGroups).where(and(eq(studentGroups.unitId, unitId), eq(studentGroups.name, name))).limit(1);
            if (existing) return existing.id;
            const [res] = await db.insert(studentGroups).values({ unitId, name, level });
            return res.insertId;
        };
        const armAId = await getOrCreateGroup("Primary 1A", 1);
        const armBId = await getOrCreateGroup("Primary 1B", 1);

        // 4. Subjects
        const getOrCreateCourse = async (name: string, code: string) => {
            const [existing] = await db.select().from(courses).where(eq(courses.code, code)).limit(1);
            if (existing) return existing.id;
            const [res] = await db.insert(courses).values({ name, code, creditUnits: 3 });
            return res.insertId;
        };
        const mathId = await getOrCreateCourse("Mathematics", "MAT101");
        const engId = await getOrCreateCourse("English Language", "ENG101");

        // 5. Create Students
        const hashedPassword = await bcrypt.hash("Password123!", 10);
        const createStudent = async (name: string, email: string, groupId: number) => {
            let userId: number;
            const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
            if (existingUser) {
                userId = existingUser.id;
            } else {
                const [uRes] = await db.insert(users).values({ name, email, password: hashedPassword, role: 'student' });
                userId = uRes.insertId;
            }

            const [existingStudent] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
            if (existingStudent) {
                return { id: existingStudent.id, name };
            }

            const mat = `STU-${Math.floor(Math.random() * 10000)}`;
            const [sRes] = await db.insert(students).values({
                userId, firstName: name.split(' ')[0], lastName: name.split(' ')[1],
                unitId, groupId, currentLevel: 1, matricNumber: mat, admissionYear: 2024
            });
            return { id: sRes.insertId, name };
        };

        const students_list = [
            await createStudent("Alice Johnson", "alice@test.com", armAId),
            await createStudent("Bob Smith", "bob@test.com", armAId),
            await createStudent("Charlie Brown", "charlie@test.com", armBId)
        ];

        // 6. Termly Results
        const terms = [1, 2, 3];
        const courses_list = [mathId, engId];

        for (const term of terms) {
            console.log(`Seeding Term ${term}...`);
            for (const stu of students_list) {
                for (const cid of courses_list) {
                    const [existingEnr] = await db.select().from(enrollments).where(and(
                        eq(enrollments.studentId, stu.id),
                        eq(enrollments.courseId, cid),
                        eq(enrollments.semester, term)
                    )).limit(1);
                    
                    let eid: number;
                    if (existingEnr) {
                        eid = existingEnr.id;
                    } else {
                        const [enrRes] = await db.insert(enrollments).values({
                            studentId: stu.id, courseId: cid, 
                            academicYear: session!.name, semester: term,
                            sessionId: session!.id
                        });
                        eid = enrRes.insertId;
                    }

                    const [existingRes] = await db.select().from(results).where(eq(results.enrollmentId, eid)).limit(1);
                    if (!existingRes) {
                        let ca = 0, exam = 0;
                        if (stu.name.includes("Alice")) { ca = 35; exam = 55; }
                        else if (stu.name.includes("Bob")) { ca = 30; exam = 45; }
                        else { ca = 32; exam = 48; }

                        await db.insert(results).values({
                            enrollmentId: eid, caScore: ca.toString(), examScore: exam.toString(), 
                            totalScore: (ca + exam).toString(), isApproved: true, grade: 'A'
                        });
                    }
                }
            }
            for (const cid of courses_list) {
                await RankingService.calculateSubjectRankings(cid, session!.id, term);
            }
        }

        await RankingService.processAnnualResults(session!.id, 1);

        // 7. Dynamic Scale (Tertiary)
        const [existingScale] = await db.select().from(gradingSystems).where(eq(gradingSystems.name, "5.0 Scale Builder")).limit(1);
        if (!existingScale) {
            const [scaleRes] = await db.insert(gradingSystems).values({
                name: "5.0 Scale Builder", scale: 5, description: "Dynamic Engineering Scale", isDefault: false
            });
            const scaleId = scaleRes.insertId;
            const points = [
                { letterGrade: 'A', minMark: 70, maxMark: 100, points: 5.0 },
                { letterGrade: 'B', minMark: 60, maxMark: 69, points: 4.0 },
                { letterGrade: 'C', minMark: 50, maxMark: 59, points: 3.0 },
                { letterGrade: 'F', minMark: 0, maxMark: 49, points: 0.0 },
            ];
            for (const p of points) {
                await db.insert(gradePoints).values({ gradingSystemId: scaleId, ...p, points: p.points.toString() });
            }
            await db.insert(gradingSystemAssignments).values({ sessionId: session!.id, gradingSystemId: scaleId });
        }

        console.log("Ultra-Resilient Seeding Completed!");
        return { success: true };
    } catch (error: any) {
        console.error("Seeding Error:", error);
        return { success: false, error: error.message };
    }
}
