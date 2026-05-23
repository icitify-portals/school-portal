
import { db } from "./src/db/db";
import { jambCandidates, admissionApplications, academicSessions } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function fixAdelopo() {
    try {
        const userId = 104;
        const jambRegNo = "202610400001AA";
        const email = "aa.adelopo2@gmail.com";

        console.log(`Fixing admission profile for ${email} (User ID: ${userId})`);

        // 1. Create JAMB Candidate
        await db.insert(jambCandidates).values({
            jambRegNo,
            surname: "Adelopo",
            firstname: "Abiola",
            middlename: "A.",
            dob: "2000-01-01",
            email,
            phone: "08012345678",
            courseId: 1, // Dummy course
            facultyId: 1,
            deptId: 1,
            utmeSubjects: JSON.stringify(["Mathematics", "English", "Physics", "Chemistry"]),
            score: 250,
            isClaimed: true,
            claimedUserId: userId
        });
        console.log("Created JAMB candidate record.");

        // 2. Create Admission Application (Admitted)
        await db.insert(admissionApplications).values({
            jambRegNo,
            programmeId: 1,
            sessionId: 1, // 2023/2024 Session
            paymentStatus: 'paid',
            screeningScore: 85,
            status: 'admitted',
            appliedAt: new Date()
        });
        console.log("Created 'admitted' admission application.");

        console.log("Successfully fixed admission profile for Abiola Adelopo.");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

fixAdelopo();
