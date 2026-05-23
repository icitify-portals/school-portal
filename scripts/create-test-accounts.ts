import { seedTestAccounts } from "../src/actions/seed-test-accounts.js";

console.log("🚀 Creating test accounts...");

seedTestAccounts()
    .then((result) => {
        if (result.success) {
            console.log("\n✅ Test accounts created successfully!\n");
            console.log("========================================");
            console.log("🔐 LOGIN CREDENTIALS");
            console.log("========================================\n");
            
            result.accounts?.forEach((account: any) => {
                console.log(`👤 ${account.role} Account:`);
                console.log(`   Email:    ${account.email}`);
                console.log(`   Password: ${account.password}`);
                if (account.matric) console.log(`   Matric:   ${account.matric}`);
                if (account.staffId) console.log(`   Staff ID: ${account.staffId}`);
                console.log();
            });
            
            console.log("========================================");
            console.log("📝 NOTES:");
            console.log("- All accounts use the same password: Test@123");
            console.log("- You can login at /login");
            console.log("- Admin can access /admin/dashboard");
            console.log("- Student can access /student/dashboard");
            console.log("- Lecturer can access /staff/dashboard");
            console.log("========================================");
            process.exit(0);
        } else {
            console.error("❌ Failed to create test accounts:", result.error);
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error("❌ Unexpected error:", error);
        process.exit(1);
    });
