"use server";

import { db } from "@/db/db";
import { 
    admissionFormTemplates, 
    admissionFormSections, 
    admissionFormFields,
    admissionEntranceExams,
    admissionExamSubjects
} from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function seedAdmissionTemplates() {
    try {
        // 1. PRIMARY SCHOOL TEMPLATE
        const [pRes] = await db.insert(admissionFormTemplates).values({
            name: "Primary One Entry 2024",
            level: 'primary',
            slug: 'primary-entry-2024',
            description: "Foundation for future leaders. Admission for pupils aged 4-6.",
            applicationFee: "5000",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            minAge: 4,
            isActive: true
        });
        const primaryId = pRes.insertId;

        // Sections for Primary
        const [pSec1] = await db.insert(admissionFormSections).values({ templateId: primaryId, title: "Biodata", order: 1 });
        const [pSec2] = await db.insert(admissionFormSections).values({ templateId: primaryId, title: "Health & Immunization", order: 2 });
        const pBioId = pSec1.insertId;
        const pHealthId = pSec2.insertId;

        await db.insert(admissionFormFields).values([
            { sectionId: pBioId, label: "First Name", type: "text", isRequired: true, isSystemField: true, systemKey: "firstName", order: 1 },
            { sectionId: pBioId, label: "Last Name", type: "text", isRequired: true, isSystemField: true, systemKey: "lastName", order: 2 },
            { sectionId: pBioId, label: "Date of Birth", type: "date", isRequired: true, isSystemField: true, systemKey: "dob", order: 3 },
            { sectionId: pHealthId, label: "Blood Group", type: "select", options: "A+, A-, B+, B-, AB+, AB-, O+, O-", isRequired: true, order: 1 },
            { sectionId: pHealthId, label: "Immunization History", type: "textarea", isRequired: true, order: 2 },
        ]);

        // 2. SECONDARY SCHOOL TEMPLATE
        const [sRes] = await db.insert(admissionFormTemplates).values({
            name: "JSS 1 Entrance Examination",
            level: 'secondary',
            slug: 'jss1-entrance-2024',
            description: "Transition to academic excellence. For students finishing primary school.",
            applicationFee: "7500",
            startDate: new Date(),
            endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            minAge: 10,
            isActive: true
        });
        const secondaryId = sRes.insertId;

        const [sSec1] = await db.insert(admissionFormSections).values({ templateId: secondaryId, title: "Candidate Details", order: 1 });
        const [sSec2] = await db.insert(admissionFormSections).values({ templateId: secondaryId, title: "Academic Background", order: 2 });
        const sBioId = sSec1.insertId;
        const sEduId = sSec2.insertId;

        await db.insert(admissionFormFields).values([
            { sectionId: sBioId, label: "Full Name", type: "text", isRequired: true, isSystemField: true, systemKey: "firstName", order: 1 },
            { sectionId: sBioId, label: "Email", type: "email", isRequired: true, order: 2 },
            { sectionId: sEduId, label: "Previous Primary School", type: "text", isRequired: true, order: 1 },
            { sectionId: sEduId, label: "Common Entrance Score", type: "number", isRequired: false, order: 2 },
        ]);

        // 3. TERTIARY (UNDERGRADUATE) TEMPLATE
        const [tRes] = await db.insert(admissionFormTemplates).values({
            name: "B.Sc. Computer Science Intake",
            level: 'tertiary',
            slug: 'undergrad-cs-2024',
            description: "Future-proof your career. Faculty of Science admission.",
            applicationFee: "15000",
            requireAcceptanceFee: true,
            acceptanceFee: "50000",
            startDate: new Date(),
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            minAge: 16,
            isActive: true
        });
        const tertiaryId = tRes.insertId;

        const [tSec1] = await db.insert(admissionFormSections).values({ templateId: tertiaryId, title: "Personal Data", order: 1 });
        const [tSec2] = await db.insert(admissionFormSections).values({ templateId: tertiaryId, title: "UTME/JAMB Details", order: 2 });
        const tBioId = tSec1.insertId;
        const tJambId = tSec2.insertId;

        await db.insert(admissionFormFields).values([
            { sectionId: tBioId, label: "First Name", type: "text", isRequired: true, isSystemField: true, systemKey: "firstName", order: 1 },
            { sectionId: tJambId, label: "JAMB Registration No", type: "text", isRequired: true, order: 1 },
            { sectionId: tJambId, label: "UTME Score", type: "number", isRequired: true, order: 2 },
            { sectionId: tJambId, label: "O-Level Results", type: "textarea", isRequired: true, order: 3 },
        ]);

        revalidatePath("/admission");
        return { success: true };
    } catch (error) {
        console.error("Seeding failed:", error);
        return { success: false, error: "Seeding failed" };
    }
}
