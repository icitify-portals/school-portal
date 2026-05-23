
import { db } from "../src/db/db";
import { 
    users, 
    staffProfiles, 
    institutionalUnits, 
    courses, 
    academicSessions, 
    courseLecturers,
    lessonNotes,
    departments
} from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seedTierDemo() {
    try {
        console.log("🏙️ Seeding/Fixing Tier-Specific Demo (K12 vs Tertiary)...");
        
        const passwordHash = await bcrypt.hash("welcome123", 10);
        const [session] = await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
        
        if (!session) {
            console.error("Active Academic Session required.");
            process.exit(1);
        }

        // Helper to get or create a user
        const getOrCreateUser = async (name: string, email: string, role: any) => {
            const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
            if (existing) return existing.id;
            const [res] = await db.insert(users).values({
                name,
                email,
                password: passwordHash,
                role
            });
            return res.insertId;
        };

        // Helper to get or create a unit
        const getOrCreateUnit = async (name: string, code: string, tier: any, type: any) => {
            const [existing] = await db.select().from(institutionalUnits).where(eq(institutionalUnits.code, code)).limit(1);
            if (existing) return existing.id;
            const [res] = await db.insert(institutionalUnits).values({
                name,
                code,
                slug: code.toLowerCase(),
                type,
                academicTier: tier
            } as any);
            return res.insertId;
        };

        // 1. Units
        const k12UnitId = await getOrCreateUnit("Springfield Elementary", "SES-01", "k12", "school");
        const tertUnitId = await getOrCreateUnit("Global Institute", "GIT-01", "tertiary", "college");

        // 2. Departments
        const getOrCreateDept = async (name: string, code: string, unitId: number) => {
            const [existing] = await db.select().from(departments).where(eq(departments.code, code)).limit(1);
            if (existing) return existing.id;
            const [res] = await db.insert(departments).values({
                name,
                code,
                unitId
            });
            return res.insertId;
        };
        const k12DeptId = await getOrCreateDept("Grade 5", "G-5-K12", k12UnitId);
        const tertDeptId = await getOrCreateDept("Computer Science", "CS-TERT", tertUnitId);

        // 3. Users
        const teacherUserId = await getOrCreateUser("Mrs. Sarah Smith", "teacher@springfield.edu", "staff");
        const lecturerUserId = await getOrCreateUser("Prof. Alan Jones", "lecturer@git.edu", "staff");

        // 4. Staff Profiles
        const getOrCreateStaffProfile = async (uId: number, sId: string, unitId: number, deptId: number, job: string) => {
            const [existing] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, uId)).limit(1);
            if (existing) return existing.id;
            const [res] = await db.insert(staffProfiles).values({
                userId: uId,
                staffId: sId,
                unitId,
                departmentId: deptId,
                jobTitle: job
            } as any);
            return res.insertId;
        };
        const teacherProfId = await getOrCreateStaffProfile(teacherUserId, "TCH-501", k12UnitId, k12DeptId, "Teacher");
        const lecturerProfId = await getOrCreateStaffProfile(lecturerUserId, "LEC-901", tertUnitId, tertDeptId, "Lecturer");

        // 5. Courses
        const getOrCreateCourse = async (name: string, code: string) => {
            const [existing] = await db.select().from(courses).where(eq(courses.code, code)).limit(1);
            if (existing) return existing.id;
            const [res] = await db.insert(courses).values({
                name,
                code,
                creditUnits: 3
            } as any);
            return res.insertId;
        };
        const subjectId = await getOrCreateCourse("Mathematics", "MATH-5");
        const courseId = await getOrCreateCourse("Web Arch", "CSC-401");

        // 6. Assignments
        const linkStaff = async (cId: number, sId: number) => {
            const [existing] = await db.select().from(courseLecturers).where(and(
                eq(courseLecturers.courseId, cId),
                eq(courseLecturers.staffId, sId),
                eq(courseLecturers.sessionId, session.id)
            )).limit(1);
            if (!existing) {
                await db.insert(courseLecturers).values({
                    courseId: cId,
                    staffId: sId,
                    sessionId: session.id,
                    role: 'primary'
                });
            }
        };
        await linkStaff(subjectId, teacherProfId);
        await linkStaff(courseId, lecturerProfId);

        console.log("\n✅ Tier-Specific Users & Context Ready!");
        console.log(`K12 Login: teacher@springfield.edu / welcome123`);
        console.log(`Tertiary Login: lecturer@git.edu / welcome123`);

    } catch (error) {
        console.error("❌ Seeding Failed:", error);
    }
    process.exit(0);
}

seedTierDemo();
