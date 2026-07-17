"use server";

import { db } from "@/db/db";
import { 
    admissionFormTemplates, 
    admissionFormSections, 
    admissionFormFields,
    admissionApplicationsV2,
    admissionEntranceExams,
    examinationBodies,
    applicantOLevelSittings,
    applicantOLevelSubjects,
    users,
    students,
    systemSettings,
    feeStructures,
    feeStructureItems,
    emailVerificationTokens
} from "@/db/schema";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import crypto from "crypto";
import { sendInAppNotification } from "./notifications";
import { checkDeveloperFeeStatus } from "./paystack-developer-subscription";
import { sendEmail } from "@/lib/mail";
import { generateFormNumber, generateFormHash } from "@/lib/form-number";
import { NotificationService } from "@/services/NotificationService";

const ADMIN_ROLES = ['admin', 'superadmin', 'icitify_dev', 'dvc', 'registrar', 'admission_officer'];

async function requireAdmin() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized: Please log in");
    if (!ADMIN_ROLES.includes(session.user.role as string)) {
        throw new Error("Forbidden: You do not have permission to perform this action");
    }
    return session;
}

async function requireApplicant() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized: Please log in");
    if (session.user.role !== 'applicant') {
        throw new Error("Forbidden: Only applicants can perform this action");
    }
    return session;
}

/**
 * Form Template Actions
 */

export async function getAdmissionTemplates() {
    try {
        return await db.query.admissionFormTemplates.findMany({
            where: eq(admissionFormTemplates.isActive, true),
            orderBy: [desc(admissionFormTemplates.createdAt)]
        });
    } catch (error) {
        console.error("[getAdmissionTemplates] Failed to fetch templates:", error);
        return [];
    }
}

export async function getFormTemplates() {
    await requireAdmin();
    try {
        return await db.query.admissionFormTemplates.findMany({
            orderBy: [desc(admissionFormTemplates.createdAt)]
        });
    } catch (error) {
        console.error("[getFormTemplates] Failed to fetch form templates:", error);
        return [];
    }
}

export async function getFormTemplate(id: number) {
    await requireAdmin();
    return getTemplateWithSections(id);
}

async function getTemplateWithSections(templateId: number) {
    try {
        const template = await db.query.admissionFormTemplates.findFirst({
            where: eq(admissionFormTemplates.id, templateId)
        });
        if (!template) return null;

        const sections = await db.query.admissionFormSections.findMany({
            where: eq(admissionFormSections.templateId, templateId),
            orderBy: [asc(admissionFormSections.order)]
        });

        const sectionIds = sections.map(s => s.id);
        const fields = sectionIds.length > 0
            ? await db.query.admissionFormFields.findMany({
                where: (f, { inArray }) => inArray(f.sectionId, sectionIds),
                orderBy: [asc(admissionFormFields.order)]
            })
            : [];

        return { ...template, sections: sections.map(s => ({ ...s, fields: fields.filter(f => f.sectionId === s.id) })) };
    } catch (error) {
        console.error("Failed to fetch template with sections:", error);
        return null;
    }
}

export async function saveFormTemplate(data: any) {
    await requireAdmin();
    try {
        const { id, name, level, slug, description, flowType, feeStructureId, applicationFee, lateFee, startDate, endDate, lateEndDate, minAge, isActive, ninVerificationConfig } = data;
        
        if (id) {
            await db.update(admissionFormTemplates)
                .set({ name, level, slug, description, flowType, feeStructureId, applicationFee, lateFee, startDate, endDate, lateEndDate, minAge, isActive, ninVerificationConfig })
                .where(eq(admissionFormTemplates.id, id));
            revalidatePath(`/admin/admission/forms/${id}`);
            return { success: true, id };
        } else {
            const [result] = await db.insert(admissionFormTemplates).values({
                name, level, slug, description, flowType, feeStructureId, applicationFee, lateFee, startDate, endDate, lateEndDate, minAge, isActive, ninVerificationConfig
            });
            revalidatePath("/admin/admission/forms");
            return { success: true, id: result.insertId };
        }
    } catch (error: any) {
        console.error("Failed to save form template:", error);
        const msg = error?.message || String(error);
        if (msg.includes("Duplicate") && msg.includes("slug")) {
            return { success: false, error: `A template with the slug "${slug}" already exists. Please use a different slug.` };
        }
        if (msg.includes("Duplicate") && msg.includes("name")) {
            return { success: false, error: `A template with the name "${name}" already exists.` };
        }
        return { success: false, error: msg };
    }
}

export async function deleteFormTemplate(id: number) {
    await requireAdmin();
    try {
        const sections = await db.select({ id: admissionFormSections.id })
            .from(admissionFormSections)
            .where(eq(admissionFormSections.templateId, id));
        const sectionIds = sections.map(s => s.id);
        if (sectionIds.length > 0) {
            await db.delete(admissionFormFields).where(inArray(admissionFormFields.sectionId, sectionIds));
        }
        await db.delete(admissionFormSections).where(eq(admissionFormSections.templateId, id));
        await db.delete(admissionFormTemplates).where(eq(admissionFormTemplates.id, id));
        revalidatePath("/admin/admission/forms");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete form template:", error);
        return { success: false, error: error?.message || "Failed to delete template" };
    }
}

export async function bulkDeleteFormTemplates(ids: number[]) {
    await requireAdmin();
    try {
        if (!ids.length) return { success: false, error: "No templates selected" };
        const sections = await db.select({ id: admissionFormSections.id })
            .from(admissionFormSections)
            .where(inArray(admissionFormSections.templateId, ids));
        const sectionIds = sections.map(s => s.id);
        if (sectionIds.length > 0) {
            await db.delete(admissionFormFields).where(inArray(admissionFormFields.sectionId, sectionIds));
        }
        await db.delete(admissionFormSections).where(inArray(admissionFormSections.templateId, ids));
        await db.delete(admissionFormTemplates).where(inArray(admissionFormTemplates.id, ids));
        revalidatePath("/admin/admission/forms");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to bulk delete form templates:", error);
        return { success: false, error: error?.message || "Failed to delete templates" };
    }
}

/**
 * Form Section Actions
 */

