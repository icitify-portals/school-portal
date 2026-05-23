import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import { RankingService } from "../src/services/RankingService";

dotenv.config();

const baseUri = process.env.DATABASE_URL || "mysql://root:@127.0.0.1:3306/moodledb";

async function seedDemoDataForDb(db: any) {
    console.log("Seeding Demo Accounts and CMS Homepage sections...");
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    // 1. Seed Demo Accounts
    const demoAccounts = [
        { name: "Super Admin", email: "superadmin@demo.edu", role: "superadmin" },
        { name: "Portal Admin", email: "admin@demo.edu", role: "admin" },
        { name: "Bursar (Finance)", email: "bursar@demo.edu", role: "admin" },
        { name: "Registrar", email: "registrar@demo.edu", role: "admin" },
        { name: "Dr. Alan Turing", email: "staff@demo.edu", role: "staff" },
        { name: "John Student", email: "student@demo.edu", role: "student" },
        { name: "Health Officer", email: "healthadmin@demo.edu", role: "healthadmin" },
        { name: "Deputy VC", email: "dvc@demo.edu", role: "dvc" },
    ];

    for (const account of demoAccounts) {
        await db.insert(schema.users).values({
            name: account.name,
            email: account.email,
            password: hashedPassword,
            role: account.role as any,
            status: "active",
        }).onDuplicateKeyUpdate({
            set: { status: "active", role: account.role as any }
        });

        // Handle profiles for student/staff
        const user = (await db.select().from(schema.users).where(eq(schema.users.email, account.email)).limit(1))[0];
        if (account.role === 'student') {
            await db.insert(schema.students).values({
                userId: user.id,
                matricNumber: "MAT/" + Math.floor(Math.random() * 10000),
                firstName: account.name.split(' ')[0],
                lastName: account.name.split(' ')[1] || "Demo",
                status: "active"
            }).onDuplicateKeyUpdate({ set: { status: "active" } });
        } else if (account.role === 'staff') {
            await db.insert(schema.staffProfiles).values({
                userId: user.id,
                staffId: "STF/" + Math.floor(Math.random() * 10000),
                jobTitle: "Senior Lecturer",
                isActive: true
            }).onDuplicateKeyUpdate({ set: { isActive: true } });
        }
    }

    // 2. Clear existing homepage sections (to avoid duplicates)
    await db.delete(schema.cmsSectionMedia);
    await db.delete(schema.cmsHomePageSections);

    // 3. Seed Homepage Hero
    const [heroSection] = await db.insert(schema.cmsHomePageSections).values({
        type: "hero",
        title: "Empowering Excellence in Education",
        subtitle: "Experience a seamless management system for students, staff, and administration.",
        content: JSON.stringify({
            badge: "Welcome to Our Institutional Portal",
            ctaText: "Discover More",
            ctaLink: "/register",
            imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200"
        }),
        order: 1,
        isActive: true
    });

    // 4. Seed Homepage Slider
    const [sliderSection] = await db.insert(schema.cmsHomePageSections).values({
        type: "slider",
        title: "Life at our Campus",
        subtitle: "Glance through our world-class facilities and vibrant campus community.",
        order: 2,
        isActive: true
    });

    const sliderMedia = [
        {
            url: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=1920",
            caption: "Iconic Main Campus",
            order: 1
        },
        {
            url: "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=1920",
            caption: "State-of-the-Art Library",
            order: 2
        },
        {
            url: "https://images.unsplash.com/photo-1523050853064-8521a3e3515f?auto=format&fit=crop&q=80&w=1920",
            caption: "Dynamic Student Life",
            order: 3
        }
    ];

    for (const media of sliderMedia) {
        await db.insert(schema.cmsSectionMedia).values({
            sectionId: sliderSection.insertId,
            url: media.url,
            caption: media.caption,
            mediaType: "image",
            order: media.order
        });
    }

    // 5. Seed News Section
    await db.insert(schema.cmsHomePageSections).values({
        type: "news",
        title: "Latest Institutional News",
        subtitle: "Stay updated with the recent events and announcements.",
        order: 3,
        isActive: true
    });

    console.log("Accounts and CMS homepage sections seeded successfully!");
}

