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
        const isPartTime = formTemplate.studyMode?.toLowerCase().includes('part-time') || student.studyMode?.toLowerCase().includes('part-time');
        const isHND = formTemplate.name?.toUpperCase().includes('HND');
        
        let targetTemplateName = 'Admission Letter - Full-Time ND';
        if (isPartTime && isHND) targetTemplateName = 'Admission Letter - Daily Part-Time HND';
        else if (isPartTime && !isHND) targetTemplateName = 'Admission Letter - Daily Part-Time ND';
        else if (!isPartTime && isHND) targetTemplateName = 'Admission Letter - Full-Time HND';
        else targetTemplateName = 'Admission Letter - Full-Time ND';

        const template = await db.select()
            .from(documentTemplates)
            .where(and(
                eq(documentTemplates.type, 'admission_letter'),
                eq(documentTemplates.name, targetTemplateName),
                eq(documentTemplates.isActive, true)
            ))
            .limit(1);

        // Fallback for legacy
        if (!template[0]) {
            const fallbackTemplate = await db.select()
                .from(documentTemplates)
                .where(and(
                    eq(documentTemplates.type, 'admission_letter'),
                    eq(documentTemplates.level, unit.academicTier === 'tertiary' ? 'tertiary' : 'secondary'),
                    eq(documentTemplates.isActive, true)
                ))
                .limit(1);
            if (fallbackTemplate[0]) {
                template[0] = fallbackTemplate[0];
            } else {
                throw new Error(`No active admission letter template found for ${targetTemplateName}.`);
            }
        }

        // 3. Inject Placeholders
        const academicNumberLabel = unit.academicTier === 'tertiary' ? 'Matriculation Number' : 'Admission Number';
        const admissionYearString = student.admissionYear?.toString() || new Date().getFullYear().toString();
        const academicSession = `${admissionYearString}/${parseInt(admissionYearString) + 1}`;

        // Ref No logic
        const serialStr = application[0].admission_applications_v2.id.toString().padStart(3, '0');
        const shortYear = admissionYearString.slice(-2);
        const shortNextYear = (parseInt(admissionYearString) + 1).toString().slice(-2);
        const yearRef = `${shortYear}-${shortNextYear}`;

        let refNo = `FSS/IB/ND/ADM/${yearRef}/${serialStr}`;
        if (isPartTime && isHND) refNo = `FSS/IB/DPPHND/ADM/${yearRef}/${serialStr}`;
        else if (isPartTime && !isHND) refNo = `FSS/IB/DPPND/ADM/${yearRef}/${serialStr}`;
        else if (!isPartTime && isHND) refNo = `FSS/IB/HND/ADM/${yearRef}/${serialStr}`;

        const acceptanceFee = isHND ? '25,000:00' : '35,000:00';
        const acceptanceFeeWords = isHND ? 'Twenty-five thousand naira' : 'Thirty-five thousand naira';
        
        let html = template[0].templateHtml;
        const replacements: Record<string, string> = {
            '{{candidate_name}}': candidate.name,
            '{{academic_number}}': student.matricNumber || 'PENDING',
            '{{academic_number_label}}': academicNumberLabel,
            '{{institution_name}}': unit.name,
            '{{date}}': new Date().toLocaleDateString(),
            '{{admission_year}}': admissionYearString,
            '{{academic_session}}': academicSession,
            // @ts-expect-error - TS2339: Auto-suppressed for build
            '{{study_mode}}': student.studyMode || 'Full-Time',
            '{{mode_of_entry}}': student.modeOfEntry || 'Direct',
            '{{programme_name}}': formTemplate.name,
            '{{department_name}}': formTemplate.name.replace(/^(ND|HND) /i, '').trim() || 'Business Administration and Management',
            '{{jamb_reg_no}}': student.jambNumber || 'N/A',
            '{{ref_no}}': refNo,
            '{{resumption_date}}': '7th October, 2024',
            '{{lecture_start_date}}': '14th October, 2024',
            '{{acceptance_fee}}': acceptanceFee,
            '{{acceptance_fee_words}}': acceptanceFeeWords
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
