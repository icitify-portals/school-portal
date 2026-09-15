import { db } from "../src/db/db";
import { students, users, admissionApplicationsV2, admissionFormTemplates, programmes } from "../src/db/schema";
import { eq, like, and } from "drizzle-orm";
import { generateMatricNumber } from "../src/actions/matriculation";

/**
 * Run this script in production to fix students who were wrongly given HND matric numbers
 * due to the template.level bug.
 * 
 * Usage: npx tsx scripts/fix_matric_bug.ts
 */
async function run() {
    try {
        console.log("Finding students with incorrect HND matric numbers who applied for ND...");
        
        // Find students who have an HND matric number but applied for an ND template
        const affectedStudents = await db.select({
            studentId: students.id,
            userId: students.userId,
            matricNumber: students.matricNumber,
            programmeId: students.programmeId,
            studyMode: students.studyMode,
            year: students.admissionYear,
            templateName: admissionFormTemplates.name,
            userName: users.name
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .innerJoin(admissionApplicationsV2, eq(admissionApplicationsV2.studentId, students.id))
        .innerJoin(admissionFormTemplates, eq(admissionApplicationsV2.templateId, admissionFormTemplates.id))
        .where(
            and(
                like(students.matricNumber, "%HND%"),
                like(admissionFormTemplates.name, "%ND%")
            )
        );

        console.log(`Found ${affectedStudents.length} affected student(s).`);

        for (const record of affectedStudents) {
            console.log(`\nFixing student ${record.studentId} - ${record.userName}`);
            console.log(`Current Matric: ${record.matricNumber} (Template: ${record.templateName})`);
            
            let deptId = undefined;
            if (record.programmeId) {
                const progRows = await db.select().from(programmes).where(eq(programmes.id, record.programmeId));
                deptId = progRows.length > 0 ? progRows[0].deptId || undefined : undefined;
            }

            const matricRes = await generateMatricNumber({
                year: record.year || new Date().getFullYear(),
                deptId: deptId,
                studyMode: record.studyMode || "full-time",
                programmeType: "ND" // Force correct ND generation
            });

            if (matricRes.success && matricRes.matricNumber) {
                console.log(`-> Generated correct ND matric number: ${matricRes.matricNumber}`);
                
                await db.update(students)
                    .set({ matricNumber: matricRes.matricNumber })
                    .where(eq(students.id, record.studentId));
                    
                console.log(`-> Student ${record.studentId} updated successfully.`);
            } else {
                console.error(`-> Failed to generate new matric number: ${matricRes.error}`);
            }
        }
        
        console.log("\nFix complete.");
        process.exit(0);
    } catch(e) {
        console.error("Error:", e);
        process.exit(1);
    }
}
run();
