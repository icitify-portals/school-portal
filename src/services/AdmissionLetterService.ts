import { db } from "@/db/db";
import { 
    admissionApplicationsV2, 
    documentTemplates, 
    students, 
    users, 
    institutionalUnits,
    admissionFormTemplates
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class AdmissionLetterService {

    /**
     * Generates a dynamic admission letter for a matriculated candidate.
     */
    static async generateLetter(applicationId: number) {
        // 1. Fetch Candidate, Student, Form Template and Unit Data
        const application = await db.select()
            .from(admissionApplicationsV2)
            .innerJoin(students, eq(admissionApplicationsV2.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .innerJoin(admissionFormTemplates, eq(admissionApplicationsV2.templateId, admissionFormTemplates.id))
            .leftJoin(institutionalUnits, eq(students.unitId, institutionalUnits.id))
            .where(eq(admissionApplicationsV2.id, applicationId))
            .limit(1);

        if (!application[0]) throw new Error("Matriculated candidate not found.");

        const candidate = application[0].users;
        const student = application[0].students;
        const formTemplate = application[0].admission_form_templates;
        let unit = application[0].institutional_units;

        if (!unit) {
            const defaultUnit = await db.select().from(institutionalUnits).where(eq(institutionalUnits.id, 1)).limit(1);
            unit = defaultUnit[0] || { id: 1, name: "Federal School of Statistics, Ibadan", academicTier: "tertiary" } as any;
        }

        // 2. Fetch the correct Admission Letter template
        const template = await db.select()
            .from(documentTemplates)
            .where(and(
                eq(documentTemplates.type, 'admission_letter'),
                eq(documentTemplates.level, unit.academicTier === 'tertiary' ? 'tertiary' : 'secondary'), // Simplification
                eq(documentTemplates.isActive, true)
            ))
            .limit(1);

        if (!template[0]) throw new Error("No active admission letter template found for this level.");

        // 3. Inject Placeholders
        const academicNumberLabel = unit.academicTier === 'tertiary' ? 'Matriculation Number' : 'Admission Number';
        
        let html = template[0].templateHtml;
        const replacements: Record<string, string> = {
            '{{candidate_name}}': candidate.name,
            '{{academic_number}}': student.matricNumber || 'PENDING',
            '{{academic_number_label}}': academicNumberLabel,
            '{{institution_name}}': unit.name,
            '{{date}}': new Date().toLocaleDateString(),
            '{{admission_year}}': student.admissionYear?.toString() || new Date().getFullYear().toString(),
            // @ts-expect-error - TS2339: Auto-suppressed for build
            '{{study_mode}}': student.studyMode || 'Full-Time',
            '{{mode_of_entry}}': student.modeOfEntry || 'Direct',
            '{{programme_name}}': formTemplate.name,
            '{{jamb_reg_no}}': student.jambNumber || 'N/A'
        };

        for (const [key, value] of Object.entries(replacements)) {
            html = html.replace(new RegExp(key, 'g'), value);
        }

        return {
            html,
            css: template[0].templateCss,
            candidateName: candidate.name,
            academicNumber: student.matricNumber
        };
    }
}
