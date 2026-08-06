import { db } from "../src/db/db";
import { users, students, admissionApplicationsV2 } from "../src/db/schema";
import { like, or } from "drizzle-orm";
import { eq } from "drizzle-orm";

async function run() {
    console.log("Searching for FATHIA ABIDEMI KAREEM...");
    
    const matchedUsers = await db.select({
        userId: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status
    }).from(users)
    .where(
        or(
            like(users.name, "%FATHIA%"),
            like(users.name, "%KAREEM%")
        )
    );
    
    for (const u of matchedUsers) {
        if (u.name.toLowerCase().includes("fathia") && u.name.toLowerCase().includes("kareem")) {
            console.log("\nFound User:", u);
            
            const studentDetails = await db.select().from(students).where(eq(students.userId, u.userId));
            console.log("Student Details:", studentDetails.length > 0 ? studentDetails[0] : "None");
            
            const apps = await db.select().from(admissionApplicationsV2).where(eq(admissionApplicationsV2.applicantId, u.userId));
            console.log("Applications:", apps.length > 0 ? apps : "None");
        }
    }
    
    process.exit(0);
}

run().catch(console.error);
