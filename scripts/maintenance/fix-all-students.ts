import { db } from './src/db/db';
import { users, students, jambCandidates, admissionApplications, admissionSessions } from './src/db/schema';
import { eq, and, notInArray, sql } from 'drizzle-orm';

async function run() {
    try {
        console.log("🛠️ Starting improved bulk student fix...");

        // 1. Ensure an admission session exists
        let [session] = await db.select().from(admissionSessions).where(eq(admissionSessions.isActive, true)).limit(1);
        if (!session) {
            console.log("Creating default admission session...");
            const now = new Date();
            const nextYear = new Date();
            nextYear.setFullYear(now.getFullYear() + 1);

            const [inserted] = await db.insert(admissionSessions).values({
                name: "2024/2025 Admissions",
                startDate: now,
                endDate: nextYear,
                isActive: true,
                applicationFee: "5000.00",
                screeningMode: "CBT"
            });

            // Re-fetch to get the full object (including ID)
            [session] = await db.select().from(admissionSessions).where(eq(admissionSessions.name, "2024/2025 Admissions")).limit(1);
        }
        console.log(`Using Admission Session: ${session.name} (ID: ${session.id})`);

        // 2. Get all claimed user IDs
        const claimed = await db.select({ id: jambCandidates.claimedUserId })
            .from(jambCandidates)
            .where(sql`${jambCandidates.claimedUserId} IS NOT NULL`);

        const claimedIds = claimed.map(c => c.id!).filter(Boolean);
        console.log(`Already claimed count: ${claimedIds.length}`);

        // 3. Find students who haven't claimed a profile
        let query = db.select({
            id: users.id,
            name: users.name,
            email: users.email
        })
            .from(users)
            .where(eq(users.role, 'student'));

        if (claimedIds.length > 0) {
            query = query.where(and(eq(users.role, 'student'), notInArray(users.id, claimedIds))) as any;
        }

        const toFix = await query;
        console.log(`Found ${toFix.length} students to fix.`);

        for (const user of toFix) {
            console.log(`Linking: ${user.email}`);

            // Get student profile to find their programme
            const [studentProfile] = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
            const programmeId = studentProfile?.programmeId || 1;

            const dummyRegNo = `REG-${Math.random().toString(36).substring(2, 8).toUpperCase()}${user.id}`;

            await db.transaction(async (tx) => {
                // Create JAMB record
                await tx.insert(jambCandidates).values({
                    jambRegNo: dummyRegNo,
                    surname: user.name?.split(' ').pop() || "Student",
                    firstname: user.name?.split(' ')[0] || "Demo",
                    dob: "2000-01-01",
                    score: 250,
                    courseId: programmeId,
                    isClaimed: true,
                    claimedUserId: user.id
                });

                // Create Admission Application
                await tx.insert(admissionApplications).values({
                    jambRegNo: dummyRegNo,
                    programmeId: programmeId,
                    status: 'admitted',
                    paymentStatus: 'paid',
                    sessionId: session.id,
                });
            });
        }

        console.log("✅ Bulk fix complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error during fix:", error);
        process.exit(1);
    }
}

run();
