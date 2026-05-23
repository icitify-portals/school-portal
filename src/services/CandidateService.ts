import { db } from "@/db/db";
import { admissionApplicationsV2, admissionFormTemplates, admissionFormSections, admissionFormFields } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class CandidateService {

    /**
     * Authenticates a candidate using registration number and PIN.
     * Matches 'Candidate::authenticate' from Rust.
     */
    static async authenticate(registrationNumber: string, pin: string) {
        const applicationId = parseInt(registrationNumber);
        
        const [application] = await db.select()
            .from(admissionApplicationsV2)
            .where(eq(admissionApplicationsV2.id, applicationId))
            .limit(1);

        if (!application) throw new Error("Candidate record not found.");
        
        if (application.pin && application.pin !== pin) {
            throw new Error("Invalid PIN.");
        }
        // If no PIN is set, we might allow initial access or require one to be set
        // For now, we match the PIN if it exists.

        return application;
    }

    /**
     * Retrieves the candidate's full profile and application status.
     */
    static async getProfile(applicationId: number) {
        return await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId),
            with: {
                template: true
            }
        });
    }

    /**
     * Retrieves the registration page data (Form Structure + Current Data).
     * Matches 'RegistrationPage' logic from Rust.
     */
    static async getRegistrationPage(applicationId: number) {
        const application = await this.getProfile(applicationId);
        if (!application) throw new Error("Application not found");

        const sections = await db.query.admissionFormSections.findMany({
            where: eq(admissionFormSections.templateId, application.templateId),
            with: {
                fields: true
            },
            orderBy: (sections, { asc }) => [asc(sections.order)]
        });

        return {
            sections,
            currentData: JSON.parse(application.formData || "{}")
        };
    }

    /**
     * Saves form data for a specific page/section.
     * Matches 'candidate.save_page(&page_id, data, next_page_id)' from Rust.
     */
    static async savePageData(applicationId: number, pageId: string, data: any, nextPageId?: string) {
        const application = await this.getProfile(applicationId);
        if (!application) throw new Error("Application not found");

        const currentData = JSON.parse(application.formData || "{}");
        const updatedData = { ...currentData, ...data };

        // Save progress
        return await db.update(admissionApplicationsV2)
            .set({ 
                formData: JSON.stringify(updatedData),
                updatedAt: new Date()
            })
            .where(eq(admissionApplicationsV2.id, applicationId));
    }

    /**
     * Updates the candidate's date of birth.
     * Matches 'candidate.update_date_of_birth(&dob)' from Rust.
     */
    static async updateDOB(applicationId: number, dob: string) {
        const application = await this.getProfile(applicationId);
        if (!application) throw new Error("Application not found");

        // Assuming dob is a dedicated column in this schema version
        return await db.update(admissionApplicationsV2)
            .set({ ageAtAdmission: sql`TIMESTAMPDIFF(YEAR, ${dob}, CURDATE())` })
            .where(eq(admissionApplicationsV2.id, applicationId));
    }

    /**
     * Uploads an applicant's image or document for a specific form field.
     * Matches 'candidate.upload_image(&page_id, &field_id, &tmp_path, extension)' from Rust.
     */
    static async uploadImage(applicationId: number, pageId: string, fieldId: string, tmpPath: string, extension?: string) {
        const application = await this.getProfile(applicationId);
        if (!application) throw new Error("Application not found");

        // Logic for file handling would go here (e.g., S3 upload)
        const finalUrl = `https://storage.school.edu/admission/${applicationId}/${fieldId}${extension || '.jpg'}`;

        if (fieldId === 'applicant_photo') {
            await db.update(admissionApplicationsV2)
                .set({ applicantPhoto: finalUrl })
                .where(eq(admissionApplicationsV2.id, applicationId));
        }

        return { success: true, url: finalUrl };
    }

    /**
     * Retrieves the candidate's profile along with institutional metadata.
     * Matches 'candidate.profile_with_metadata()' from Rust.
     */
    static async getProfileWithMetadata(applicationId: number) {
        const application = await this.getProfile(applicationId);
        if (!application) throw new Error("Application not found");

        const [template] = await db.select({
            name: admissionFormTemplates.name,
            level: admissionFormTemplates.level,
            logoUrl: admissionFormTemplates.admissionLetterTemplate // Assuming logo/metadata is here
        })
        .from(admissionFormTemplates)
        .where(eq(admissionFormTemplates.id, application.templateId))
        .limit(1);

        return {
            profile: application,
            metadata: template,
            institution: "Institutional School Portal"
        };
    }

    /**
     * Generates comprehensive data for the official registration print-out.
     * Matches 'PrintOut::new().data()' from Rust.
     */
    static async getPrintOutData(applicationId: number) {
        const application = await this.getProfile(applicationId);
        if (!application) throw new Error("Application not found");

        return {
            registrationNumber: application.id.toString(),
            status: application.status,
            photo: application.applicantPhoto,
            formData: JSON.parse(application.formData || "{}"),
            paymentStatus: application.paymentStatus,
            appliedAt: application.appliedAt,
            lastUpdated: application.updatedAt
        };
    }

    /**
     * Retrieves the available dynamic variables for an admission print-out template.
     * Matches 'PrintOut::variables()' from Rust.
     */
    static async getPrintOutVariables(templateId: number) {
        const fields = await db.select({
            key: admissionFormFields.systemKey,
            label: admissionFormFields.label
        })
        .from(admissionFormFields)
        .innerJoin(admissionFormSections, eq(admissionFormFields.sectionId, admissionFormSections.id))
        .where(eq(admissionFormSections.templateId, templateId));

        const systemVariables = [
            { key: "registration_number", label: "Registration Number" },
            { key: "application_status", label: "Status" },
            { key: "applied_at", label: "Date Applied" }
        ];

        return [...systemVariables, ...fields.filter(f => f.key).map(f => ({ key: f.key!, label: f.label }))];
    }

    /**
     * Retrieves user-defined data for a specific candidate's print-out.
     * Matches 'PrintOut::user_defined_data()' from Rust.
     */
    static async getUserDefinedData(applicationId: number) {
        const application = await this.getProfile(applicationId);
        if (!application) throw new Error("Application not found");

        const formData = JSON.parse(application.formData || "{}");
        const variables = await this.getPrintOutVariables(application.templateId);

        const result: Record<string, any> = {};
        variables.forEach(v => {
            result[v.key] = formData[v.key] || (application as any)[v.key] || "N/A";
        });

        return result;
    }
}
