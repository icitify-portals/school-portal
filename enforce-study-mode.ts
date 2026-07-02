import { db } from "./src/db/index.js";
import { students } from "./src/db/schema.js";
import { inArray, notInArray } from "drizzle-orm";

async function main() {
    try {
        console.log("Enforcing study mode based on entry mode...");

        // JAMB entry modes: UTME, DE. These should be full-time.
        const jambModes = ["UTME", "DE", "JAMB"];
        
        await db.update(students)
            .set({ studyMode: "full-time" })
            .where(inArray(students.modeOfEntry, jambModes));

        await db.update(students)
            .set({ studyMode: "part-time" })
            .where(notInArray(students.modeOfEntry, jambModes));
            
        console.log("Study modes updated successfully.");

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
main();
