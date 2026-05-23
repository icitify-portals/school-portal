
import { db } from "./src/db/db";
import { users, jambCandidates, students } from "./src/db/schema";
import { eq, or } from "drizzle-orm";

async function investigateStudent(email: string) {
    try {
        console.log(`Investigating student: ${email}`);

        // 1. Find User
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) {
            console.log("User not found in 'users' table.");
            process.exit(0);
        }
        console.log("User found:", JSON.stringify(user, null, 2));

        // 2. Find Student profile
        const [student] = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
        console.log("Student profile found:", JSON.stringify(student || "None", null, 2));

        // 3. Find JAMB Candidate linked to this user
        const linkedCandidate = await db.select().from(jambCandidates).where(eq(jambCandidates.claimedUserId, user.id)).limit(1);
        console.log("Linked JAMB Candidate:", JSON.stringify(linkedCandidate[0] || "None", null, 2));

        // 4. Look for potential matches in jambCandidates by name if not linked
        if (linkedCandidate.length === 0) {
            console.log("Looking for potential matches in jambCandidates...");
            // Split name into parts to search
            const nameParts = user.name.split(" ");
            const matches = await db.select().from(jambCandidates)
                .where(or(
                    ...nameParts.map(p => eq(jambCandidates.surname, p)),
                    ...nameParts.map(p => eq(jambCandidates.firstname, p))
                ))
                .limit(5);
            console.log("Potential matches in jambCandidates:", JSON.stringify(matches, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

investigateStudent("aa.adelopo2@gmail.com");
