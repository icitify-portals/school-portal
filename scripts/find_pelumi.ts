import { db } from "../src/db/db";
import { users, students, admissionApplicationsV2 } from "../src/db/schema";
import { like, or } from "drizzle-orm";
import { eq } from "drizzle-orm";

async function run() {
    console.log("Searching for PELUMI ODUNAYO OYEDEJI...");
    
    const matchedUsers = await db.select({
        userId: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status
    }).from(users)
    .where(
        or(
            like(users.name, "%PELUMI%"),
            like(users.name, "%OYEDEJI%")
        )
    );
    
    let found = false;
    for (const u of matchedUsers) {
        if (u.name.toLowerCase().includes("pelumi") && u.name.toLowerCase().includes("oyedeji")) {
            found = true;
            console.log("\nFound User:", u);
            
            const studentDetails = await db.select().from(students).where(eq(students.userId, u.userId));
            console.log("Student Details:", studentDetails.length > 0 ? studentDetails[0] : "None");
            
            const apps = await db.select().from(admissionApplicationsV2).where(eq(admissionApplicationsV2.applicantId, u.userId));
            console.log("Applications:", apps.length > 0 ? apps : "None");
        }
    }
    
    if (!found) {
        console.log("No exact match found for both PELUMI and OYEDEJI. Listing all partial matches:");
        for (const u of matchedUsers) {
            console.log(u.name, " | ", u.email, " | ", u.role);
        }
    }
    
    process.exit(0);
}

run().catch(console.error);
