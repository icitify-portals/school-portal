"use server";

import { db } from "@/db/db";
import { loanTemplates } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function seedUniversityLoanTemplates() {
    try {
        const templates = [
            {
                name: "Vehicle Purchase Loan",
                description: "Subsidized credit facility for the acquisition of personal vehicles by permanent academic and non-academic staff.",
                category: 'vehicle' as const,
                interestRate: "3.50",
                minAmount: "500000.00",
                maxAmount: "15000000.00",
                repaymentPeriodMax: 48,
                fieldConfig: JSON.stringify([
                    { label: "Vehicle Make & Model", name: "vehicle_model", type: "text", required: true },
                    { label: "Vehicle Year", name: "vehicle_year", type: "number", required: true },
                    { label: "Dealership Name", name: "dealer_name", type: "text", required: true },
                    { label: "Proforma Invoice Number", name: "invoice_ref", type: "text", required: true }
                ])
            },
            {
                name: "Housing Support Loan",
                description: "Long-term financial assistance for house construction, renovation, or purchase of residential property.",
                category: 'housing' as const,
                interestRate: "2.50",
                minAmount: "1000000.00",
                maxAmount: "25000000.00",
                repaymentPeriodMax: 120,
                fieldConfig: JSON.stringify([
                    { label: "Property Address", name: "property_address", type: "textarea", required: true },
                    { label: "LGA / State", name: "location", type: "text", required: true },
                    { label: "Title Document Type (C of O, Deed, etc.)", name: "title_type", type: "text", required: true },
                    { label: "Estimated Completion Date", name: "completion_date", type: "date", required: false }
                ])
            },
            {
                name: "Salary Advance",
                description: "Short-term emergency funds for immediate personal needs, deductible from the next 1-6 months' salary.",
                category: 'personal' as const,
                interestRate: "0.00",
                minAmount: "50000.00",
                maxAmount: "500000.00",
                repaymentPeriodMax: 6,
                fieldConfig: JSON.stringify([
                    { label: "Reason for Advance", name: "reason", type: "textarea", required: true },
                    { label: "Next Pay Day", name: "next_payday", type: "date", required: true }
                ])
            },
            {
                name: "Academic Project Advance",
                description: "Operational funds released for the implementation of approved research projects, conferences, or office upgrades.",
                category: 'other' as const,
                interestRate: "0.00",
                minAmount: "100000.00",
                maxAmount: "2000000.00",
                repaymentPeriodMax: 3,
                fieldConfig: JSON.stringify([
                    { label: "Research/Project Title", name: "project_title", type: "text", required: true },
                    { label: "Grant/Budget Code", name: "budget_code", type: "text", required: true },
                    { label: "Travel Required?", name: "travel_needed", type: "text", required: true },
                    { label: "Proposed Retirement Date", name: "retirement_date", type: "date", required: true }
                ])
            }
        ];

        for (const template of templates) {
            await db.insert(loanTemplates).values(template).onDuplicateKeyUpdate({ set: template });
        }

        revalidatePath("/staff/loans/apply");
        return { success: true, message: "Standard University Loan Templates seeded successfully!" };
    } catch (error) {
        console.error("Seeding failed:", error);
        return { success: false, error: (error as Error).message };
    }
}