export async function saveFormSection(data: any) {
    await requireAdmin();
    try {
        const { id, templateId, title, order } = data;
        if (id) {
            await db.update(admissionFormSections)
                .set({ title, order })
                .where(eq(admissionFormSections.id, id));
        } else {
            await db.insert(admissionFormSections).values({
                templateId, title, order
            });
        }
        revalidatePath(`/admin/admission/forms/${templateId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to save form section:", error);
        return { success: false, error: "Failed to save section" };
    }
}

export async function deleteFormSection(id: number, templateId: number) {
    await requireAdmin();
    try {
        await db.delete(admissionFormSections).where(eq(admissionFormSections.id, id));
        revalidatePath(`/admin/admission/forms/${templateId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete form section:", error);
        return { success: false, error: "Failed to delete section" };
    }
}

/**
 * Form Field Actions
 */

export async function saveFormField(data: any) {
    await requireAdmin();
    try {
        const { id, sectionId, templateId, label, type, placeholder, options, isRequired, order, isSystemField, systemKey, helpText, defaultValue, validationRules, conditionalLogic, width } = data;
        if (id) {
            await db.update(admissionFormFields)
                .set({ label, type, placeholder, options, isRequired, order, isSystemField, systemKey, helpText, defaultValue, validationRules, conditionalLogic, width })
                .where(eq(admissionFormFields.id, id));
        } else {
            await db.insert(admissionFormFields).values({
                sectionId, label, type, placeholder, options, isRequired, order, isSystemField, systemKey, helpText, defaultValue, validationRules, conditionalLogic, width
            });
        }
        revalidatePath(`/admin/admission/forms/${templateId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to save form field:", error);
        return { success: false, error: "Failed to save field" };
    }
}

export async function deleteFormField(id: number, templateId: number) {
    await requireAdmin();
    try {
        await db.delete(admissionFormFields).where(eq(admissionFormFields.id, id));
        revalidatePath(`/admin/admission/forms/${templateId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete form field:", error);
        return { success: false, error: "Failed to delete field" };
    }
}

export async function updateFieldsOrder(fields: { id: number, order: number }[], templateId: number) {
    await requireAdmin();
    try {
        await db.transaction(async (tx) => {
            for (const field of fields) {
                await tx.update(admissionFormFields)
                    .set({ order: field.order })
                    .where(eq(admissionFormFields.id, field.id));
            }
        });
        revalidatePath(`/admin/admission/forms/${templateId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update fields order:", error);
        return { success: false, error: "Failed to update order" };
    }
}

/**
 * Public Application Actions
 */

export async function getPublicFormTemplate(slug: string) {
    try {
        const template = await db.query.admissionFormTemplates.findFirst({
            where: and(
                eq(admissionFormTemplates.slug, slug),
                eq(admissionFormTemplates.isActive, true)
            )
        });
        if (!template) return null;

        const sections = await db.query.admissionFormSections.findMany({
            where: eq(admissionFormSections.templateId, template.id),
            orderBy: [asc(admissionFormSections.order)]
        });

        const sectionIds = sections.map(s => s.id);
        const fields = sectionIds.length > 0
            ? await db.query.admissionFormFields.findMany({
                where: (f, { inArray }) => inArray(f.sectionId, sectionIds),
                orderBy: [asc(admissionFormFields.order)]
            })
            : [];

        return { ...template, sections: sections.map(s => ({ ...s, fields: fields.filter(f => f.sectionId === s.id) })) };
    } catch (error) {
        console.error("Failed to fetch public form template:", error);
        return null;
    }
}

export async function submitAdmissionApplication(data: any) {
    try {
        const { templateId, formData, applicantPhoto, ageAtAdmission } = data;
        
        // Check if template is still open
        const template = await db.query.admissionFormTemplates.findFirst({
            where: eq(admissionFormTemplates.id, templateId)
        });

        if (!template) return { success: false, error: "Form not found" };

        const now = new Date();
        const endDate = template.lateEndDate || template.endDate;
        if (now > endDate) {
            return { success: false, error: "Application period has closed" };
        }

        // Check age eligibility
        if (template.minAge && ageAtAdmission < template.minAge) {
            return { success: false, error: `You must be at least ${template.minAge} years old for this admission.` };
        }

        // Generate unique form number
        const formNumber = await generateFormNumber(template.level);

        // Generate security hash
        const applicantName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "Applicant";
        const dob = formData.dob || formData.dateOfBirth || "";
        const formHash = generateFormHash(formNumber, applicantName, dob, applicantPhoto || "");

        const [result] = await db.insert(admissionApplicationsV2).values({
            templateId,
            data: JSON.stringify(formData),
            applicantPhoto,
            ageAtAdmission,
            formNumber,
            formHash,
            status: 'submitted',
            paymentStatus: 'pending'
        });

        const applicantEmail = formData.email || "";
        if (applicantEmail) {
            const template = await db.query.admissionFormTemplates.findFirst({
                where: eq(admissionFormTemplates.id, templateId)
            });
            NotificationService.sendApplicationSubmittedByEmail(applicantEmail, {
                applicantName,
                formNumber,
                templateName: template?.name || "Admission Application"
            }).catch((err) => console.error("Failed to send submission email:", err));
        }

        return { success: true, applicationId: result.insertId, formNumber };
    } catch (error) {
        console.error("Failed to submit admission application:", error);
        return { success: false, error: "Failed to submit application" };
    }
}

export async function getAdmissionApplications(templateId?: number) {
    await requireAdmin();
    try {
        const query = db.query.admissionApplicationsV2.findMany({
            where: templateId ? eq(admissionApplicationsV2.templateId, templateId) : undefined,
            with: {
                template: true,
                student: true
            },
            orderBy: [desc(admissionApplicationsV2.appliedAt)]
        });
        return await query;
    } catch (error) {
        console.error("Failed to fetch admission applications:", error);
        return [];
    }
}

export async function confirmAdmissionPayment(applicationId: number, reference: string) {
    await requireAdmin();
    try {
        const application = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId),
            with: { template: true }
        });

        await db.update(admissionApplicationsV2)
            .set({ 
                paymentStatus: 'paid', 
                status: 'paid',
                paymentReference: reference 
            })
            .where(eq(admissionApplicationsV2.id, applicationId));
        
        if (application) {
            const formData = typeof application.data === 'string' ? JSON.parse(application.data || '{}') : (application.data || {});
            const applicantEmail = formData.email || "";
            const applicantName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "Applicant";
            if (applicantEmail) {
                NotificationService.sendPaymentConfirmed(applicantEmail, {
                    applicantName,
                    formNumber: application.formNumber || undefined,
                    paymentType: "Application Fee",
                    templateName: application.template?.name || "Admission Application",
                    reference
                }).catch((err) => console.error("Failed to send payment email:", err));
            }
        }

        revalidatePath("/admin/admission/payments");
        return { success: true };
    } catch (error) {
        console.error("Failed to confirm admission payment:", error);
        return { success: false, error: "Failed to confirm payment" };
    }
}

export async function getAdmissionSummary() {
    await requireAdmin();
    try {
        const templates = await db.query.admissionFormTemplates.findMany({
            with: {
                applications: true
            }
        });

        return templates.map(t => ({
            id: t.id,
            name: t.name,
            level: t.level,
            total: t.applications.length,
            paid: t.applications.filter(a => a.paymentStatus === 'paid').length,
            pending: t.applications.filter(a => a.paymentStatus === 'pending').length,
            admitted: t.applications.filter(a => a.status === 'admitted').length
        }));
    } catch (error) {
        console.error("Failed to fetch admission summary:", error);
        return [];
    }
}

export async function getExamSlipData(applicationId: number) {
    try {
        return await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId),
            with: {
                template: {
                    with: {
                        exams: true
                    }
                }
            }
        });
    } catch (error) {
        console.error("Failed to fetch exam slip data:", error);
        return null;
    }
}

export async function requestEditAccess(applicationId: number) {
    try {
        const application = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId),
            with: {
                template: true
            }
        });

        if (!application) return { success: false, error: "Application not found" };

        const now = new Date();
        const template = application.template;
        const closingDate = template.lateEndDate || template.endDate;

        // If before closing date, allow edit
        if (now <= closingDate) {
            return { success: true, needsFine: false };
        }

        // If after closing date, check if fine is paid or window is open
        if (application.editWindowExpiresAt && now < application.editWindowExpiresAt) {
            return { success: true, needsFine: false };
        }

        return { success: false, needsFine: true, fineAmount: 5000 }; // Fixed fine amount or could be dynamic
    } catch (error) {
        console.error("Failed to request edit access:", error);
        return { success: false, error: "An error occurred" };
    }
}

export async function confirmEditFinePayment(applicationId: number, reference: string) {
    await requireAdmin();
    try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour window

        const application = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId),
            with: { template: true }
        });

        await db.update(admissionApplicationsV2)
            .set({
                editFineStatus: 'paid',
                editFineReference: reference,
                editWindowExpiresAt: expiresAt
            })
            .where(eq(admissionApplicationsV2.id, applicationId));

        if (application) {
            const formData = typeof application.data === 'string' ? JSON.parse(application.data || '{}') : (application.data || {});
            const applicantEmail = formData.email || "";
            const applicantName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "Applicant";
            if (applicantEmail) {
                NotificationService.sendEditWindowOpened(applicantEmail, {
                    applicantName,
                    templateName: application.template?.name || "Admission Application",
                    expiresAt
                }).catch((err) => console.error("Failed to send edit window email:", err));
            }
        }

        return { success: true, expiresAt };
    } catch (error) {
        console.error("Failed to confirm edit fine:", error);
        return { success: false, error: "Failed to confirm payment" };
    }
}

export async function updateAdmissionApplication(applicationId: number, formData: any) {
    await requireAdmin();
    try {
        // Double check access window in action
        const access = await requestEditAccess(applicationId);
        if (!access.success) return { success: false, error: "Edit window is closed or fine required." };

        await db.update(admissionApplicationsV2)
            .set({
                data: JSON.stringify(formData),
                updatedAt: new Date()
            })
            .where(eq(admissionApplicationsV2.id, applicationId));

        return { success: true };
    } catch (error) {
        console.error("Failed to update admission application:", error);
        return { success: false, error: "Failed to update application" };
    }
}

export async function updateExamVisibility(examId: number, showInstantly: boolean) {
    await requireAdmin();
    try {
        await db.update(admissionEntranceExams)
            .set({ showResultsInstantly: showInstantly })
            .where(eq(admissionEntranceExams.id, examId));
        revalidatePath(`/admin/admission/exams/${examId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update exam visibility:", error);
        return { success: false, error: "An error occurred" };
    }
}

export async function releaseResults(examId: number) {
    await requireAdmin();
    try {
        await db.update(admissionEntranceExams)
            .set({ resultsReleased: true })
            .where(eq(admissionEntranceExams.id, examId));
        revalidatePath(`/admin/admission/exams/${examId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to release results:", error);
        return { success: false, error: "An error occurred" };
    }
}

export async function updateAdmissionStatus(applicationId: number, status: any, notes: string) {
    await requireAdmin();
    try {
        // Get application details before update
        const application = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId),
            with: { template: true }
        });

        await db.update(admissionApplicationsV2)
            .set({ 
                status: status,
                admissionNotes: notes,
                updatedAt: new Date()
            })
            .where(eq(admissionApplicationsV2.id, applicationId));
        
        // Send email notification based on status
        if (application?.template) {
            const formData = typeof application.data === 'string' ? JSON.parse(application.data || '{}') : (application.data || {});
            const applicantEmail = formData.email || "";
            const applicantName = formData.surname 
                ? (formData.middleName 
                    ? `${formData.surname} ${formData.firstName} ${formData.middleName}`.trim()
                    : `${formData.surname} ${formData.firstName}`.trim())
                : `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Applicant';
            
            if (status === 'rejected' && applicantEmail) {
                NotificationService.sendAdmissionRejectedByEmail(applicantEmail, {
                    applicantName,
                    templateName: application.template.name,
                    reason: notes || undefined,
                    userId: application.applicantId || undefined
                }).catch((err) => console.error("Failed to send rejection email:", err));
            } else if (status === 'admitted' && applicantEmail) {
                NotificationService.sendApplicationUnderReview(applicantEmail, {
                    applicantName,
                    formNumber: application.formNumber || undefined,
                    templateName: application.template.name,
                    userId: application.applicantId || undefined
                }).catch((err) => console.error("Failed to send admitted notification:", err));
            }
        }
        
        revalidatePath("/admin/admission/reports");
        return { success: true };
    } catch (error) {
        console.error("Failed to update admission status:", error);
        return { success: false, error: "An error occurred" };
    }
}

export async function getApplicantStatusData(applicationId: number) {
    try {
        return await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId),
            with: {
                template: {
                    with: {
                        exams: true
                    }
                },
                // @ts-expect-error - TS2353: Auto-suppressed for build
                results: {
                    // @ts-expect-error - TS7006: Auto-suppressed for build
                    where: (results, { eq }) => eq(results.applicationId, applicationId)
                }
            }
        });
    } catch (error) {
        console.error("Failed to fetch applicant status data:", error);
        return null;
    }
}

export async function confirmAcceptancePayment(applicationId: number, reference: string) {
    await requireAdmin();
    try {
        await db.update(admissionApplicationsV2)
            .set({ 
                acceptancePaymentStatus: 'paid',
                updatedAt: new Date()
            })
            .where(eq(admissionApplicationsV2.id, applicationId));

        // Auto-finalize the admission and generate the matric number immediately!
        await finalizeStudentAdmission(applicationId);
        
        revalidatePath(`/admission/status/${applicationId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to confirm acceptance payment:", error);
        return { success: false, error: "An error occurred" };
    }
}

export async function finalizeStudentAdmission(applicationId: number) {
    await requireAdmin();
    try {
        const application = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId),
            with: {
                template: true
            }
        });

        if (!application || application.status !== 'admitted') {
            return { success: false, error: "Application not eligible for registration." };
        }

        const template = application.template;

        // Check if acceptance fee is required and paid
        if (template.requireAcceptanceFee && application.acceptancePaymentStatus !== 'paid') {
            return { success: false, error: "Acceptance fee has not been paid." };
        }

        const formData = typeof application.data === 'string' ? JSON.parse(application.data || "{}") : (application.data || {});

        // Prefer the dedicated applicationMode/jambRegNumber columns (set during the
        // Full-Time/Part-Time instructions step). Fall back to scanning dynamic form
        // fields for a legacy/manually-added "JAMB" field for older applications.
        let jambRegNo = application.jambRegNumber || "";
        if (!jambRegNo) {
            for (const key of Object.keys(formData)) {
                if (key.toLowerCase().includes("jamb") && formData[key]) {
                    jambRegNo = String(formData[key]).trim();
                    break;
                }
            }
        }
        const isJambCandidate = application.applicationMode
            ? application.applicationMode === 'full_time'
            : (!!jambRegNo && !jambRegNo.toLowerCase().includes("temp") && !jambRegNo.toLowerCase().includes("direct"));
        const studyMode = isJambCandidate ? "Full-Time" : "Part-Time";
        const studyModeCode = isJambCandidate ? "FT" : "PT";
        const modeOfEntry = isJambCandidate ? "JAMB" : "Direct";

        // Generate FSS standard matriculation number
        const year = new Date().getFullYear();
        const progName = (template.level.toLowerCase().includes("nd") || template.level.toLowerCase().includes("diploma")) ? "ND" : "HND";
        
        // Query total student count for the year to generate a unique sequence number
        const countRes = await db.select({ count: sql<number>`count(*)` })
            .from(students)
            .where(eq(students.admissionYear, year));
        
        const sequence = (countRes[0]?.count || 0) + 1;
        const formattedSeq = sequence.toString().padStart(4, '0');
        const matricNumber = `FSS/IB/${year}/${studyModeCode}/${progName}/${formattedSeq}`;

        // 1. Create User - Handle new name structure (surname, firstName, middleName)
        const userFullName = formData.surname 
            ? (formData.middleName 
                ? `${formData.surname} ${formData.firstName} ${formData.middleName}`.trim()
                : `${formData.surname} ${formData.firstName}`.trim())
            : `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.fullName || `Applicant ${application.id}`;
        
        const defaultPasswordHash = await hash("Password123", 10);
        const [userResult] = await db.insert(users).values({
            name: userFullName,
            email: formData.email || formData.guardianEmail || `applicant${application.id}@portal.edu`,
            password: defaultPasswordHash, // Default: "Password123" — must be changed on first login
            requiresPasswordChange: true,
            role: 'student',
            phone: formData.phone || formData.guardianPhone,
            imageUrl: application.applicantPhoto,
            status: 'active'
        });

        const userId = userResult.insertId;

        // 2. Create Student with extended mapping including Study Mode
        // @ts-expect-error - TS2769: Auto-suppressed for build
        await db.insert(students).values({
            userId: userId,
            firstName: formData.firstName || formData.fullName?.split(' ')[0],
            lastName: formData.surname || formData.lastName || formData.fullName?.split(' ').slice(1).join(' '),
            matricNumber: matricNumber,
            jambNumber: jambRegNo || null,
            modeOfEntry: modeOfEntry,
            studyMode: studyMode,
            admissionYear: year,
            gender: (formData.gender?.toLowerCase() || 'other') as any,
            dob: formData.dob,
            imageUrl: application.applicantPhoto,
            nationality: formData.nationality || 'Nigerian',
            
            // Guardian Details mapping
            guardianName: formData.parentName || formData.guardianName || formData.fatherName || formData.motherName,
            guardianPhone: formData.parentPhone || formData.guardianPhone || formData.fatherPhone || formData.motherPhone,
            guardianEmail: formData.parentEmail || formData.guardianEmail,
            guardianAddress: formData.address || formData.guardianAddress || formData.homeAddress,
            
            // Health Details
            bloodGroup: formData.bloodGroup || formData.blood_group,
            genotype: formData.genotype,
            ailments: formData.immunizationHistory || formData.ailments || formData.medicalHistory,
            
            status: 'active'
        });

        // 3. Update Application Status
        await db.update(admissionApplicationsV2)
            .set({ 
                admissionNotes: `Admission accepted and finalized. Matric Number: ${matricNumber}`,
                updatedAt: new Date()
            })
            .where(eq(admissionApplicationsV2.id, applicationId));

        revalidatePath(`/admission/status/${applicationId}`);
        revalidatePath("/admin/admission/reports");
        
        // Send admission accepted email
        const applicantName = formData.surname 
            ? (formData.middleName 
                ? `${formData.surname} ${formData.firstName} ${formData.middleName}`.trim()
                : `${formData.surname} ${formData.firstName}`.trim())
            : `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Applicant';
        
        const applicantEmail = formData.email || "";
        if (applicantEmail) {
            NotificationService.sendAdmissionAcceptedByEmail(applicantEmail, {
                applicantName,
                matricNumber,
                templateName: template.name,
                userId
            }).catch((err) => console.error("Failed to send accepted email:", err));
        }
        
        await sendInAppNotification({
            userId: userId,
            title: "Admission Accepted!",
            message: `Welcome! Your admission is finalized. Matric Number: ${matricNumber}`,
            type: "success"
        });
        
        return { success: true, matricNumber };
    } catch (error: any) {
        console.error("Failed to finalize admission:", error);
        return { success: false, error: error.message || "An error occurred during registration" };
    }
}

import { SplitPaymentEngine } from "@/services/SplitPaymentEngine";

export async function processAdmissionPayment(applicationId: number, feeStructureId: number, applicantEmail: string, applicantName: string) {
    await requireApplicant();
    try {
        const engine = new SplitPaymentEngine();
        const res = await engine.checkoutAdmissionForm(applicationId, feeStructureId, applicantEmail, applicantName);
        return res;
    } catch (error: any) {
        console.error("Admission Payment Error:", error);
        return { success: false, error: error.message };
    }
}

import { hash, compare } from "bcryptjs";

export async function registerApplicant(data: any) {
    try {
        const { templateId, surname, firstName, middleName, email, phone, password } = data;

        // Validate required fields
        if (!templateId || !surname || !firstName || !email || !phone || !password) {
            return { success: false, error: "All required fields must be filled." };
        }

        // Validate password strength
        if (password.length < 8) {
            return { success: false, error: "Password must be at least 8 characters long." };
        }

        // 1. Check if user exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email.toLowerCase())
        });

        let userId;

        if (existingUser) {
            // Check if email is verified
            if (!existingUser.emailVerified) {
                return { success: false, error: "This email is registered but not yet verified. Please check your inbox for the verification link or contact support." };
            }

            // This email is already registered — verify the submitted password matches
            // the existing account instead of silently attaching a new draft to it.
            const passwordMatches = existingUser.password
                ? await compare(password, existingUser.password)
                : false;
            if (!passwordMatches) {
                return { success: false, error: "An account with this email already exists. Please log in instead, or use 'Forgot Password' if you don't remember your credentials." };
            }
            userId = existingUser.id;
        } else {
            // Create user with new name structure
            const hashedPassword = await hash(password, 10);
            const fullName = middleName 
                ? `${surname} ${firstName} ${middleName}`.trim()
                : `${surname} ${firstName}`.trim();
            
            const [userRes] = await db.insert(users).values({
                name: fullName,
                email: email.toLowerCase(),
                phone: phone,
                password: hashedPassword,
                role: 'applicant',
                status: 'active',
                emailVerified: false,
            });
            userId = userRes.insertId;

            // Generate and send verification email for new users only
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await db.insert(emailVerificationTokens).values({
                userId,
                token,
                expiresAt,
            });

            const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.fssibadan.edu.ng'}/verify-email?token=${token}`;
            const emailHtml = `
                <h2>Welcome to Federal School of Statistics, Ibadan</h2>
                <p>Dear ${fullName},</p>
                <p>Thank you for starting your admission application. Please verify your email address by clicking the link below:</p>
                <a href="${verificationLink}" style="display:inline-block;padding:12px 24px;background:#059669;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Verify Email</a>
                <p>This link will expire in 24 hours.</p>
                <p>After verification, you can log in and continue your application.</p>
            `;
            
            try {
                await sendEmail(email.toLowerCase(), 'Verify your Email - FSS Ibadan Admission', emailHtml);
            } catch (emailErr) {
                console.error("Failed to send verification email:", emailErr);
            }
        }

        // 2. Create Draft Application
        const [appRes] = await db.insert(admissionApplicationsV2).values({
            templateId,
            applicantId: userId,
            status: 'draft',
            paymentStatus: 'pending'
        });

        return { 
            success: true, 
            applicationId: appRes.insertId,
            requiresVerification: !existingUser 
        };
    } catch (error: any) {
        console.error("Applicant Registration Error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return { success: false, error: "An account with this email already exists." };
        }
        return { success: false, error: error.message || "Registration failed. Please try again." };
    }
}

export async function getExaminationBodies() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized: Please log in");
    try {
        return await db.select().from(examinationBodies).where(eq(examinationBodies.isActive, true));
    } catch (error) {
        console.error("Fetch exam bodies error:", error);
        return [];
    }
}

export async function saveOLevelResultsAction(applicationId: number, applicantId: number, sittings: any[]) {
    await requireApplicant();
    try {
        // Clear previous entries
        const existingSittings = await db.select().from(applicantOLevelSittings)
            .where(and(eq(applicantOLevelSittings.applicationId, applicationId), eq(applicantOLevelSittings.applicantId, applicantId)));
            
        for (const sitting of existingSittings) {
            await db.delete(applicantOLevelSubjects).where(eq(applicantOLevelSubjects.sittingId, sitting.id));
        }
        await db.delete(applicantOLevelSittings).where(and(eq(applicantOLevelSittings.applicationId, applicationId), eq(applicantOLevelSittings.applicantId, applicantId)));

        // Insert new ones
        for (let i = 0; i < sittings.length; i++) {
            const sitting = sittings[i];
            const [res] = await db.insert(applicantOLevelSittings).values({
                applicantId,
                applicationId,
                examBodyId: parseInt(sitting.examBodyId),
                examYear: sitting.examYear,
                examNumber: sitting.examNumber,
                sittingNumber: i + 1
            });
            const sittingId = res.insertId;

            if (sitting.subjects && sitting.subjects.length > 0) {
                const subjectValues = sitting.subjects.filter((s: any) => s.subjectName && s.grade).map((s: any) => ({
                    sittingId,
                    subjectName: s.subjectName,
                    grade: s.grade
                }));
                if (subjectValues.length > 0) {
                    await db.insert(applicantOLevelSubjects).values(subjectValues);
                }
            }
        }
        return { success: true };
    } catch (error: any) {
        console.error("Save OLevel Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getApplicantApplication(applicationId: number, applicantId: number) {
    await requireApplicant();
    try {
        const app = await db.query.admissionApplicationsV2.findFirst({
            where: and(
                eq(admissionApplicationsV2.id, applicationId),
                eq(admissionApplicationsV2.applicantId, applicantId)
            )
        });
        
        if (app) {
            const template = await getTemplateWithSections(app.templateId);
            // @ts-expect-error
            app.template = template;
            const isProcessingFeePaid = await checkDeveloperFeeStatus(applicationId.toString(), 'admission_form');
            // @ts-expect-error
            app.isProcessingFeePaid = isProcessingFeePaid;
            
            // Parse NIN verification config from template
            let ninVerificationMode = 'disabled';
            let ninRequired = true;
            let ninAutoFill = true;
            if (app.template?.ninVerificationConfig) {
                try {
                    const ninConfig = typeof app.template.ninVerificationConfig === 'string' 
                        ? JSON.parse(app.template.ninVerificationConfig) 
                        : app.template.ninVerificationConfig;
                    ninVerificationMode = ninConfig.enabled ? ninConfig.provider || 'simulator' : 'disabled';
                    ninRequired = ninConfig.enabled ? (ninConfig.required !== false) : true;
                    ninAutoFill = ninConfig.enabled ? (ninConfig.autoFill !== false) : true;
                } catch {
                    ninVerificationMode = 'disabled';
                }
            }
            // @ts-expect-error
            app.ninVerificationMode = ninVerificationMode;
            // @ts-expect-error
            app.ninRequired = ninRequired;
            // @ts-expect-error
            app.ninAutoFill = ninAutoFill;

            // Calculate exact fee from structure
            if (app.template.feeStructureId) {
                const items = await db.select().from(feeStructureItems).where(eq(feeStructureItems.feeStructureId, app.template.feeStructureId));
                const total = items.reduce((acc, curr) => acc + parseFloat(curr.amount as string), 0);
                // @ts-expect-error
                app.template.calculatedFee = total;
            } else {
                // Fallback to static applicationFee
                // @ts-expect-error
                app.template.calculatedFee = parseFloat(app.template.applicationFee || "0");
            }
        }

        return app || null;
    } catch (error) {
        console.error("Fetch application error:", error);
        return null;
    }
}

export async function saveApplicationDraft(applicationId: number, applicantId: number, formData: any) {
    await requireApplicant();
    try {
        const ninValue = formData?.['NIN'] || formData?.__ninData?.nin || null;
        await db.update(admissionApplicationsV2)
            .set({ 
                data: formData,
                nin: ninValue
            })
            .where(
                and(
                    eq(admissionApplicationsV2.id, applicationId),
                    eq(admissionApplicationsV2.applicantId, applicantId)
                )
            );
        return { success: true };
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return { success: false, error: "This NIN has already been used in another application." };
        }
        return { success: false, error: error.message };
    }
}

export async function submitApplicationFinal(applicationId: number, applicantId: number) {
    await requireApplicant();
    try {
        const application = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId)
        });

        if (!application) {
            return { success: false, error: "Application not found" };
        }

        const template = await getTemplateWithSections(application.templateId);

        // Enforce Full-Time applicants have a verified JAMB Registration Number
        if (application.applicationMode === 'full_time' && !application.jambRegNumber) {
            return { success: false, error: "A JAMB Registration Number is required for Full-Time applications. Please go back and complete this step." };
        }

        // Server-side validation
        const formData = typeof application.data === 'string' ? JSON.parse(application.data || '{}') : (application.data || {});
        const validationErrors: string[] = [];

        for (const section of template?.sections || []) {
            for (const field of section.fields) {
                // Skip NIN field if verification is disabled
                if (field.systemKey === 'nin') continue;
                
                const value = formData[field.label];

                // Required validation
                if (field.isRequired && (!value || (typeof value === 'string' && value.trim() === ''))) {
                    validationErrors.push(`${field.label} is required`);
                    continue;
                }

                // Skip further validation if empty and not required
                if (!value || (typeof value === 'string' && value.trim() === '')) continue;

                const strValue = String(value);

                // Parse validation rules
                let rules: any = {};
                try {
                    rules = typeof field.validationRules === 'string' ? JSON.parse(field.validationRules) : (field.validationRules || {});
                } catch { continue; }

                // Min length
                if (rules.minLength && strValue.length < rules.minLength) {
                    validationErrors.push(`${field.label} must be at least ${rules.minLength} characters`);
                }

                // Max length
                if (rules.maxLength && strValue.length > rules.maxLength) {
                    validationErrors.push(`${field.label} must be no more than ${rules.maxLength} characters`);
                }

                // Min value
                if (rules.min !== undefined && !isNaN(Number(value)) && Number(value) < rules.min) {
                    validationErrors.push(`${field.label} must be at least ${rules.min}`);
                }

                // Max value
                if (rules.max !== undefined && !isNaN(Number(value)) && Number(value) > rules.max) {
                    validationErrors.push(`${field.label} must be no more than ${rules.max}`);
                }

                // Pattern
                if (rules.pattern) {
                    try {
                        const regex = new RegExp(rules.pattern);
                        if (!regex.test(strValue)) {
                            validationErrors.push(rules.patternMessage || `${field.label} does not match the required format`);
                        }
                    } catch { /* invalid regex, skip */ }
                }

                // Email validation
                if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
                    validationErrors.push(`${field.label} must be a valid email address`);
                }

                // Phone validation
                if (field.type === 'phone' && !/^[\d\s\-+()]{7,20}$/.test(strValue)) {
                    validationErrors.push(`${field.label} must be a valid phone number`);
                }

                // URL validation
                if (field.type === 'url' && strValue && !/^https?:\/\/.+/.test(strValue)) {
                    validationErrors.push(`${field.label} must be a valid URL starting with http:// or https://`);
                }
            }
        }

        if (validationErrors.length > 0) {
            return { success: false, error: `Validation failed: ${validationErrors.join('; ')}` };
        }

        // Send email notification
        if (template) {
            const applicantName = formData.surname 
                ? (formData.middleName 
                    ? `${formData.surname} ${formData.firstName} ${formData.middleName}`.trim()
                    : `${formData.surname} ${formData.firstName}`.trim())
                : `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Applicant';
            
            const applicantEmail = formData.email || "";
            if (applicantEmail) {
                NotificationService.sendApplicationSubmittedByEmail(applicantEmail, {
                    applicantName,
                    formNumber: application.formNumber || undefined,
                    applicationNumber: application.applicationNumber || undefined,
                    templateName: template.name,
                    userId: applicantId
                }).catch((err) => console.error("Failed to send submission email:", err));
            }
        }

        await db.update(admissionApplicationsV2)
            .set({ status: 'submitted' })
            .where(
                and(
                    eq(admissionApplicationsV2.id, applicationId),
                    eq(admissionApplicationsV2.applicantId, applicantId)
                )
            );

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * NIN Verification & Global Settings Actions
 */

export async function verifyNinAction(nin: string) {
    await requireApplicant();
    try {
        if (!nin || nin.length !== 11 || !/^\d+$/.test(nin)) {
            return { success: false, error: "NIN must be exactly 11 numeric digits." };
        }

        // Check uniqueness in database
        const existing = await db.select().from(admissionApplicationsV2).where(eq(admissionApplicationsV2.nin, nin));
        if (existing.length > 0) {
            return { success: false, error: "This NIN has already been used in another application." };
        }

        // Fetch verification settings
        const [modeSetting] = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, 'NIN_VERIFICATION_MODE'));
        const [providerSetting] = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, 'NIN_LIVE_PROVIDER'));
        
        const mode = modeSetting?.settingValue || 'simulator';
        const provider = providerSetting?.settingValue || 'dojah';

        let result: any = null;

        if (mode === 'live') {
            if (provider === 'dojah') {
                const res = await fetch(`https://api.dojah.io/api/v1/kyc/nin?nin=${nin}`, {
                    headers: { 'Authorization': `${process.env.DOJAH_API_KEY}`, 'AppId': `${process.env.DOJAH_APP_ID}` }
                });
                const data = await res.json();
                if (!res.ok || !data.entity) return { success: false, error: data.error || "Dojah NIN verification failed." };
                result = { firstName: data.entity.first_name, lastName: data.entity.last_name, dob: data.entity.date_of_birth, gender: data.entity.gender };
            } else if (provider === 'verifyme') {
                const res = await fetch(`https://vapi.verifyme.ng/v1/verifications/identities/nin/${nin}`, {
                    method: 'POST', headers: { 'Authorization': `Bearer ${process.env.VERIFYME_API_KEY}` }
                });
                const data = await res.json();
                if (!res.ok || !data.data) return { success: false, error: data.message || "VerifyMe NIN verification failed." };
                result = { firstName: data.data.firstname, lastName: data.data.lastname, dob: data.data.birthdate, gender: data.data.gender };
            } else if (provider === 'smileid') {
                const res = await fetch('https://api.smileidentity.com/v1/id_verification', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ partner_id: process.env.SMILEID_PARTNER_ID, id_number: nin, id_type: 'NIN' })
                });
                const data = await res.json();
                if (!res.ok || data.ResultCode !== '1012') return { success: false, error: data.ResultText || "SmileID NIN verification failed." };
                result = { firstName: data.FullData.First_Name, lastName: data.FullData.Surname, dob: data.FullData.Date_Of_Birth, gender: data.FullData.Gender };
            } else if (provider === 'monnify') {
                const res = await fetch('https://api.monnify.com/api/v1/nin/match', {
                    method: 'POST', headers: { 'Authorization': `Bearer ${process.env.MONNIFY_API_KEY}` },
                    body: JSON.stringify({ nin })
                });
                const data = await res.json();
                if (!res.ok || !data.responseBody) return { success: false, error: data.responseMessage || "Monnify NIN verification failed." };
                result = { firstName: data.responseBody.firstName, lastName: data.responseBody.lastName, dob: data.responseBody.dateOfBirth, gender: data.responseBody.gender };
            }
        } else {
            // Simulator Mode
            const mockDatabase: Record<string, any> = {
                "12345678901": { firstName: "Abubakar", lastName: "Alao", dob: "2010-05-15", gender: "Male" },
                "98765432109": { firstName: "Chinedu", lastName: "Okafor", dob: "2011-08-22", gender: "Male" },
                "55555555555": { firstName: "Aminat", lastName: "Sanni", dob: "2009-12-03", gender: "Female" },
                "11111111111": { firstName: "Folake", lastName: "Adewale", dob: "2012-04-10", gender: "Female" }
            };

            result = mockDatabase[nin] || {
                firstName: "Verified",
                lastName: `Applicant-${nin.slice(-4)}`,
                dob: "2010-01-01",
                gender: "Female"
            };
        }

        if (!result) return { success: false, error: "NIN Verification failed." };

        return {
            success: true,
            verifiedName: `${result.firstName} ${result.lastName}`,
            firstName: result.firstName,
            lastName: result.lastName,
            dob: result.dob,
            gender: result.gender,
            verified: true
        };
    } catch (error: any) {
        console.error("NIN verify action error:", error);
        return { success: false, error: error.message || "Failed to verify NIN." };
    }
}

