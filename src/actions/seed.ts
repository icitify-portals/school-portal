"use server";

import { db } from "@/db/db";
import {
    chartOfAccounts,
    vendors,
    budgets,
    feeItems,
    fixedAssets,
    bursarySettings,
    expenditureRequests,
    generalLedger,
    faculties,
    departments,
    users
} from "@/db/schema";
import { v4 as uuidv4 } from "uuid";

export async function seedBursaryData() {
    console.log("Starting Institutional Seeding...");

    // 1. Chart of Accounts (Essential Infrastructure)
    const coaSeeds = [
        { code: "1000", name: "Assets", category: "asset" as const },
        { code: "1100", name: "Cash & Bank", category: "asset" as const },
        { code: "1200", name: "Institutional Vehicles", category: "asset" as const },
        { code: "1201", name: "Accumulated Depreciation - Vehicles", category: "asset" as const },
        { code: "2000", name: "Liabilities", category: "liability" as const },
        { code: "2100", name: "Accounts Payable", category: "liability" as const },
        { code: "3000", name: "Equity", category: "equity" as const },
        { code: "3100", name: "Retained Earnings", category: "equity" as const },
        { code: "4000", name: "Revenue", category: "revenue" as const },
        { code: "4100", name: "Tuition Fees", category: "revenue" as const },
        { code: "5000", name: "Expenses", category: "expense" as const },
        { code: "5100", name: "Maintenance & Repairs", category: "expense" as const },
        { code: "5200", name: "Depreciation Expense", category: "expense" as const },
    ];

    for (const coa of coaSeeds) {
        await db.insert(chartOfAccounts).values(coa).onDuplicateKeyUpdate({ set: { name: coa.name } });
    }
    const coaList = await db.select().from(chartOfAccounts);
    const getCoaId = (code: string) => coaList.find(c => c.code === code)?.id;

    // 2. Vendors (AP)
    const vendorSeeds = [
        { name: "Globacom Limited", contactPerson: "Mike Adenuga", email: "support@glo.com", category: "Utilities" },
        { name: "Julius Berger", contactPerson: "Engr. Ben", email: "logistics@jb.com", category: "Construction" },
        { name: "Office Depot", contactPerson: "Sarah", email: "sales@officedepot.com", category: "Supplies" },
    ];
    for (const v of vendorSeeds) {
        await db.insert(vendors).values(v);
    }

    // 3. Budgets
    const dept = (await db.select().from(departments).limit(1))[0];

    if (dept) {
        await db.insert(budgets).values({
            departmentId: dept.id,
            academicYear: "2025/2026",
            category: 'operating',
            amount: "5000000.00",
            status: 'active'
        });
    }

    // 4. Fixed Assets
    await db.insert(fixedAssets).values({
        name: "Institutional Bus (Toyota Hiace)",
        purchaseDate: new Date("2025-06-15"),
        purchasePrice: "35000000.00",
        salvageValue: "5000000.00",
        usefulLifeYears: 8,
        glAccountId: getCoaId("1200"),
        depAccountId: getCoaId("5200"),
        accumDepAccountId: getCoaId("1201"),
        status: 'active'
    });

    // 5. Sample Financial Activity (General Ledger)
    const batchId = uuidv4();
    await db.insert(generalLedger).values([
        { accountId: getCoaId("1100")!, description: "Opening Balance - Bank", debit: "10000000.00", credit: "0.00", batchId, recordedBy: 1 },
        { accountId: getCoaId("3100")!, description: "Opening Balance - Equity", debit: "0.00", credit: "10000000.00", batchId, recordedBy: 1 },
    ]);

    // 6. Settings (Enable AI Modules)
    const settings = [
        { key: "module_fraud_enabled", value: "enabled" },
        { key: "module_forecasting_enabled", value: "enabled" },
        { key: "module_assets_enabled", value: "enabled" },
        { key: "ai_model", value: "gemini-1.5-pro" }
    ];
    for (const s of settings) {
        await db.insert(bursarySettings).values(s).onDuplicateKeyUpdate({ set: { value: s.value } });
    }

    console.log("Institutional Seeding Completed Successfully.");
    return { success: true };
}
