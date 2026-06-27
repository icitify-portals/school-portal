import { db } from "./src/db";
import { libraryResources, libraryDigitalAssets, libraryPhysicalCopies } from "./src/db/schema";

async function run() {
    try {
        const [res] = await db.insert(libraryResources).values({
            title: "Advanced Mathematics for Senior Secondary",
            authors: "Prof. O. Okon",
            publisher: "Moodle Press",
            format: "PDF",
            description: "A comprehensive guide to SS3 Mathematics based on WAEC curriculum.",
            type: "book",
            category: "Mathematics",
            totalCopies: 5,
            availableCopies: 5
        });

        const insertId = (res as any).insertId;

        await db.insert(libraryDigitalAssets).values({
            resourceId: insertId,
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileType: "pdf",
            fileSize: 1048576,
            isDownloadable: true
        });

        for(let i=0; i<5; i++) {
            await db.insert(libraryPhysicalCopies).values({
                resourceId: insertId,
                barcode: `MATH-${insertId}-${i}`,
                shelfLocation: "A-01",
                status: "available"
            });
        }
        console.log("Seeded book", insertId);
    } catch(e) {
        console.error("Error", e);
    }
    process.exit(0);
}
run();
