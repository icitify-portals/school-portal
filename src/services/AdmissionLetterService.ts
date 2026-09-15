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

const NLNG_UNITS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const NLNG_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function nlngToWords(n: number): string {
    if (n === 0) return "zero";
    const groups: [number, string][] = [[1000000, "million"], [1000, "thousand"], [1, ""]];
    const parts: string[] = [];
    for (const [div, label] of groups) {
        const g = Math.floor(n / div);
        if (g > 0) {
            let text: string;
            if (g < 20) text = NLNG_UNITS[g];
            else if (g < 100) text = `${NLNG_TENS[Math.floor(g / 10)]}${g % 10 ? "-" + NLNG_UNITS[g % 10] : ""}`;
            else text = `${NLNG_UNITS[Math.floor(g / 100)]} hundred${g % 100 ? " and " + (g % 100 < 20 ? NLNG_UNITS[g % 100] : `${NLNG_TENS[Math.floor((g % 100) / 10)]}${(g % 100) % 10 ? "-" + NLNG_UNITS[(g % 100) % 10] : ""}`) : ""}`;
            parts.push(`${text}${label ? " " + label : ""}`);
            n %= div;
        }
    }
    return parts.join(" ");
}

export class AdmissionLetterService {

    /**
     * Generates a dynamic admission letter for a matriculated candidate.
     */
    static async generateLetter(applicationId: number) {
        // 1. Fetch Candidate, Student, Form Template and Unit Data
        const application = await db.select()
            .from(admissionApplicationsV2)
            .innerJoin(users, eq(admissionApplicationsV2.applicantId, users.id))
            .innerJoin(admissionFormTemplates, eq(admissionApplicationsV2.templateId, admissionFormTemplates.id))
            .leftJoin(students, eq(admissionApplicationsV2.studentId, students.id))
            .leftJoin(institutionalUnits, eq(students.unitId, institutionalUnits.id))
            .where(eq(admissionApplicationsV2.id, applicationId))
            .limit(1);

        if (!application[0]) throw new Error("Admitted candidate not found.");

        const candidate = application[0].users;
        const student = application[0].students || {} as any;
        const formTemplate = application[0].admission_form_templates;
        let unit = application[0].institutional_units;

        if (!unit) {
            const defaultUnit = await db.select().from(institutionalUnits).where(eq(institutionalUnits.id, 1)).limit(1);
            unit = defaultUnit[0] || { id: 1, name: "Federal School of Statistics, Ibadan", academicTier: "tertiary" } as any;
        }

        // 2. Fetch the correct Admission Letter template
        const appMode = application[0].admission_applications_v2.applicationMode;
        const isPartTime = formTemplate.studyMode?.toLowerCase().includes('part-time') || student.studyMode?.toLowerCase().includes('part-time') || appMode?.toLowerCase().includes('part-time');
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
        
        let refNo = `FSS/ADM/${admissionYearString}/${serialStr}`;
        if (student.matricNumber) {
            refNo = `FSS/ADM/${admissionYearString}/${student.matricNumber}`;
        }

        const acceptanceFeeAmount = Math.round(parseFloat(formTemplate.acceptanceFee || "0") || 0);
        const acceptanceFee = acceptanceFeeAmount.toLocaleString('en-NG');
        const acceptanceFeeWords = `${nlngToWords(acceptanceFeeAmount)} naira`;
        
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

        const applicantPhoto = application[0].admission_applications_v2.applicantPhoto;
        const applicantPhotoHtml = applicantPhoto ? `
            <div class="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 border-4 border-slate-200 shadow-sm overflow-hidden bg-slate-50">
                <img src="${applicantPhoto}" alt="Applicant Photo" class="w-full h-full object-cover" />
            </div>
        ` : '';

        const dateStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
        
        const enhancedHtml = `
            <div class="relative w-full min-h-full text-slate-900 bg-white px-8 py-10" style="-webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Times New Roman', Times, serif;">
                <!-- Header -->
                <div class="mb-4">
                    <div class="text-center mb-6">
                        <h1 class="text-3xl font-bold uppercase tracking-tight" style="color: #006600;">FEDERAL SCHOOL OF STATISTICS</h1>
                        <p class="text-base font-bold italic text-black">(National Bureau of Statistics)</p>
                    </div>
                    
                    <div class="flex justify-between items-start mb-6 relative">
                        <!-- Left Info -->
                        <div class="text-sm space-y-2 font-bold w-1/3 text-black">
                            <p>P. O. Box 20753, U. I. IBADAN</p>
                            <p>Email: <span class="font-normal">info@fssibadan.edu.ng</span></p>
                            <p>Telephone: <span class="underline">07036516563</span></p>
                        </div>
                        
                        <!-- Center Logo -->
                        <div class="w-1/3 flex justify-center -mt-4">
                            <img src="/fss_logo.png" alt="School Logo" class="w-24 h-28 object-contain" />
                        </div>
                        
                        <!-- Right Info -->
                        <div class="text-sm space-y-3 font-bold w-1/3 text-right text-black">
                            <div class="flex justify-end items-center">
                                <span class="mr-2">Ref. No:</span>
                                <span class="border-b border-black flex-1 text-left inline-block pb-0.5">${refNo}</span>
                            </div>
                            <div class="flex justify-end items-center">
                                <span class="mr-2">Date:</span>
                                <span class="border-b border-black flex-1 text-left inline-block pb-0.5">${dateStr}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Applicant Info -->
                    <div class="text-sm font-bold uppercase space-y-2 italic mb-8 text-black">
                        <p>NAME: <span class="font-normal">${candidate.name}</span></p>
                        <p>DEPARTMENT: <span class="font-normal">${replacements['{{department_name}}']}</span></p>
                        <p>MATRICULATION NUMBER: <span class="font-normal">${student.matricNumber || 'PENDING'}</span></p>
                    </div>
                    
                    <div class="text-center font-bold italic uppercase mb-6 text-lg tracking-wide text-black">
                        OFFER OF PROVISIONAL ADMISSION
                    </div>
                </div>

                <!-- Body -->
                <div class="text-base leading-relaxed text-black italic text-justify" style="line-height: 1.6;">
                    <style>
                        .admission-body p { margin-bottom: 1rem; }
                        .admission-body ol { list-style-type: lower-roman; padding-left: 3rem; margin-bottom: 1.5rem; font-style: normal; font-weight: normal; }
                        .admission-body ol li { margin-bottom: 0.5rem; padding-left: 0.5rem; }
                        .admission-body .sign-off { margin-top: 2rem; margin-bottom: 3.5rem; font-style: italic; font-weight: normal; }
                        .admission-body .signature { font-weight: bold; font-style: normal; }
                        .admission-body b, .admission-body strong { color: #000; }
                    </style>
                    <div class="admission-body">
                        ${html}
                    </div>
                </div>
            </div>
        `;

        return {
            html: enhancedHtml,
            css: template[0].templateCss,
            candidateName: candidate.name,
            academicNumber: student.matricNumber
        };
    }
}
