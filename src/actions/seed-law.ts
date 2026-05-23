"use server";

import { db } from "@/db/db";
import { faculties, departments, courses, courseDepartmentSettings, users, staffProfiles } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const LAW_DATA = {
    faculty: { name: "Faculty of Law", code: "LAW" },
    departments: [
        { name: "Department of Public Law", code: "PUL", prefix: "LPU" }, // Updated prefix to match new list
        { name: "Department of Private and Property Law", code: "PPL", prefix: "LPP" }, // Updated name & prefix
        { name: "Department of Commercial and Industrial Law", code: "CIL", prefix: "LCI" }, // New
        { name: "Department of Jurisprudence and International Law", code: "JIL", prefix: "LJI" }, // New
        { name: "Faculty of Law (General)", code: "LAW_GEN", prefix: "LAW" } // Logic for Faculty Courses
    ],
    courses: [
        // Faculty Courses
        { code: "LAW 101", name: "Legal Methods I", units: 4, semester: "1", status: "compulsory", level: 100 },
        { code: "LAW 102", name: "Legal Methods II", units: 4, semester: "2", status: "compulsory", level: 100 },
        { code: "LAW 103", name: "Basic Computer for Legal Studies", units: 2, semester: "1", status: "compulsory", level: 100 },
        { code: "LAW 201", name: "Introduction to Law and Psychology", units: 2, semester: "1", status: "elective", level: 200 },
        { code: "LAW 299", name: "General Principles of Law (for Non-Law Students)", units: 2, semester: "1", status: "elective", level: 200 },
        { code: "LAW 301", name: "Application of Computers to Legal Studies", units: 3, semester: "1", status: "compulsory", level: 300 },

        // Commercial and Industrial Law (LCI / LPB)
        { code: "LCI 201", name: "Law of Contract I", units: 4, semester: "1", status: "compulsory", level: 200 },
        { code: "LCI 202", name: "Law of Contract II", units: 4, semester: "2", status: "compulsory", level: 200 },
        { code: "LCI 301", name: "Law of Commercial Transactions I", units: 4, semester: "1", status: "compulsory", level: 300 },
        { code: "LCI 302", name: "Law of Commercial Transactions II", units: 4, semester: "2", status: "compulsory", level: 300 },
        { code: "LCI 303", name: "Law of Banking and Negotiable Instruments I", units: 4, semester: "1", status: "elective", level: 300 },
        { code: "LCI 304", name: "Law of Banking and Negotiable Instruments II", units: 4, semester: "2", status: "elective", level: 300 },
        { code: "LPB 501", name: "Law of Business Associations I", units: 4, semester: "1", status: "compulsory", level: 500 },
        { code: "LPB 502", name: "Law of Business Associations II", units: 4, semester: "2", status: "compulsory", level: 500 },
        { code: "LPB 503", name: "Insurance Law I", units: 4, semester: "1", status: "elective", level: 500 },
        { code: "LPB 504", name: "Insurance Law II", units: 4, semester: "2", status: "elective", level: 500 },
        { code: "LPB 505", name: "Revenue Law I", units: 4, semester: "1", status: "elective", level: 500 },
        { code: "LCI 504", name: "Taxation & Revenue Law II", units: 4, semester: "2", status: "elective", level: 500 },
        { code: "LCI 505", name: "Labour and Industrial Relations Law I", units: 4, semester: "1", status: "elective", level: 500 },
        { code: "LCI 506", name: "Labour and Industrial Relations Law II", units: 4, semester: "2", status: "elective", level: 500 },
        { code: "LCI 507", name: "Maritime Law I", units: 4, semester: "1", status: "elective", level: 500 },
        { code: "LCI 508", name: "Maritime Law II", units: 4, semester: "2", status: "elective", level: 500 },

        // Public Law (LPU / LPI / LPB)
        { code: "LPU 201", name: "Constitutional Law I", units: 4, semester: "1", status: "compulsory", level: 200 },
        { code: "LPU 202", name: "Constitutional Law II", units: 4, semester: "2", status: "compulsory", level: 200 },
        { code: "LPU 301", name: "Criminal Law I", units: 4, semester: "1", status: "compulsory", level: 300 },
        { code: "LPU 302", name: "Criminal Law II", units: 4, semester: "2", status: "compulsory", level: 300 },
        { code: "LPU 303", name: "Islamic Law I", units: 4, semester: "1", status: "elective", level: 300 },
        { code: "LPU 304", name: "Islamic Law II", units: 4, semester: "2", status: "elective", level: 300 },
        { code: "LPI 401", name: "Law of Evidence I", units: 4, semester: "1", status: "compulsory", level: 400 },
        { code: "LPI 402", name: "Law of Evidence II", units: 4, semester: "2", status: "compulsory", level: 400 },
        { code: "LPI 403", name: "Environmental Law I", units: 4, semester: "1", status: "elective", level: 400 },
        { code: "LPI 404", name: "Environmental Law II", units: 4, semester: "2", status: "elective", level: 400 },
        { code: "LPU 501", name: "Administrative Law I", units: 4, semester: "1", status: "elective", level: 500 },
        { code: "LPU 502", name: "Administrative Law II", units: 4, semester: "2", status: "elective", level: 500 },

        // Jurisprudence and International Law (LJI / LPI)
        { code: "LJI 201", name: "Nigerian Legal System I", units: 4, semester: "1", status: "compulsory", level: 200 },
        { code: "LJI 202", name: "Nigerian Legal System II", units: 4, semester: "2", status: "compulsory", level: 200 },
        { code: "LJI 203", name: "Human Rights Law I", units: 4, semester: "1", status: "compulsory", level: 200 },
        { code: "LJI 204", name: "Human Rights Law II", units: 4, semester: "2", status: "compulsory", level: 200 },
        { code: "LJI 301", name: "Disability Law I", units: 4, semester: "1", status: "elective", level: 300 },
        { code: "LJI 302", name: "Disability Law II", units: 4, semester: "2", status: "elective", level: 300 },
        { code: "LPI 303", name: "Humanitarian Law I", units: 3, semester: "1", status: "elective", level: 300 },
        { code: "LPI 304", name: "Humanitarian Law II", units: 3, semester: "2", status: "elective", level: 300 },
        { code: "LPI 405", name: "Conflict of Laws I", units: 4, semester: "1", status: "elective", level: 400 },
        { code: "LPI 501", name: "Jurisprudence and Legal Theory I", units: 4, semester: "1", status: "compulsory", level: 500 },
        { code: "LPI 502", name: "Jurisprudence and Legal Theory II", units: 4, semester: "2", status: "compulsory", level: 500 },
        { code: "LJI 503", name: "Oil and Gas Law I", units: 4, semester: "1", status: "elective", level: 500 },
        { code: "LJI 504", name: "Oil and Gas Law II", units: 4, semester: "2", status: "elective", level: 500 },
        { code: "LJI 505", name: "International Humanitarian Law I", units: 4, semester: "1", status: "elective", level: 500 },
        { code: "LJI 506", name: "International Humanitarian Law II", units: 4, semester: "2", status: "elective", level: 500 },

        // Private and Property Law (LPP / LPB)
        { code: "LPP 201", name: "Reproductive and Sexual Health Rights Law I", units: 4, semester: "1", status: "elective", level: 200 },
        { code: "LPP 202", name: "Reproductive and Sexual Health Rights Law II", units: 4, semester: "2", status: "elective", level: 200 },
        { code: "LPP 301", name: "Law of Torts I", units: 4, semester: "1", status: "compulsory", level: 300 },
        { code: "LPP 302", name: "Law of Torts II", units: 4, semester: "2", status: "compulsory", level: 300 },
        { code: "LPP 303", name: "Medical Law I", units: 4, semester: "1", status: "elective", level: 300 },
        { code: "LPB 310", name: "Medical Law II", units: 4, semester: "2", status: "elective", level: 300 },
        { code: "LPP 304", name: "Medical Law II", units: 4, semester: "2", status: "elective", level: 300 },
        { code: "LPP 305", name: "Family Law I", units: 4, semester: "1", status: "compulsory", level: 300 },
        { code: "LPP 306", name: "Family Law II", units: 4, semester: "2", status: "compulsory", level: 300 },
        { code: "LPB 401", name: "Nigerian Land Law I", units: 4, semester: "1", status: "compulsory", level: 400 },
        { code: "LPB 402", name: "Nigerian Land Law II", units: 4, semester: "2", status: "compulsory", level: 400 },
        { code: "LPB 403", name: "Equity and Trusts I", units: 4, semester: "1", status: "compulsory", level: 400 },
        { code: "LPB 404", name: "Equity and Trusts II", units: 4, semester: "2", status: "compulsory", level: 400 },
        { code: "LPP 401", name: "Nigerian Land Law I", units: 4, semester: "1", status: "compulsory", level: 400 },
        { code: "LPP 402", name: "Nigerian Land Law II", units: 4, semester: "2", status: "compulsory", level: 400 },
        { code: "LPP 403", name: "Equity and Trusts I", units: 4, semester: "1", status: "compulsory", level: 400 },
        { code: "LPP 406", name: "Intellectual Property Law II", units: 4, semester: "2", status: "elective", level: 400 },
        { code: "LPP 407", name: "Law of Succession I", units: 4, semester: "1", status: "elective", level: 400 },
        { code: "LPP 408", name: "Law of Succession II", units: 4, semester: "2", status: "elective", level: 400 }
    ],
    staff: [
        { title: "Dr.", name: "ARAROMI, Marcus Ayodeji", qualifications: "LL.B., LL.M. Ph.D.(Ibadan), BL.", rank: "Senior Lecturer", specialization: "Conflict of Laws, Public Law and ICT Law" },
        { title: "Dr.", name: "FAGBEMI, Sunday Akinlolu", qualifications: "LL.B., LL.M.(Ife) BL.", rank: "Senior Lecturer", specialization: "Environmental Law, ADR Law and Civil Litigation" },
        { title: "Dr.", name: "EKUNDAYO, Osifunke Sekinah", qualifications: "B.Sc., MLS, LL.B., LL.M., Ph.D.(London) BL.", rank: "Senior Lecturer", specialization: "Family Law, Law Library Research and Law of Succession" },
        { title: "", name: "ADEJUMO, Isaac Okunlade", qualifications: "LL.B., LL.M (Ife) BL.", rank: "Lecturer I", specialization: "Criminal Law, Criminology and Maritime Law" },
        { title: "Dr.", name: "OLANIYAN, Kazeem Olajide", qualifications: "B.A. Philosophy (Ibadan) LL.B., LL.M (Ibadan) BL.", rank: "Lecturer I", specialization: "Jurisprudence, Islamic Law, Criminal Law and Law of Evidence" },
        { title: "Dr.", name: "ADEWUMI Afolasade Abidemi", qualifications: "LL.B., LL.M. Ph.D.(Ibadan) BL.", rank: "Lecturer I", specialization: "Cultural Heritage Law, International Law, Conflict of Laws and Public Law" },
        { title: "Dr.", name: "ONIEMOLA Peter Kayode", qualifications: "LL.B., LL.M. Ph.D.; BL.", rank: "Lecturer I", specialization: "Oil and Gas, Labour Law and Revenue Law" },
        { title: "Dr.", name: "ADIGUN Muyiwa", qualifications: "LL.B., LL.M. Ph.D.; BL.", rank: "Lecturer I", specialization: "Public Law and International Law" },
        { title: "Dr.", name: "ANIFALAJE, Kehinde Afusat", qualifications: "LL.B.(Lagos), LL.M. Ph.D.(Ibadan) BL.", rank: "Lecturer I", specialization: "Commercial Law and Social Security Laws." },
        { title: "Dr.", name: "BYRON, Ibijoke Patricia", qualifications: "LL.B., LL.M.(Ibadan), BL.", rank: "Lecturer I", specialization: "Family Law, Intellectual Property, Human Rights and Clinical Legal Education" },
        { title: "", name: "UZO-PETERS, Adure", qualifications: "LL.B. (Ibadan), LL.M., BL.", rank: "Lecturer II", specialization: "Domestic and International Business Law" },
        { title: "", name: "ADEYEMO, Deborah", qualifications: "LL.B. (Ife), LL.M., B.L.", rank: "Lecturer II", specialization: "Criminal Law, Transitional Justice and Criminology" },
        { title: "", name: "AJAGUNNA, Folakemi Olabisi", qualifications: "LL.B., LL.M., MPH (Ibadan), BL.", rank: "Lecturer II", specialization: "Public Health Law, Private Law and Property Law" },
        { title: "", name: "ILESANMI, Stephen Idowu", qualifications: "LL.B., LL.M., BL.", rank: "Lecturer II", specialization: "Public Law, Environmental Law and Public International Law" }
    ]
};