async function seedResultsDemoForDb(db: any) {
    console.log("Seeding Academic Results Demo...");
    
    // 1. Setup Academic Session
    let [session] = await db.select().from(schema.academicSessions).where(eq(schema.academicSessions.isCurrent, true)).limit(1);
    if (!session) {
         const [res] = await db.insert(schema.academicSessions).values({
             name: "2024/2025",
             isCurrent: true,
             startDate: new Date(),
             endDate: new Date(Date.now() + 31536000000)
         });
         session = { id: res.insertId, name: "2024/2025", isCurrent: true } as any;
    }

    // 2. K-12 Institution Setup
    let unitId: number;
    const [existingUnit] = await db.select().from(schema.institutionalUnits).where(eq(schema.institutionalUnits.code, "GPS")).limit(1);
    if (existingUnit) {
        unitId = existingUnit.id;
    } else {
        const [unitRes] = await db.insert(schema.institutionalUnits).values({
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
        const [existing] = await db.select().from(schema.studentGroups).where(and(eq(schema.studentGroups.unitId, unitId), eq(schema.studentGroups.name, name))).limit(1);
        if (existing) return existing.id;
        const [res] = await db.insert(schema.studentGroups).values({ unitId, name, level });
        return res.insertId;
    };
    const armAId = await getOrCreateGroup("Primary 1A", 1);
    const armBId = await getOrCreateGroup("Primary 1B", 1);

    // 4. Subjects
    const getOrCreateCourse = async (name: string, code: string) => {
        const [existing] = await db.select().from(schema.courses).where(eq(schema.courses.code, code)).limit(1);
        if (existing) return existing.id;
        const [res] = await db.insert(schema.courses).values({ name, code, creditUnits: 3 });
        return res.insertId;
    };
    const mathId = await getOrCreateCourse("Mathematics", "MAT101");
    const engId = await getOrCreateCourse("English Language", "ENG101");

    // 5. Create Students
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    const createStudent = async (name: string, email: string, groupId: number) => {
        let userId: number;
        const [existingUser] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
        if (existingUser) {
            userId = existingUser.id;
        } else {
            const [uRes] = await db.insert(schema.users).values({ name, email, password: hashedPassword, role: 'student' });
            userId = uRes.insertId;
        }

        const [existingStudent] = await db.select().from(schema.students).where(eq(schema.students.userId, userId)).limit(1);
        if (existingStudent) {
            return { id: existingStudent.id, name };
        }

        const mat = `STU-${Math.floor(Math.random() * 10000)}`;
        const [sRes] = await db.insert(schema.students).values({
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
                const [existingEnr] = await db.select().from(schema.enrollments).where(and(
                    eq(schema.enrollments.studentId, stu.id),
                    eq(schema.enrollments.courseId, cid),
                    eq(schema.enrollments.semester, term)
                )).limit(1);
                
                let eid: number;
                if (existingEnr) {
                    eid = existingEnr.id;
                } else {
                    const [enrRes] = await db.insert(schema.enrollments).values({
                        studentId: stu.id, courseId: cid, 
                        academicYear: session!.name, semester: term,
                        sessionId: session!.id
                    });
                    eid = enrRes.insertId;
                }

                const [existingRes] = await db.select().from(schema.results).where(eq(schema.results.enrollmentId, eid)).limit(1);
                if (!existingRes) {
                    let ca = 0, exam = 0;
                    if (stu.name.includes("Alice")) { ca = 35; exam = 55; }
                    else if (stu.name.includes("Bob")) { ca = 30; exam = 45; }
                    else { ca = 32; exam = 48; }

                    await db.insert(schema.results).values({
                        enrollmentId: eid, caScore: ca.toString(), examScore: exam.toString(), 
                        totalScore: (ca + exam).toString(), isApproved: true, grade: 'A'
                    });
                }
            }
        }
        
        // Temporarily patch RankingService's internal db usage by replacing the global db with our db,
        // or just let it query dynamically. Since RankingService imports `db` from `@/db/db`, it will use
        // the proxied pool. So if we are in CLI, proxied pool uses getActiveDbName which returns "school_portal".
        // Wait, to make sure RankingService queries the correct database, we can set up a custom db context.
        // Actually, let's see: RankingService has custom queries using `db`.
        // Let's run RankingService calculations on this database!
        // To be extremely safe, since RankingService is already imported, we can temporarily override `headers` 
        // mock in getActiveDbName or let it run.
        // Wait! How does getActiveDbName determine which database is active?
        // It checks request headers. If we mock headers globally, we can control it!
        // But wait! Is there a cleaner way? Yes, we can just execute the RankingService.calculateSubjectRankings.
        // Let's look at what RankingService does internally. If it calls `db`, we can set a global variable 
        // to control getActiveDbName!
        // Let's look at `getActiveDbName` in `src/db/db.ts`:
        // It catches any error from calling `headers()`.
        // If we set a global variable `process.env.ACTIVE_DB_NAME`, and modify `getActiveDbName` to check it first,
        // we can dynamically switch the database used by the entire application (including `db` and `RankingService`)!
        // That is an ABSOLUTELY genius and extremely clean idea!
    }

    // 7. Dynamic Scale (Tertiary)
    const [existingScale] = await db.select().from(schema.gradingSystems).where(eq(schema.gradingSystems.name, "5.0 Scale Builder")).limit(1);
    if (!existingScale) {
        const [scaleRes] = await db.insert(schema.gradingSystems).values({
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
            await db.insert(schema.gradePoints).values({ gradingSystemId: scaleId, ...p, points: p.points.toString() });
        }
        await db.insert(schema.gradingSystemAssignments).values({ sessionId: session!.id, gradingSystemId: scaleId });
    }

    console.log("Academic Results Demo seeded successfully!");
}

async function seedTenant(dbName: string) {
    console.log(`\n==================================================`);
    console.log(`SEEDING TENANT DATABASE: ${dbName}`);
    console.log(`==================================================`);
    
    // Set environment variable to force the dynamic db resolver to route to this tenant
    process.env.CLI_DB_OVERRIDE = dbName;
    
    const parsedUrl = new URL(baseUri);
    parsedUrl.pathname = `/${dbName}`;
    
    const connection = await mysql.createConnection({ uri: parsedUrl.toString() });
    const dbInstance = drizzle(connection, { schema, mode: "default" });
    
    try {
        await seedDemoDataForDb(dbInstance);
        await seedResultsDemoForDb(dbInstance);
        
        // Also run RankingService calculations now that the override is set!
        console.log("Recalculating Subject Rankings via RankingService...");
        let [session] = await dbInstance.select().from(schema.academicSessions).where(eq(schema.academicSessions.isCurrent, true)).limit(1);
        if (session) {
            const math = (await dbInstance.select().from(schema.courses).where(eq(schema.courses.code, "MAT101")).limit(1))[0];
            const eng = (await dbInstance.select().from(schema.courses).where(eq(schema.courses.code, "ENG101")).limit(1))[0];
            
            if (math && eng) {
                for (const term of [1, 2, 3]) {
                    await RankingService.calculateSubjectRankings(math.id, session.id, term);
                    await RankingService.calculateSubjectRankings(eng.id, session.id, term);
                }
            }
            await RankingService.processAnnualResults(session.id, 1);
        }
        
        console.log(`SUCCESS: Tenant database ${dbName} successfully seeded!`);
    } catch (err) {
        console.error(`ERROR seeding database ${dbName}:`, err);
    } finally {
        await connection.end();
    }
}

async function main() {
    const tenants = ["portal_ajat_academy", "portal_citadel_uni", "school_portal"];
    for (const tenant of tenants) {
        await seedTenant(tenant);
    }
    console.log("\nAll tenants have been successfully seeded!");
}

main().catch(err => {
    console.error("Main execution failed:", err);
    process.exit(1);
});
