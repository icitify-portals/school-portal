import { db } from "./src/db/db";
import { 
    feeItems, 
    feeStructures, 
    feeStructureItems, 
    feeAllocations,
    programmes,
    academicSessions
} from "./src/db/schema";
import { eq, like, or } from "drizzle-orm";

async function run() {
    console.log("Seeding 2026/2027 Tuition Fees...");

    // 1. Ensure Tuition Fee Item exists
    let [tuitionItem] = await db.select().from(feeItems).where(like(feeItems.name, "%Tuition%")).limit(1);
    if (!tuitionItem) {
        console.log("Creating Tuition fee item...");
        const [res] = await db.insert(feeItems).values({
            name: "Tuition Fee",
            description: "Standard Tuition Fee",
            defaultAmount: "0.00",
            category: "tuition",
            recurrence: "per_session",
            isRequired: true
        });
        const [newT] = await db.select().from(feeItems).where(eq(feeItems.id, res.insertId)).limit(1);
        tuitionItem = newT;
    }

    // 2. Find 2026/2027 Session
    let [session] = await db.select().from(academicSessions).where(eq(academicSessions.name, "2026/2027")).limit(1);
    if (!session) {
        console.log("2026/2027 Session not found! Creating it...");
        const [res] = await db.insert(academicSessions).values({
            name: "2026/2027",
            startDate: new Date("2026-10-01"),
            endDate: new Date("2027-09-30"),
            isCurrent: false,
            isActive: false,
            status: "planned"
        });
        const [newS] = await db.select().from(academicSessions).where(eq(academicSessions.id, res.insertId)).limit(1);
        session = newS;
    }

    const feesData = [
        { code: "BAM", label: "Business Administration", levels: [{l:1, a:58500, tg:'1'}, {l:2, a:56500, tg:'2'}, {l:1, a:68500, tg:'3,HND 1'}, {l:2, a:60500, tg:'4,HND 2'}] },
        { code: "COM", label: "Computer Science", levels: [{l:1, a:60500, tg:'1'}, {l:2, a:58500, tg:'2'}, {l:1, a:70500, tg:'3,HND 1'}, {l:2, a:63500, tg:'4,HND 2'}] },
        { code: "ACC", label: "Account", levels: [{l:1, a:58500, tg:'1'}, {l:2, a:56500, tg:'2'}, {l:1, a:68500, tg:'3,HND 1'}, {l:2, a:60500, tg:'4,HND 2'}] },
        { code: "STAT", label: "Stat", levels: [{l:1, a:60500, tg:'1'}, {l:2, a:58500, tg:'2'}, {l:1, a:70500, tg:'3,HND 1'}, {l:2, a:63500, tg:'4,HND 2'}] }
    ];

    for (const progData of feesData) {
        // Find programme
        const [prog] = await db.select({ id: programmes.id, name: programmes.name, code: programmes.code }).from(programmes).where(
            or(
                like(programmes.name, `%${progData.label}%`),
                like(programmes.code, `%${progData.code}%`)
            )
        ).limit(1);

        if (!prog) {
            console.log(`Programme ${progData.code} not found, skipping...`);
            continue;
        }

        console.log(`Setting up fees for ${prog.name}...`);

        for (const lvl of progData.levels) {
            const structureName = `${prog.code} ${lvl.tg.includes('HND') ? 'HND' : 'ND'} Level ${lvl.l} - 2026/2027 Tuition`;
            
            const [fsRes] = await db.insert(feeStructures).values({
                name: structureName,
                academicYear: "2026/2027",
                level: lvl.l,
                targetGroups: lvl.tg,
                programmeId: prog.id,
                status: "approved"
            });

            await db.insert(feeStructureItems).values({
                feeStructureId: fsRes.insertId,
                feeItemId: tuitionItem.id,
                amount: lvl.a.toFixed(2),
                semester: "both"
            });

            await db.insert(feeAllocations).values({
                feeStructureId: fsRes.insertId,
                programmeId: prog.id,
                sessionId: session.id
            });
        }
    }

    console.log("Seeding complete!");
    process.exit(0);
}

run().catch(console.error);