export async function getAdmissionEngineSetting() {
    await requireAdmin();
    try {
        const [setting] = await db.select()
            .from(systemSettings)
            .where(eq(systemSettings.settingKey, 'active_admission_engine'))
            .limit(1);
        
        return setting?.settingValue || 'multi_level';
    } catch (error) {
        console.error("Failed to fetch active admission engine setting:", error);
        return 'multi_level';
    }
}

export async function saveAdmissionEngineSetting(engineType: string) {
    await requireAdmin();
    try {
        const [existing] = await db.select()
            .from(systemSettings)
            .where(eq(systemSettings.settingKey, 'active_admission_engine'))
            .limit(1);

        if (existing) {
            await db.update(systemSettings)
                .set({ settingValue: engineType })
                .where(eq(systemSettings.settingKey, 'active_admission_engine'));
        } else {
            await db.insert(systemSettings).values({
                settingKey: 'active_admission_engine',
                settingValue: engineType,
                description: 'Global Admission Engine selector (multi_level, jamb_only, direct_only)'
            });
        }

        revalidatePath("/admin/admission/settings");
        revalidatePath("/admission");
        return { success: true };
    } catch (error) {
        console.error("Failed to save admission engine setting:", error);
        return { success: false, error: "Failed to update configuration" };
    }
}

