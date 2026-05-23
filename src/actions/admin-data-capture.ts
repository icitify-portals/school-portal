"use server";

import { getAIProvider } from "@/lib/ai-service";
import { db } from "@/db/db";
import { courses, courseDepartmentSettings, users, staffProfiles, departments, courseLecturers, academicSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as xlsx from "xlsx";
import bcrypt from "bcryptjs";

export async function extractProspectusData(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) return { success: false, error: "No file provided" };

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type;
        const fileName = file.name;

        // 1. Handle Excel/CSV separately for precision
        if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || mimeType === "text/csv") {
            const workbook = xlsx.read(buffer, { type: "buffer" });
            // For now, assume first sheet. A robust module might iterate.
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = xlsx.utils.sheet_to_json(sheet);

            // Use AI to clean and structure the raw Excel data if it's messy
            const provider = getAIProvider("multi");
            const prompt = `
            Convert this raw spreadsheet data into a structured JSON object with two arrays: "courses" and "lecturers".
            
            Course fields: code, name, creditUnits, description, semester (1 or 2), level (100-600), status (compulsory/required/elective), departmentCode.
            Lecturer fields: firstName, lastName, email, jobTitle, departmentCode.

            Raw Data: ${JSON.stringify(data).substring(0, 10000)}
            `;
            const structured = await provider.analyzeJson(prompt);
            return { success: true, data: structured };
        }

        // 2. Handle Documents/Images via AI analyzeDocument
        const provider = getAIProvider("multi");
        const prompt = `
        You are an intelligent data capture module for a school portal. 
        Extract all course and lecturer information from the attached prospectus.
        
        Return a JSON object with:
        {
            "courses": [
                { 
                    "code": "CSC101", 
                    "name": "Intro to CS", 
                    "creditUnits": 3, 
                    "description": "...", 
                    "semester": "1", 
                    "level": 100, 
                    "status": "compulsory", 
                    "departmentCode": "CSC",
                    "assignedLecturers": ["j.doe@school.edu"] 
                }
            ],
            "lecturers": [
                { "firstName": "John", "lastName": "Doe", "email": "j.doe@school.edu", "jobTitle": "Senior Lecturer", "departmentCode": "CSC" }
            ]
        }

        If data is missing for a field, provide a sensible default or null.
        "assignedLecturers" should contain the emails of lecturers assigned to that course as mentioned in the document.
        Be extremely thorough. Extract every single item found.
        `;

        const result = await provider.analyzeDocument(buffer, mimeType, prompt);
        return { success: true, data: result };

    } catch (error: any) {
        console.error("Data Capture Error:", error);
        return { success: false, error: error.message || "Failed to extract data" };
    }
}

export async function commitCapturedData(data: { courses: any[], lecturers: any[] }) {
    try {
        const passwordHash = await bcrypt.hash("welcome123", 10);

        // Fetch all departments once for mapping
        const allDepts = await db.select().from(departments);

        // Fetch current session for assignments
        const [currentSession] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);

        await db.transaction(async (tx) => {
            const courseIdMap = new Map<string, number>();
            const staffIdMap = new Map<string, number>();

            // 1. Process Courses
            for (const c of data.courses) {
                // Upsert Course
                const existingCourse = await tx.select().from(courses).where(eq(courses.code, c.code)).limit(1);
                let courseId;
                if (existingCourse.length > 0) {
                    courseId = existingCourse[0].id;
                    await tx.update(courses).set({
                        name: c.name,
                        creditUnits: parseInt(c.creditUnits) || 3,
                        description: c.description
                    }).where(eq(courses.id, courseId));
                } else {
                    const [res] = await tx.insert(courses).values({
                        code: c.code,
                        name: c.name,
                        creditUnits: parseInt(c.creditUnits) || 3,
                        description: c.description
                    });
                    courseId = res.insertId;
                }
                courseIdMap.set(c.code, courseId);

                // Department Linkage
                const dept = allDepts.find(d => d.code === c.departmentCode);
                if (dept && courseId) {
                    // Check if setting exists
                    const existingSetting = await tx.select().from(courseDepartmentSettings)
                        .where(and(
                            eq(courseDepartmentSettings.courseId, courseId),
                            eq(courseDepartmentSettings.deptId, dept.id)
                        )).limit(1);

                    if (existingSetting.length === 0) {
                        await tx.insert(courseDepartmentSettings).values({
                            courseId,
                            deptId: dept.id,
                            semester: (c.semester === '2' ? '2' : '1'),
                            status: c.status || 'compulsory',
                            level: parseInt(c.level) || 100
                        });
                    }
                }
            }

            // 2. Process Lecturers
            for (const l of data.lecturers) {
                if (!l.email) continue;

                // Check User
                const existingUser = await tx.select().from(users).where(eq(users.email, l.email)).limit(1);
                let userId;
                if (existingUser.length > 0) {
                    userId = existingUser[0].id;
                    await tx.update(users).set({
                        name: `${l.firstName} ${l.lastName}`,
                        role: 'staff'
                    }).where(eq(users.id, userId));
                } else {
                    const [res] = await tx.insert(users).values({
                        name: `${l.firstName} ${l.lastName}`,
                        email: l.email,
                        password: passwordHash,
                        role: 'staff'
                    });
                    userId = res.insertId;
                }

                // Staff Profile
                const dept = allDepts.find(d => d.code === l.departmentCode);
                const existingProfile = await tx.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
                let staffId;
                if (existingProfile.length > 0) {
                    staffId = existingProfile[0].id;
                    await tx.update(staffProfiles).set({
                        jobTitle: l.jobTitle || 'Lecturer',
                        departmentId: dept?.id || null
                    }).where(eq(staffProfiles.id, staffId));
                } else {
                    const [res] = await tx.insert(staffProfiles).values({
                        userId,
                        staffId: `STF-${Math.floor(1000 + Math.random() * 9000)}`,
                        jobTitle: l.jobTitle || 'Lecturer',
                        departmentId: dept?.id || null
                    });
                    staffId = res.insertId;
                }
                staffIdMap.set(l.email, staffId);
            }

            // 3. Process Assignments
            if (currentSession) {
                for (const c of data.courses) {
                    const courseId = courseIdMap.get(c.code);
                    if (!courseId || !c.assignedLecturers) continue;

                    for (const email of c.assignedLecturers) {
                        const staffId = staffIdMap.get(email);
                        if (!staffId) continue;

                        const dept = allDepts.find(d => d.code === c.departmentCode);
                        if (!dept) continue;

                        // Check if assignment exists
                        const existingAssignment = await tx.select().from(courseLecturers)
                            .where(and(
                                eq(courseLecturers.sessionId, currentSession.id),
                                eq(courseLecturers.courseId, courseId),
                                eq(courseLecturers.staffId, staffId),
                                eq(courseLecturers.semester, c.semester === '2' ? '2' : '1')
                            )).limit(1);

                        if (existingAssignment.length === 0) {
                            await tx.insert(courseLecturers).values({
                                sessionId: currentSession.id,
                                courseId,
                                staffId,
                                deptId: dept.id,
                                semester: c.semester === '2' ? '2' : '1',
                                role: 'main'
                            });
                        }
                    }
                }
            }
        });

        revalidatePath("/admin/courses");
        revalidatePath("/admin/hr");
        return { success: true };
    } catch (error: any) {
        console.error("Commit Error:", error);
        return { success: false, error: error.message || "Failed to commit data" };
    }
}
