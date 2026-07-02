import { db } from "@/db/db";
import { crmLeads, students, users, institutionalUnits } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { StudentService } from "./StudentService";

export class AdmissionService {

    /**
     * Retrieves a list of qualified applicants for admission.
     */
    static async getApplicants(unitId: number) {
        return await db.select()
            .from(crmLeads)
            .where(and(
                eq(crmLeads.unitId, unitId),
                eq(crmLeads.status, 'qualified')
            ));
    }

    /**
     * Approves an applicant and converts them to a student record.
     * Matches 'Admission' logic from Rust.
     */
    static async approveAdmission(leadId: number, sessionName: string) {
        const [lead] = await db.select().from(crmLeads).where(eq(crmLeads.id, leadId)).limit(1);
        if (!lead) throw new Error("Applicant not found");

        const studentData = {
            name: lead.name,
            firstName: lead.name.split(' ')[0],
            surname: lead.name.split(' ').slice(1).join(' '),
            admissionNumber: `ADM/${new Date().getFullYear()}/${leadId.toString().padStart(4, '0')}`,
            unitId: lead.unitId,
            branchId: lead.unitId,
            level: 100 // Default entry level
        };

        const result = await StudentService.createStudent(studentData, 1);

        // Update Lead status to converted
        await db.update(crmLeads).set({ status: 'converted' }).where(eq(crmLeads.id, leadId));

        return {
            success: true,
            studentId: result.studentId,
            admissionNumber: result.admissionNumber
        };
    }

    /**
     * Retrieves global institutional metadata for the admission process.
     * Matches 'Admission::metadata(options)' from Rust.
     */
    static async getAdmissionMetadata(options: { branchId?: number, sessionId?: number, scope?: string }) {
        const templates = await db.select().from(admissionFormTemplates);
        
        return {
            templates: templates.map(t => ({
                id: t.id,
                name: t.name,
                level: t.level,
                isActive: t.isActive
            })),
            scope: options.scope || "Institutional",
            session: options.sessionId || "Current"
        };
    }
}
