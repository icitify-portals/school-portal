import { db } from './src/db/db';
import { hostels, hostelBlocks, hostelRooms, hostelSettings } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function seed() {
    console.log("🛠️ Seeding Hostels...");

    try {
        // 1. Create a Male Hostel
        console.log("Creating Male Hostel...");
        const [maleHostelResult] = await db.insert(hostels).values({
            name: "Nelson Mandela Hall",
            code: "NMH-01",
            type: 'male',
            capacity: 40,
            description: "Premium male residence with modern facilities."
        });
        const maleHostelId = maleHostelResult.insertId;

        // 2. Create a Female Hostel
        console.log("Creating Female Hostel...");
        const [femaleHostelResult] = await db.insert(hostels).values({
            name: "Moremi Hall",
            code: "MOR-01",
            type: 'female',
            capacity: 40,
            description: "Secure and comfortable female residence."
        });
        const femaleHostelId = femaleHostelResult.insertId;

        // 3. Add Settings
        console.log("Adding Settings...");
        await db.insert(hostelSettings).values([
            { hostelId: maleHostelId, paymentWindowDays: 3, allocationStrategy: 'manual' },
            { hostelId: femaleHostelId, paymentWindowDays: 5, allocationStrategy: 'manual' }
        ]);

        // 4. Add Blocks and Rooms for NMH
        console.log("Adding Blocks for NMH...");
        const [blockAResult] = await db.insert(hostelBlocks).values({
            hostelId: maleHostelId,
            name: "Block A",
            floorCount: 2
        });
        const blockA = blockAResult.insertId;

        const rooms = [];
        for (let i = 1; i <= 10; i++) {
            rooms.push({
                blockId: blockA,
                roomNumber: `A${100 + i}`,
                capacity: 4,
                occupiedCount: 0,
                gender: 'male' as const,
                price: '25000.00'
            });
        }
        await db.insert(hostelRooms).values(rooms);

        // 5. Add Blocks and Rooms for Moremi
        console.log("Adding Blocks for Moremi...");
        const [blockBResult] = await db.insert(hostelBlocks).values({
            hostelId: femaleHostelId,
            name: "Block 1",
            floorCount: 2
        });
        const blockB = blockBResult.insertId;

        const femaleRooms = [];
        for (let i = 1; i <= 10; i++) {
            femaleRooms.push({
                blockId: blockB,
                roomNumber: `R${200 + i}`,
                capacity: 4,
                occupiedCount: 0,
                gender: 'female' as const,
                price: '30000.00'
            });
        }
        await db.insert(hostelRooms).values(femaleRooms);

        console.log("✅ Hostel Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seed();