export async function seedLawCourses() {
    try {
        console.log("⚖️ Seeding Law Faculty & Courses...");

        // 1. Create/Get Faculty
        let facultyId: number;
        console.log("Checking if faculty exists without using schema select...");
        const [rows]: any = await db.execute(sql`SELECT id FROM faculties WHERE code = ${LAW_DATA.faculty.code} LIMIT 1`);
        const existingFaculty = rows as { id: number }[];
        if (existingFaculty.length > 0) {
            facultyId = existingFaculty[0].id;
            console.log("Faculty of Law exists.");
        } else {
            const [res] = await db.insert(faculties).values(LAW_DATA.faculty);
            facultyId = res.insertId;
            console.log("Created Faculty of Law.");
        }

        // 2. Create/Get Departments
        const deptMap = new Map<string, number>();
        const UNIT_ID = 1;

        for (const dept of LAW_DATA.departments) {
            const existingDept = await db.select().from(departments).where(eq(departments.code, dept.code)).limit(1);
            if (existingDept.length > 0) {
                deptMap.set(dept.code, existingDept[0].id);
                console.log(`Department ${dept.name} exists.`);
            } else {
                const [res] = await db.insert(departments).values({
                    name: dept.name,
                    code: dept.code,
                    facultyId: facultyId,
                    unitId: UNIT_ID
                });
                deptMap.set(dept.code, res.insertId);
                console.log(`Created ${dept.name}.`);
            }
        }

        // 3. Seed Courses
        let coursesCreated = 0;
        let coursesLinked = 0;

        const getDeptCode = (courseCode: string) => {
            const [prefix, num] = courseCode.split(" ");
            if (prefix === "LAW") return "LAW_GEN";
            if (prefix === "LPU") return "PUL";
            if (prefix === "LPP") return "PPL";
            if (prefix === "LCI") return "CIL";
            if (prefix === "LJI") return "JIL";

            // Image specific logic for LPI/LPB prefixes
            if (prefix === "LPI") {
                if (num.startsWith("5")) return "JIL"; // Jurisprudence
                if (num === "405") return "JIL"; // Conflict of Laws
                if (num.startsWith("4")) return "PUL"; // Evidence, Environmental
                if (num.startsWith("3")) return "JIL"; // Humanitarian
                return "PUL";
            }
            if (prefix === "LPB") {
                if (num.startsWith("5")) return "CIL"; // Business, Insurance, Revenue
                if (num.startsWith("4")) return "PPL"; // Land Law, Equity
                if (num.startsWith("3")) return "PPL"; // Medical
                return "PPL";
            }
            return prefix; // Default
        };

        for (const course of LAW_DATA.courses) {
            const deptCode = getDeptCode(course.code);
            const deptId = deptMap.get(deptCode);

            if (!deptId) {
                console.error(`Unknown deptCode ${deptCode} for course ${course.code}`);
                continue;
            }

            let courseId: number;
            const existingCourse = await db.select().from(courses).where(eq(courses.code, course.code)).limit(1);

            if (existingCourse.length > 0) {
                courseId = existingCourse[0].id;
            } else {
                const [res] = await db.insert(courses).values({
                    name: course.name,
                    code: course.code,
                    creditUnits: course.units,
                    description: `${course.name} (${course.level} Level)`, // Basic description
                    isUniversityRequired: false,
                    countsForCgpa: true
                });
                courseId = res.insertId;
                coursesCreated++;
            }

            const existingLink = await db.select().from(courseDepartmentSettings).where(
                and(
                    eq(courseDepartmentSettings.courseId, courseId),
                    eq(courseDepartmentSettings.deptId, deptId)
                )
            ).limit(1);

            if (existingLink.length === 0) {
                await db.insert(courseDepartmentSettings).values({
                    courseId,
                    deptId,
                    semester: course.semester as "1" | "2",
                    status: course.status as "compulsory" | "elective",
                    level: course.level
                });
                coursesLinked++;
            }
        }

        console.log(`✅ Law Seeding Complete: ${coursesCreated} new courses, ${coursesLinked} assigned.`);

        // 4. Seed Staff
        console.log("👨‍🏫 Seeding Law Staff...");
        const defaultPassword = await bcrypt.hash("password123", 10);
        let staffCreated = 0;

        // Get Department IDs
        const lpuId = deptMap.get("PUL"); // Public Law (was LPU)
        const lppId = deptMap.get("PPL"); // Private & Property Law (was LPP)
        const lciId = deptMap.get("CIL"); // Commercial & Industrial Law (was LCI)
        const ljiId = deptMap.get("JIL"); // Jurisprudence & Intl Law (was LJI)

        // Fallback ID if any is missing
        const fallbackId = lpuId || lppId || lciId || ljiId;

        if (!fallbackId) {
            throw new Error("No Law Departments found for staff assignment.");
        }

        const deptIds = [lpuId, lppId, lciId, ljiId].filter(id => id !== undefined) as number[];

        for (let i = 0; i < LAW_DATA.staff.length; i++) {
            const staff = LAW_DATA.staff[i];
            const email = `${staff.name.split(',')[0].toLowerCase().replace(/\s/g, '')}@school.com`;

            const assignedDeptId = deptIds[i % deptIds.length];

            let userId: number;
            const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

            if (existingUser.length > 0) {
                userId = existingUser[0].id;
            } else {
                const [res] = await db.insert(users).values({
                    email,
                    name: `${staff.title} ${staff.name}`,
                    password: defaultPassword,
                    role: "staff",
                    status: "active"
                });
                userId = res.insertId;
            }

            const existingProfile = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
            if (existingProfile.length === 0) {
                await db.insert(staffProfiles).values({
                    userId,
                    staffId: `LAW-${String(i + 1).padStart(3, '0')}`,
                    departmentId: assignedDeptId,
                    unitId: UNIT_ID,
                    jobTitle: staff.rank,
                    gradeLevel: "CONUASS 4",
                    isActive: true,
                });
                staffCreated++;
            }
        }
        console.log(`✅ Law Staff Seeding Complete: ${staffCreated} new profiles.`);

        return { success: true, message: `Seeded ${coursesCreated} new courses and ${staffCreated} staff profiles.` };

    } catch (error) {
        console.error("Law Seeding Failed:", error);
        return { success: false, error: (error as Error).message };
    }
}