export async function updateSectionsOrder(sections: { id: number, order: number }[], templateId: number) {
    await requireAdmin();
    try {
        await db.transaction(async (tx) => {
            for (const sec of sections) {
                await tx.update(admissionFormSections)
                    .set({ order: sec.order })
                    .where(eq(admissionFormSections.id, sec.id));
            }
        });
        revalidatePath(`/admin/admission/forms/${templateId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update sections order:", error);
        return { success: false, error: "Failed to save pages order" };
    }
}

export async function getAllExaminationBodies() {
    await requireAdmin();
    try {
        return await db.select().from(examinationBodies).orderBy(examinationBodies.name);
    } catch (error) {
        return [];
    }
}

export async function addExaminationBody(name: string) {
    await requireAdmin();
    try {
        await db.insert(examinationBodies).values({ name, isActive: true });
        revalidatePath("/admin/admission/settings");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Failed to add examination body. It might already exist." };
    }
}

export async function updateExaminationBody(id: number, isActive: boolean) {
    await requireAdmin();
    try {
        await db.update(examinationBodies).set({ isActive }).where(eq(examinationBodies.id, id));
        revalidatePath("/admin/admission/settings");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteExaminationBody(id: number) {
    await requireAdmin();
    try {
        await db.delete(examinationBodies).where(eq(examinationBodies.id, id));
        revalidatePath("/admin/admission/settings");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Cannot delete this exam body because it is currently in use by applicants." };
    }
}

export async function verifyApplicationByFormNumber(formNumber: string) {
    try {
        const app = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.formNumber, formNumber),
        });
        if (!app) return null;

        const template = await db.query.admissionFormTemplates.findFirst({
            where: eq(admissionFormTemplates.id, app.templateId),
        });

        let formData: any = {};
        try {
            formData = typeof app.data === "string" ? JSON.parse(app.data) : app.data || {};
        } catch {}

        return {
            formNumber: app.formNumber,
            formHash: app.formHash,
            status: app.status,
            paymentStatus: app.paymentStatus,
            submittedAt: app.appliedAt,
            applicantPhoto: app.applicantPhoto,
            templateName: template?.name || "Admission Application",
            templateLevel: template?.level || "tertiary",
            applicantName: `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "N/A",
            applicantEmail: formData.email || "N/A",
            applicantPhone: formData.phone || "N/A",
            programmeChoice: formData.programmeChoice || formData.programme || "N/A",
            dateOfBirth: formData.dob || formData.dateOfBirth || "N/A",
            gender: formData.gender || "N/A",
            stateOfOrigin: formData.stateOfOrigin || formData.state || "N/A",
        };
    } catch (error) {
        console.error("Verification lookup error:", error);
        return null;
    }
}

