"use server";

import { db } from "@/db/db";
import { 
    institutionalUnits, studentGroups, students, users, 
    courses, enrollments, results, academicSessions,
    gradingSystems, gradePoints, gradingSystemAssignments,
    faculties, departments, programmes, staffProfiles, courseLecturers
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { RankingService } from "@/services/RankingService";

export async function seedComprehensiveDemo() {
    try {
        console.log("Starting Idempotent Comprehensive Multi-Tier Seeding...");
        const hashedPassword = await bcrypt.hash("Password123!", 10);

        // 1. Academic Session
        let [session] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
        if (!session) {
             const [res] = await db.insert(academicSessions).values({
                 name: "2024/2025", isCurrent: true, startDate: new Date(), endDate: new Date(Date.now() + 31536000000)
             });
             session = { id: res.insertId, name: "2024/2025", isCurrent: true } as any;
        }

        // 2. Units Setup
        const createUnit = async (name: string, code: string, tier: 'k12'|'tertiary') => {
            const [existing] = await db.select().from(institutionalUnits).where(eq(institutionalUnits.code, code)).limit(1);
            if (existing) return existing.id;
            const [res] = await db.insert(institutionalUnits).values({
                name, code, slug: code.toLowerCase() + "-" + Date.now(),
                academicTier: tier, settings: JSON.stringify({ caWeight: 40, examWeight: 60 })
            });
            return res.insertId;
        };

        const primaryId = await createUnit("Unity Primary School", "UPS", "k12");
        const secondaryId = await createUnit("Unity High School", "UHS", "k12");
        const tertiaryId = await createUnit("Unity University", "UUNIV", "tertiary");

        // 3. Faculty & Departments (Tertiary)
        const getOrCreateFaculty = async (name: string, code: string) => {
            const [existing] = await db.select().from(faculties).where(eq(faculties.code, code)).limit(1);
            if (existing) return existing.id;
            const [res] = await db.insert(faculties).values({ name, code });
            return res.insertId;
        }
        const getOrCreateDept = async (fid: number, uid: number, name: string, code: string) => {
            const [existing] = await db.select().from(departments).where(eq(departments.code, code)).limit(1);
            if (existing) return existing.id;
            const [res] = await db.insert(departments).values({ facultyId: fid, unitId: uid, name, code });
            return res.insertId;
        }
        const getOrCreateProg = async (did: number, name: string, code: string) => {
            const [existing] = await db.select().from(programmes).where(eq(programmes.code, code)).limit(1);
            if (existing) return existing.id;
            const [res] = await db.insert(programmes).values({ deptId: did, name, code, durationMonths: 48, durationYears: 4 });
            return res.insertId;
        }

        const facId = await getOrCreateFaculty("Science and Engineering", "FSE");
        const deptId = await getOrCreateDept(facId, tertiaryId, "Computer Science", "CSC");
        const progId = await getOrCreateProg(deptId, "Software Engineering", "SWE");

        // 4. Staff Factory
        const createStaff = async (name: string, email: string, unitId: number, jobTitle: string, deptId?: number) => {
            const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
            let uid: number;
            if (existingUser) {
                uid = existingUser.id;
            } else {
                const [uRes] = await db.insert(users).values({ name, email, password: hashedPassword, role: 'staff' });
                uid = uRes.insertId;
            }

            const [existingProfile] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, uid)).limit(1);
            if (existingProfile) return existingProfile.id;

            const [sRes] = await db.insert(staffProfiles).values({
                userId: uid, unitId, departmentId: deptId, jobTitle, staffId: `EMP-${Math.floor(Math.random() * 9000) + 1000}`
            });
            return sRes.insertId;
        };

        const primaryTeachers = [
            await createStaff("Mary Teacher", "primary.teacher1@test.com", primaryId, "Class Teacher"),
            await createStaff("John Tutor", "primary.teacher2@test.com", primaryId, "Math Teacher")
        ];
        const secondaryTeachers = [
            await createStaff("Sarah Scientist", "secondary.teacher1@test.com", secondaryId, "Physics Teacher"),
            await createStaff("Peter Scholar", "secondary.teacher2@test.com", secondaryId, "Grammar Teacher")
        ];
        const lecturers = [
            await createStaff("Prof. Alan", "tertiary.lecturer1@test.com", tertiaryId, "Professor", deptId),
            await createStaff("Dr. Grace", "tertiary.lecturer2@test.com", tertiaryId, "Senior Lecturer", deptId)
        ];

        // 5. Courses (Subjects)
        const getOrCreateCourse = async (name: string, code: string) => {
            const [existing] = await db.select().from(courses).where(eq(courses.code, code)).limit(1);
            if (existing) return existing.id;
            const [res] = await db.insert(courses).values({ name, code, creditUnits: 3 });
            return res.insertId;
        };

        const pCourses = [await getOrCreateCourse("Primary Mathematics", "PMAT"), await getOrCreateCourse("Primary English", "PENG")];
        const sCourses = [await getOrCreateCourse("Advanced Physics", "SPHY"), await getOrCreateCourse("Secondary English", "SENG")];
        const tCourses = [await getOrCreateCourse("Data Structures", "CSC201"), await getOrCreateCourse("Discrete Math", "CSC202")];

        // 6. Course Assignments
        const assign = async (cid: number, sid: number, did: number|undefined) => {
            const [existing] = await db.select().from(courseLecturers).where(and(
                eq(courseLecturers.courseId, cid),
                eq(courseLecturers.staffId, sid),
                eq(courseLecturers.semester, '1')
            )).limit(1);
            if (existing) return;

            await db.insert(courseLecturers).values({ 
                sessionId: session!.id, courseId: cid, staffId: sid, deptId: did || 0, semester: '1', role: 'main' 
            });
            await db.insert(courseLecturers).values({ 
                sessionId: session!.id, courseId: cid, staffId: sid, deptId: did || 0, semester: '2', role: 'main' 
            });
        };
        for(let i=0; i<pCourses.length; i++) await assign(pCourses[i], primaryTeachers[i % primaryTeachers.length], undefined);
        for(let i=0; i<sCourses.length; i++) await assign(sCourses[i], secondaryTeachers[i % secondaryTeachers.length], undefined);
        for(let i=0; i<tCourses.length; i++) await assign(tCourses[i], lecturers[i % lecturers.length], deptId);

        // 7. Student Groups & Students
        const getOrCreateGroup = async (unitId: number, name: string, level: number) => {
            const [existing] = await db.select().from(studentGroups).where(and(eq(studentGroups.unitId, unitId), eq(studentGroups.name, name))).limit(1);
            if (existing) return existing.id;
            const [res] = await db.insert(studentGroups).values({ unitId, name, level });
            return res.insertId;
        };

        const createStudentBatch = async (prefix: string, unitId: number, groupId: number, count: number, startIdx: number, pId?: number, dId?: number) => {
            const list = [];
            for(let i=1; i<=count; i++) {
                const name = `${prefix} Student ${startIdx + i}`;
                const email = `${prefix.toLowerCase()}.student${startIdx + i}@test.com`;
                const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
                let uid: number;
                if (existingUser) {
                    uid = existingUser.id;
                } else {
                    const [uRes] = await db.insert(users).values({ name, email, password: hashedPassword, role: 'student' });
                    uid = uRes.insertId;
                }
                
                const [existingStudent] = await db.select().from(students).where(eq(students.userId, uid)).limit(1);
                if (existingStudent) {
                    list.push({ id: existingStudent.id, name });
                    continue;
                }

                const [sRes] = await db.insert(students).values({
                    userId: uid, firstName: prefix, lastName: `Student ${startIdx + i}`,
                    unitId, groupId, programmeId: pId, deptId: dId, currentLevel: 100,
                    matricNumber: `${prefix.substring(0,1)}-${Math.floor(Math.random() * 9000) + 1000}`,
                    admissionYear: 2024
                });
                list.push({ id: sRes.insertId, name });
            }
            return list;
        };

        const p1A = await getOrCreateGroup(primaryId, "Primary 1A", 1);
        const s1A = await getOrCreateGroup(secondaryId, "JSS 1A", 7);
        const t100 = await getOrCreateGroup(tertiaryId, "100 Level", 100);

        const pStudents = await createStudentBatch("Primary", primaryId, p1A, 12, 0);
        const sStudents = await createStudentBatch("Secondary", secondaryId, s1A, 12, 0);
        const tStudents = await createStudentBatch("Tertiary", tertiaryId, t100, 12, 0, progId, deptId);

        // 8. Results Seeding
        const seedResults = async (stuList: any[], courseList: number[]) => {
            for(const term of [1, 2]) {
                for(const stu of stuList) {
                    for(const cid of courseList) {
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
                                 studentId: stu.id, courseId: cid, sessionId: session!.id, semester: term, academicYear: "2024/2025"
                             });
                             eid = enrRes.insertId;
                         }

                         const [existingRes] = await db.select().from(results).where(eq(results.enrollmentId, eid)).limit(1);
                         if (!existingRes) {
                             const ca = Math.floor(Math.random() * 15) + 20;
                             const exam = Math.floor(Math.random() * 30) + 30;
                             await db.insert(results).values({
                                 enrollmentId: eid, caScore: ca.toString(), examScore: exam.toString(), 
                                 totalScore: (ca+exam).toString(), grade: 'A', isApproved: true
                             });
                         }
                    }
                }
                for(const cid of courseList) {
                    await RankingService.calculateSubjectRankings(cid, session!.id, term);
                }
            }
        };

        await seedResults(pStudents, pCourses);
        await seedResults(sStudents, sCourses);
        await seedResults(tStudents, tCourses);

        console.log("Comprehensive Idempotent Seeding Finished!");
        return { success: true, message: "Comprehensive Multi-Tier Seeding Completed Successfully!" };
    } catch (error: any) {
        console.error("Comprehensive Seeding Error:", error);
        return { success: false, error: error.message };
    }
}
