import { db } from "../src/db/db";
import { users, students, staffProfiles } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function verifyAccounts() {
    console.log("🔍 Verifying test accounts...\n");
    
    const testEmails = [
        "admin@test.edu",
        "student@test.edu", 
        "lecturer@test.edu"
    ];
    
    for (const email of testEmails) {
        console.log(`Checking: ${email}`);
        
        const userResult = await db
            .select({ id: users.id, email: users.email, password: users.password, role: users.role, status: users.status })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        
        if (userResult.length === 0) {
            console.log(`  ❌ User not found!\n`);
            continue;
        }
        
        const user = userResult[0];
        console.log(`  ✅ User found (ID: ${user.id}, Role: ${user.role}, Status: ${user.status})`);
        
        if (!user.password) {
            console.log(`  ❌ No password set!\n`);
            continue;
        }
        
        // Test password comparison
        const testPassword = "Test@123";
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(`  🔐 Password hash: ${user.password.substring(0, 20)}...`);
        console.log(`  🔐 Password test: ${isValid ? "✅ VALID" : "❌ INVALID"}\n`);
    }
    
    process.exit(0);
}

verifyAccounts().catch(console.error);
