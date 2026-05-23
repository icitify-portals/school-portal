import bcrypt from "bcryptjs";
import { db } from "./src/db/db.js";
import { users } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

async function seed() {
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    console.log("Seeding superadmin...");
    
    await db.insert(users).values({
        name: "Super Admin",
        email: "superadmin@demo.edu",
        password: hashedPassword,
        role: "superadmin",
        status: "active",
    }).onDuplicateKeyUpdate({
        set: { password: hashedPassword, role: "superadmin", status: "active" }
    });
    
    console.log("Done!");
    process.exit(0);
}

seed();