/**
 * Admin V2 Application List & Detail Actions
 */

export async function getAdminV2Applications(filters?: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    templateId?: number;
    page?: number;
    pageSize?: number;
}) {
    await requireAdmin();
    try {
        const page = filters?.page || 1;
        const pageSize = filters?.pageSize || 20;
        const offset = (page - 1) * pageSize;

        const conditions = [];

        if (filters?.status && filters.status !== 'all') {
            conditions.push(eq(admissionApplicationsV2.status, filters.status as any));
        }
        if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
            conditions.push(eq(admissionApplicationsV2.paymentStatus, filters.paymentStatus as any));
        }
        if (filters?.templateId) {
            conditions.push(eq(admissionApplicationsV2.templateId, filters.templateId));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [countResult] = await db.select({ count: sql<number>`count(*)` })
            .from(admissionApplicationsV2)
            .where(whereClause);

        const total = countResult?.count || 0;

        let applications = await db.query.admissionApplicationsV2.findMany({
            where: whereClause,
            orderBy: [desc(admissionApplicationsV2.appliedAt)],
            limit: pageSize,
            offset: offset,
            with: {
                template: true
            }
        });

        // Apply search filter in-memory if needed
        if (filters?.search) {
            const q = filters.search.toLowerCase();
            applications = applications.filter((app: any) => {
                let formData: any = {};
                try { formData = typeof app.data === 'string' ? JSON.parse(app.data) : app.data || {}; } catch {}
                const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.toLowerCase();
                const surname = `${formData.surname || ''} ${formData.firstName || ''}`.toLowerCase();
                const formNum = (app.formNumber || '').toLowerCase();
                return fullName.includes(q) || surname.includes(q) || formNum.includes(q);
            });
        }

        return {
            applications: applications.map((app: any) => {
                let formData: any = {};
                try { formData = typeof app.data === 'string' ? JSON.parse(app.data) : app.data || {}; } catch {}
                return {
                    ...app,
                    parsedData: formData,
                    applicantName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'N/A',
                    templateName: app.template?.name || 'N/A',
                };
            }),
            total: filters?.search ? applications.length : total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    } catch (error) {
        console.error("[getAdminV2Applications] Failed:", error);
        return { applications: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    }
}

export async function getAdminV2ApplicationDetail(applicationId: number) {
    await requireAdmin();
    try {
        const app = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId),
            with: {
                template: true,
                student: true
            }
        });

        if (!app) return null;

        let formData: any = {};
        try { formData = typeof app.data === 'string' ? JSON.parse(app.data) : app.data || {}; } catch {}

        // Get O-Level data
        const sittings = await db.query.applicantOLevelSittings.findMany({
            where: eq(applicantOLevelSittings.applicationId, applicationId),
        });

        const sittingIds = sittings.map(s => s.id);
        const subjects = sittingIds.length > 0
            ? await db.query.applicantOLevelSubjects.findMany({
                where: inArray(applicantOLevelSubjects.sittingId, sittingIds),
            })
            : [];

        const bodies = await db.select().from(examinationBodies);
        const bodyMap = new Map(bodies.map((b: any) => [b.id, b.name]));

        const olevelData = sittings.sort((a, b) => a.sittingNumber - b.sittingNumber).map(s => ({
            ...s,
            examBodyName: bodyMap.get(s.examBodyId) || 'N/A',
            subjects: subjects.filter(sub => sub.sittingId === s.id).sort((a, b) => a.id - b.id),
        }));

        // Get template sections + fields for rendering
        const sections = await db.query.admissionFormSections.findMany({
            where: eq(admissionFormSections.templateId, app.templateId),
            orderBy: [asc(admissionFormSections.order)]
        });

        const sectionIds = sections.map(s => s.id);
        const fields = sectionIds.length > 0
            ? await db.query.admissionFormFields.findMany({
                where: (f, { inArray }) => inArray(f.sectionId, sectionIds),
                orderBy: [asc(admissionFormFields.order)]
            })
            : [];

        const formStructure = sections.map(s => ({
            ...s,
            fields: fields.filter(f => f.sectionId === s.id),
        }));

        return {
            ...app,
            parsedData: formData,
            applicantName: formData.surname
                ? `${formData.surname} ${formData.firstName} ${formData.middleName || ''}`.trim()
                : `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'N/A',
            applicantEmail: formData.email || 'N/A',
            applicantPhone: formData.phone || 'N/A',
            templateName: app.template?.name || 'N/A',
            templateLevel: app.template?.level || '',
            olevelData,
            formStructure,
        };
    } catch (error) {
        console.error("[getAdminV2ApplicationDetail] Failed:", error);
        return null;
    }
}

export async function bulkUpdateAdmissionStatus(ids: number[], status: string, notes?: string) {
    await requireAdmin();
    try {
        if (!ids.length) return { success: false, error: "No applications selected" };

        await db.transaction(async (tx) => {
            for (const id of ids) {
                await tx.update(admissionApplicationsV2)
                    .set({
                        status: status as any,
                        admissionNotes: notes || null,
                        updatedAt: new Date(),
                    })
                    .where(eq(admissionApplicationsV2.id, id));
            }
        });

        revalidatePath("/admin/admission/v2");
        revalidatePath("/admin/admission/reports");
        return { success: true, count: ids.length };
    } catch (error: any) {
        console.error("[bulkUpdateAdmissionStatus] Failed:", error);
        return { success: false, error: error?.message || "Failed to update applications" };
    }
}

export async function getApplicantOLevelData(applicationId: number, applicantId: number) {
    try {
        const sittings = await db.query.applicantOLevelSittings.findMany({
            where: and(
                eq(applicantOLevelSittings.applicationId, applicationId),
                eq(applicantOLevelSittings.applicantId, applicantId)
            ),
        });
        if (sittings.length === 0) return [];

        const sittingIds = sittings.map((s) => s.id);
        const subjects = await db.query.applicantOLevelSubjects.findMany({
            where: inArray(applicantOLevelSubjects.sittingId, sittingIds),
        });

        const bodies = await db.select().from(examinationBodies);
        const bodyMap = new Map(bodies.map((b) => [b.id, b.name]));

        return sittings
            .sort((a, b) => a.sittingNumber - b.sittingNumber)
            .map((s) => ({
                ...s,
                examBodyName: bodyMap.get(s.examBodyId) || "N/A",
                subjects: subjects
                    .filter((sub) => sub.sittingId === s.id)
                    .sort((a, b) => a.id - b.id),
            }));
    } catch {
        return [];
    }
}
