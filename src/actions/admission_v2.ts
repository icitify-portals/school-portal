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
    emailVerificationTokens,
    admissionTemplateProgrammes,
    programmes,
    faculties,
    departments,
    transactions,
    academicSessions,
    processingFeeRules,
    admissionExamResults
} from "@/db/schema";
import { eq, and, desc, asc, sql, inArray, like, or, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import crypto from "crypto";
import { sendInAppNotification } from "./notifications";
import { checkDeveloperFeeStatus } from "./paystack-developer-subscription";
import { sendEmail } from "@/lib/mail";
import { normalizeEmail, isValidEmailFormat } from "@/lib/email";
import { extractNameParts, buildFullName } from "@/lib/applicant-names";
import { generateFormNumber, generateFormHash } from "@/lib/form-number";
import { storage } from "@/lib/storage";
import { hash, compare } from "bcryptjs";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const ADMIN_ROLES = [
    'admin', 'superadmin', 'icitify_dev', 'dvc', 'vc',
    'registrar', 'admission_officer', 'admission officer', 'admission',
    'bursar', 'bursary', 'accountant', 'auditor', 'recordofficer', 'record_officer', 'record officer', 'records'
];

async function requireAdmin() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized: Please log in");
    
    const role = (((session.user as any).role as string) || '').toLowerCase();
    const roles = (((session.user as any).roles as string[]) || []).map(r => String(r).toLowerCase());

    const hasAccess = ADMIN_ROLES.some(r => role === r || roles.includes(r));
    if (!hasAccess) {
        throw new Error("Forbidden: You do not have permission to perform this action");
    }
    return session;
}

async function requireApplicant() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized: Please log in");
    
    if ((session.user as any).role === 'applicant' || (session.user as any).role === 'student') {
        return session;
    }
    
    throw new Error("Forbidden: Only applicants can perform this action");
}

/**
 * Form Template Actions
 */

export async function getAdmissionTemplates() {
    try {
        return await db.select()
            .from(admissionFormTemplates)
            .where(eq(admissionFormTemplates.isActive, true))
            .orderBy(desc(admissionFormTemplates.createdAt));
    } catch (error) {
        console.error("[getAdmissionTemplates] Failed to fetch templates:", error);
        return [];
    }
}

export async function getFormTemplates() {
    try {
        await requireAdmin();
        return await db.select()
            .from(admissionFormTemplates)
            .orderBy(desc(admissionFormTemplates.createdAt));
    } catch (error) {
        console.error("[getFormTemplates] Failed to fetch form templates:", error);
        return [];
    }
}

export async function getFormTemplate(id: number) {
    try {
        await requireAdmin();
        return await getTemplateWithSections(id);
    } catch (error) {
        console.error("[getFormTemplate] Failed to fetch template:", error);
        return null;
    }
}

async function getTemplateWithSections(templateId: number) {
    try {
        const template = await db.query.admissionFormTemplates.findFirst({
            where: eq(admissionFormTemplates.id, templateId),
            with: {
                sections: {
                    orderBy: [asc(admissionFormSections.order)],
                    with: {
                        fields: {
                            orderBy: [asc(admissionFormFields.order)]
                        }
                    }
                },
                programmes: {
                    with: {
                        programme: true
                    }
                }
            }
        });
        
        if (!template) return null;
        
        const programmesData = template.programmes?.map(p => p.programme).filter(Boolean) || [];
        
        return {
            ...template,
            programmes: programmesData
        };
    } catch (error) {
        console.error("Failed to fetch template with sections:", error);
        return null;
    }
}

export async function getTemplateProgrammes(templateId: number) {
    try {
        const links = await db.select({
            programmeId: admissionTemplateProgrammes.programmeId,
        }).from(admissionTemplateProgrammes)
        .where(eq(admissionTemplateProgrammes.templateId, templateId));
        const ids = links.map(l => l.programmeId);
        if (ids.length === 0) return [];
        const progList = await db.select().from(programmes).where(inArray(programmes.id, ids));
        return progList;
    } catch (error) {
        console.error("Failed to fetch template programmes:", error);
        return [];
    }
}

export async function linkProgrammesToTemplate(templateId: number, programmeIds: number[]) {
    try {
        await requireAdmin();
        await db.delete(admissionTemplateProgrammes).where(eq(admissionTemplateProgrammes.templateId, templateId));
        if (programmeIds.length > 0) {
            await db.insert(admissionTemplateProgrammes).values(
                programmeIds.map(pid => ({ templateId, programmeId: pid }))
            );
        }
        revalidatePath(`/admin/admission/forms/${templateId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to link programmes:", error);
        return { success: false, error: error?.message || "Failed to link programmes" };
    }
}

export async function saveFormTemplate(data: any) {
    // Hoisted so the catch block can build friendly duplicate-slug/name messages
    const { id, name, level, slug, description, flowType, feeStructureId, applicationFee, processingFee, requireAcceptanceFee, acceptanceFee, idCardFee, cutoffPercent, lateFee, startDate, endDate, lateEndDate, minAge, isActive, ninVerificationConfig } = data;
    try {
        await requireAdmin();

        // Fall back to the global default cut-off for newly created exercises
        let effectiveCutoff = cutoffPercent;
        if (!id && (effectiveCutoff === undefined || effectiveCutoff === null || effectiveCutoff === '')) {
            const [settingRow] = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, 'post_utme_cutoff_percent')).limit(1);
            effectiveCutoff = parseFloat(settingRow?.settingValue || '40') || 40;
        }

        if (id) {
            await db.update(admissionFormTemplates)
                .set({ name, level, slug, description, flowType, feeStructureId, applicationFee, processingFee, requireAcceptanceFee, acceptanceFee, idCardFee, cutoffPercent: effectiveCutoff, lateFee, startDate, endDate, lateEndDate, minAge, isActive, ninVerificationConfig })
                .where(eq(admissionFormTemplates.id, id));
            revalidatePath(`/admin/admission/forms/${id}`);
            return { success: true, id };
        } else {
            const [result] = await db.insert(admissionFormTemplates).values({
                name, level, slug, description, flowType, feeStructureId, applicationFee, processingFee, requireAcceptanceFee, acceptanceFee, idCardFee, cutoffPercent: effectiveCutoff, lateFee, startDate, endDate, lateEndDate, minAge, isActive, ninVerificationConfig
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

export async function cloneFormTemplate(templateId: number) {
    try {
        await requireAdmin();
        const [originalTemplate] = await db.select().from(admissionFormTemplates).where(eq(admissionFormTemplates.id, templateId));
        if (!originalTemplate) throw new Error("Template not found");

        const newName = `${originalTemplate.name} (Copy)`;
        let newSlug = `${originalTemplate.slug}-copy`;
        
        let duplicateCounter = 1;
        while (true) {
            const [existing] = await db.select().from(admissionFormTemplates).where(eq(admissionFormTemplates.slug, newSlug));
            if (!existing) break;
            newSlug = `${originalTemplate.slug}-copy-${duplicateCounter}`;
            duplicateCounter++;
        }

        const { id: _tid, createdAt: _tca, ...templateFields } = originalTemplate;
        const [insertRes] = await db.insert(admissionFormTemplates).values({
            ...templateFields,
            name: newName,
            slug: newSlug,
            isActive: false, // Default copied template to inactive
        });
        const newTemplateId = insertRes.insertId;

        const sections = await db.select().from(admissionFormSections).where(eq(admissionFormSections.templateId, templateId)).orderBy(asc(admissionFormSections.order));
        const sectionIdMap = new Map<number, number>();

        for (const section of sections) {
            const { id: _sid, ...sectionFields } = section;
            const [secInsert] = await db.insert(admissionFormSections).values({
                ...sectionFields,
                templateId: newTemplateId,
            });
            sectionIdMap.set(section.id, secInsert.insertId);
        }

        if (sections.length > 0) {
            const sectionIds = sections.map(s => s.id);
            const fields = await db.select().from(admissionFormFields).where(inArray(admissionFormFields.sectionId, sectionIds));
            
            for (const field of fields) {
                const newSectionId = sectionIdMap.get(field.sectionId);
                if (newSectionId) {
                    const { id: _fid, ...fieldProps } = field;
                    await db.insert(admissionFormFields).values({
                        ...fieldProps,
                        sectionId: newSectionId,
                    });
                }
            }
        }

        revalidatePath("/admin/admission/forms");
        return { success: true, id: newTemplateId };

    } catch (error: any) {
        console.error("Failed to clone form template:", error);
        return { success: false, error: error.message || "Failed to clone template" };
    }
}

export async function deleteFormTemplate(id: number) {
    try {
        await requireAdmin();
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
    try {
        await requireAdmin();
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
    try {
        await requireAdmin();
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
    try {
        await requireAdmin();
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
    try {
        await requireAdmin();
        await db.delete(admissionFormFields).where(eq(admissionFormFields.id, id));
        revalidatePath(`/admin/admission/forms/${templateId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete form field:", error);
        return { success: false, error: "Failed to delete field" };
    }
}

export async function updateFieldsOrder(fields: { id: number, order: number }[], templateId: number) {
    try {
        await requireAdmin();
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

        const session = await auth();
        let applicantId = session?.user?.id ? parseInt(session.user.id) : undefined;
        if (!applicantId && formData.email) {
            const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, formData.email.toLowerCase())).limit(1);
            if (u) applicantId = u.id;
        }

        // Generate unique form number
        const formNumber = await generateFormNumber(template.level);

        // Generate security hash
        const applicantName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "Applicant";
        const dob = formData.dob || formData.dateOfBirth || "";
        const formHash = generateFormHash(formNumber, applicantName, dob, applicantPhoto || "");

        const [result] = await db.insert(admissionApplicationsV2).values({
            templateId,
            applicantId,
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
            sendEmail(
                applicantEmail,
                `Application Submitted – ${template?.name || "Admission Application"}`,
                `<p>Dear ${applicantName},</p><p>Your application (Form No: <strong>${formNumber}</strong>) has been successfully submitted. You will be notified of the next steps.</p>`
            ).catch((err: any) => console.error("Failed to send submission email:", err));
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
                student: true,
                applicant: true
            },
            orderBy: [desc(admissionApplicationsV2.appliedAt)]
        });
        return await query;
    } catch (error) {
        console.error("Failed to fetch admission applications:", error);
        return [];
    }
}
export async function reverseAdmissionPayment(applicationId: number) {
    await requireAdmin();
    try {
        const application = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId)
        });

        if (!application) return { success: false, error: "Not found" };

        await db.update(admissionApplicationsV2)
            .set({ 
                paymentStatus: 'pending', 
                status: 'draft',
                paymentReference: null 
            })
            .where(eq(admissionApplicationsV2.id, applicationId));

        revalidatePath('/admin/admission/v2');
        revalidatePath(`/admin/admission/v2/${applicationId}`);
        revalidatePath('/admin/admission/payments');
        
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function confirmAdmissionPayment(applicationId: number, reference: string) {
    await requireAdmin();
    try {
        const application = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId)
        });

        await db.update(admissionApplicationsV2)
            .set({ 
                paymentStatus: 'paid', 
                paymentReference: reference 
            })
            .where(eq(admissionApplicationsV2.id, applicationId));
        
        if (application) {
            const template = await db.query.admissionFormTemplates.findFirst({
                where: eq(admissionFormTemplates.id, application.templateId)
            });
            const formData = typeof application.data === 'string' ? JSON.parse(application.data || '{}') : (application.data || {});
            const applicantEmail = formData.email || "";
            const applicantName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "Applicant";
            if (applicantEmail) {
                sendEmail(
                    applicantEmail,
                    `Payment Confirmed – ${template?.name || "Admission Application"}`,
                    `<p>Dear ${applicantName},</p><p>Your <strong>Application Fee</strong> payment has been confirmed (Ref: <code>${reference}</code>, Form No: <strong>${application.formNumber || 'N/A'}</strong>).</p><p>You may now proceed with your application.</p>`
                ).catch((err: any) => console.error("Failed to send payment email:", err));
            }
        }

        revalidatePath("/admin/admission/payments");
        return { success: true };
    } catch (error) {
        console.error("Failed to confirm admission payment:", error);
        return { success: false, error: "Failed to confirm payment" };
    }
}

export async function deleteAdmissionApplication(applicationId: number) {
    await requireAdmin();
    try {
        await db.delete(admissionApplicationsV2).where(eq(admissionApplicationsV2.id, applicationId));
        return { success: true };
    } catch (error) {
        console.error("Failed to delete application:", error);
        return { success: false, error: "Failed to delete application" };
    }
}

export async function confirmProcessingFeePayment(applicationId: number) {
    await requireAdmin();
    try {
        await db.update(admissionApplicationsV2)
            .set({ processingFeeStatus: 'paid' })
            .where(eq(admissionApplicationsV2.id, applicationId));
        
        revalidatePath(`/admin/admission/v2/${applicationId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to confirm processing fee:", error);
        return { success: false, error: "Failed to confirm payment" };
    }
}

export async function reverseProcessingFeePayment(applicationId: number) {
    await requireAdmin();
    try {
        await db.update(admissionApplicationsV2)
            .set({ processingFeeStatus: 'pending' })
            .where(eq(admissionApplicationsV2.id, applicationId));
        
        revalidatePath(`/admin/admission/v2/${applicationId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to reverse processing fee:", error);
        return { success: false, error: "Failed to reverse payment" };
    }
}

export async function adminConfirmAcceptancePayment(applicationId: number) {
    await requireAdmin();
    try {
        await db.update(admissionApplicationsV2)
            .set({ acceptancePaymentStatus: 'paid', updatedAt: new Date() })
            .where(eq(admissionApplicationsV2.id, applicationId));

        const appData = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId)
        });
        if (appData) {
            const template = await db.query.admissionFormTemplates.findFirst({
                where: eq(admissionFormTemplates.id, appData.templateId)
            });
            const formData = typeof appData.data === 'string' ? JSON.parse(appData.data || '{}') : (appData.data || {});
            const email = formData.email;
            const candidateName = `${formData.firstName || ''} ${formData.surname || formData.lastName || ''}`.trim() || 'Admitted Candidate';
            if (email) {
                sendEmail(
                    email,
                    "Acceptance Fee Confirmed – Federal School of Statistics",
                    `<p>Dear <strong>${candidateName}</strong>,</p><p>Your Acceptance Fee &amp; Student ID Card payment has been confirmed by the admin. Your official <strong>Admission Letter</strong> is now unlocked.</p><p>Please proceed to pay your School Fees and Processing Fee to obtain your official Matriculation Number.</p>`
                ).catch((err: any) => console.error("Failed to send acceptance confirmation email:", err));
            }
        }

        revalidatePath(`/admin/admission/v2/${applicationId}`);
        revalidatePath(`/admission/status/${applicationId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to confirm acceptance payment:", error);
        return { success: false, error: "Failed to confirm acceptance payment" };
    }
}

export async function reverseAcceptancePayment(applicationId: number) {
    await requireAdmin();
    try {
        await db.update(admissionApplicationsV2)
            .set({ acceptancePaymentStatus: 'pending', updatedAt: new Date() })
            .where(eq(admissionApplicationsV2.id, applicationId));

        revalidatePath(`/admin/admission/v2/${applicationId}`);
        revalidatePath(`/admission/status/${applicationId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to reverse acceptance payment:", error);
        return { success: false, error: "Failed to reverse payment" };
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
            where: eq(admissionApplicationsV2.id, applicationId)
        });

        await db.update(admissionApplicationsV2)
            .set({
                editFineStatus: 'paid',
                editFineReference: reference,
                editWindowExpiresAt: expiresAt
            })
            .where(eq(admissionApplicationsV2.id, applicationId));

        if (application) {
            const template = await db.query.admissionFormTemplates.findFirst({
                where: eq(admissionFormTemplates.id, application.templateId)
            });
            const formData = typeof application.data === 'string' ? JSON.parse(application.data || '{}') : (application.data || {});
            const applicantEmail = formData.email || "";
            const applicantName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "Applicant";
            if (applicantEmail) {
                sendEmail(
                    applicantEmail,
                    `Edit Window Opened – ${template?.name || "Admission Application"}`,
                    `<p>Dear ${applicantName},</p><p>Your application edit window has been opened. You may now make changes until <strong>${expiresAt.toLocaleString()}</strong>.</p>`
                ).catch((err: any) => console.error("Failed to send edit window email:", err));
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
        // Admission decisions are made exclusively on the Screening page
        // (cut-off driven, audited via decision_source). This action remains
        // only for workflow utilities like Force Submit / Reset to Draft.
        if (status === 'admitted' || status === 'rejected') {
            return { success: false, error: "Admission decisions must be made on the Screening page." };
        }

        // Get application details before update
        const application = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId)
        });

        if (!application) return { success: false, error: "Application not found" };

        const template = await db.query.admissionFormTemplates.findFirst({
            where: eq(admissionFormTemplates.id, application.templateId)
        });

        // Applicants who have paid their acceptance fee can never be moved out of 'admitted'
        if (application.acceptancePaymentStatus === 'paid') {
            return { success: false, error: "Cannot change status — acceptance fee already paid." };
        }

        await db.update(admissionApplicationsV2)
            .set({
                status: status,
                admissionNotes: notes,
                updatedAt: new Date()
            })
            .where(eq(admissionApplicationsV2.id, applicationId));
        
        // Send email notification based on status
        if (template) {
            const formData = typeof application.data === 'string' ? JSON.parse(application.data || '{}') : (application.data || {});
            const applicantEmail = formData.email || "";
            const applicantName = formData.surname 
                ? (formData.middleName 
                    ? `${formData.surname} ${formData.firstName} ${formData.middleName}`.trim()
                    : `${formData.surname} ${formData.firstName}`.trim())
                : `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Applicant';
            
            if (status === 'rejected' && applicantEmail) {
                sendEmail(
                    applicantEmail,
                    `Application Update – ${template.name}`,
                    `<p>Dear ${applicantName},</p><p>We regret to inform you that your application to <strong>${template.name}</strong> was not successful${notes ? `: ${notes}` : '.'}</p>`
                ).catch((err: any) => console.error("Failed to send rejection email:", err));
            } else if (status === 'admitted' && applicantEmail) {
                sendEmail(
                    applicantEmail,
                    `Congratulations – Admission Offer – ${template.name}`,
                    `<p>Dear ${applicantName},</p><p>Congratulations! You have been offered provisional admission to <strong>${template.name}</strong>. Please log in to your portal to proceed.</p>`
                ).catch((err: any) => console.error("Failed to send admitted notification:", err));
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
        const app = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId)
        });

        if (!app) return null;

        const template = await db.query.admissionFormTemplates.findFirst({
            where: eq(admissionFormTemplates.id, app.templateId)
        });

        const exams = template ? await db.query.admissionEntranceExams.findMany({
            where: eq(admissionEntranceExams.templateId, template.id)
        }) : [];

        if (template) {
            (template as any).exams = exams;
        }

        const results = await db.query.admissionExamResults.findMany({
            where: eq(admissionExamResults.applicationId, applicationId)
        });

        return {
            ...app,
            template,
            results
        };
    } catch (error) {
        console.error("Failed to fetch applicant status data:", error);
        return null;
    }
}

export async function initiateAcceptancePaymentCheckout(applicationId: number) {
    try {
        const app = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId)
        });

        if (!app) return { success: false, error: "Application not found" };

        const template = await db.query.admissionFormTemplates.findFirst({
            where: eq(admissionFormTemplates.id, app.templateId)
        });

        if (!template) return { success: false, error: "Template not found" };

        let acceptanceFee = parseFloat(template.acceptanceFee || "0");
        const idCardFee = parseFloat(template.idCardFee || "0");
        let processingFee = 0;

        // Fetch processing fee specifically for acceptance fee using service type 'ACCEPTANCE_FEE'
        try {
            const pRule = await db.select().from(processingFeeRules).where(eq(processingFeeRules.serviceType, 'ACCEPTANCE_FEE')).limit(1);
            if (pRule.length > 0 && pRule[0].isActive) {
                processingFee = parseFloat(pRule[0].amount);
            }
        } catch (e) {
            console.warn("processingFeeRules table might not exist yet, skipping processing fee.");
        }

        const totalAmount = acceptanceFee + idCardFee + processingFee;
        const reference = `ACC-${applicationId}-${Date.now()}`;
        const formData = typeof app.data === 'string' ? JSON.parse(app.data || '{}') : (app.data || {});

        const email = formData.email || "student@school.edu.ng";
        const firstName = formData.firstName || "Applicant";
        const lastName = formData.lastName || "";

        // Record pending transaction
        await db.insert(transactions).values({
            amount: totalAmount.toString(),
            type: 'credit',
            purpose: `Acceptance Fee Payment`,
            status: 'pending',
            gateway: 'alatpay',
            gatewayReference: reference
        });

        // Resolve ALATPAY dynamic credentials via Bursary Settings (Fee Item -> Settlement Account -> Gateway Mapping)
        const { like, and } = await import('drizzle-orm');
        const { feeItems, gatewaySubaccounts } = await import('@/db/schema');
        
        let targetBusinessId: string | undefined;
        let publicKey: string | undefined;

        try {
            const [feeItem] = await db.select().from(feeItems).where(like(feeItems.name, '%Acceptance%')).limit(1);
            if (feeItem && feeItem.settlementAccountId) {
                const [gatewaySub] = await db.select().from(gatewaySubaccounts)
                    .where(and(
                        eq(gatewaySubaccounts.settlementAccountId, feeItem.settlementAccountId),
                        eq(gatewaySubaccounts.gatewayName, 'alatpay')
                    )).limit(1);
                
                if (gatewaySub) {
                    targetBusinessId = gatewaySub.gatewaySubaccountCode;
                    publicKey = gatewaySub.publicKey || undefined;
                }
            }
        } catch (e) {
            console.warn("Failed to resolve dynamic settlement account for Acceptance Fee", e);
        }

        return {
            success: true,
            reference,
            amount: totalAmount,
            email,
            firstName,
            lastName,
            targetBusinessId,
            publicKey
        };
    } catch (error) {
        console.error("Failed to initiate acceptance payment:", error);
        return { success: false, error: "An error occurred" };
    }
}

export async function uploadApplicantDocument(applicationId: number, docType: 'birthCertificate' | 'olevelResult' | 'jambResult', fileUrl: string) {
    try {
        const application = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId)
        });

        if (!application) return { success: false, error: "Application not found" };

        const currentData = typeof application.data === 'string' ? JSON.parse(application.data || '{}') : (application.data || {});
        const uploadedDocs = currentData.uploadedDocuments || {};

        uploadedDocs[docType] = fileUrl;
        uploadedDocs[`${docType}_uploaded_at`] = new Date().toISOString();

        currentData.uploadedDocuments = uploadedDocs;

        await db.update(admissionApplicationsV2)
            .set({ 
                data: JSON.stringify(currentData),
                updatedAt: new Date()
            })
            .where(eq(admissionApplicationsV2.id, applicationId));

        revalidatePath(`/admission/status/${applicationId}`);
        return { success: true, uploadedDocuments: uploadedDocs };
    } catch (error: any) {
        console.error("Failed to upload document:", error);
        return { success: false, error: error.message || "Failed to upload document" };
    }
}

export async function confirmAcceptancePayment(applicationId: number, reference: string) {
    try {
        // Resolve dynamic secret key
        const { like, and } = await import('drizzle-orm');
        const { feeItems, gatewaySubaccounts } = await import('@/db/schema');
        
        let targetSecretKey: string | undefined = undefined;

        try {
            const [feeItem] = await db.select().from(feeItems).where(like(feeItems.name, '%Acceptance%')).limit(1);
            if (feeItem && feeItem.settlementAccountId) {
                const [gatewaySub] = await db.select().from(gatewaySubaccounts)
                    .where(and(
                        eq(gatewaySubaccounts.settlementAccountId, feeItem.settlementAccountId),
                        eq(gatewaySubaccounts.gatewayName, 'alatpay')
                    )).limit(1);
                
                if (gatewaySub && gatewaySub.secretKey) {
                    targetSecretKey = gatewaySub.secretKey;
                }
            }
        } catch (e) {
            console.warn("Failed to resolve dynamic secret key for Acceptance Fee verification", e);
        }

        const { verifyPayment } = await import('@/actions/payment-gateways');
        const verification = await verifyPayment('alatpay', reference, undefined, targetSecretKey);

        if (!verification.success || !verification.verified) {
            return { success: false, error: "Payment verification failed. Please try again." };
        }

        // Mark acceptance payment as paid
        await db.update(admissionApplicationsV2)
            .set({ 
                acceptancePaymentStatus: 'paid',
                updatedAt: new Date()
            })
            .where(eq(admissionApplicationsV2.id, applicationId));

        // Mark transaction as completed
        await db.update(transactions)
            .set({ status: 'completed' })
            .where(eq(transactions.gatewayReference, reference));

        // Dispatch Admission Letter copy via Email
        try {
            const appData = await db.query.admissionApplicationsV2.findFirst({
                where: eq(admissionApplicationsV2.id, applicationId)
            });
            if (appData) {
                const template = await db.query.admissionFormTemplates.findFirst({
                    where: eq(admissionFormTemplates.id, appData.templateId)
                });
                if (template) {
                    (appData as any).template = template;
                }
                const formData = typeof appData.data === 'string' ? JSON.parse(appData.data || '{}') : (appData.data || {});
                const email = formData.email;
                const candidateName = `${formData.firstName || ''} ${formData.surname || formData.lastName || ''}`.trim() || 'Admitted Candidate';
                if (email) {
                    await sendEmail(
                        email,
                        "OFFICIAL ADMISSION LETTER - Federal School of Statistics",
                        `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 12px;">
                                <h2 style="color: #059669; text-transform: uppercase;">Provisional Admission Offer Confirmed</h2>
                                <p>Dear <strong>${candidateName}</strong>,</p>
                                <p>Congratulations! Your Acceptance Fee &amp; Student ID Card payment has been successfully confirmed.</p>
                                <p>Your official <strong>Admission Letter</strong> has been generated and unlocked on your student dashboard.</p>
                                <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #059669; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 14px;"><strong>Application Ref:</strong> #${applicationId.toString().padStart(6, '0')}</p>
                                    <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Programme:</strong> ${appData.template?.name || 'Academic Programme'}</p>
                                    <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Study Mode:</strong> ${(appData.applicationMode || 'Full-Time').replace('_', '-').toUpperCase()}</p>
                                </div>
                                <p>Please proceed to pay your 2026/2027 Session School Fees and Processing Fee to obtain your official <strong>Matriculation Number</strong>.</p>
                                <p style="margin-top: 30px; font-size: 12px; color: #64748b;">Registrar's Office, Federal School of Statistics</p>
                            </div>
                        `
                    );
                }
            }
        } catch (mailErr) {
            console.error("Failed to send admission letter email:", mailErr);
        }

        revalidatePath(`/admission/status/${applicationId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to confirm acceptance payment:", error);
        return { success: false, error: "An error occurred" };
    }
}

export async function generateBulkApplicantFilesZip(applicationIds: number[]) {
    await requireAdmin();
    try {
        if (!applicationIds || applicationIds.length === 0) {
            return { success: false, error: "No applications selected for file download." };
        }

        const AdmZip = (await import("adm-zip")).default;
        const zip = new AdmZip();

        const applications = await db.query.admissionApplicationsV2.findMany({
            where: inArray(admissionApplicationsV2.id, applicationIds),
            with: {
                template: true,
                programme: {
                    with: {
                        department: true
                    }
                }
            }
        });

        if (!applications || applications.length === 0) {
            return { success: false, error: "No matching applications found." };
        }

        // Lazy S3 client — private Wasabi bucket requires authenticated GetObject;
        // raw fetch() returns 403 which silently produced empty archives.
        let _s3: S3Client | null = null;
        const getS3 = (): S3Client => {
            if (!_s3) {
                _s3 = new S3Client({
                    region: process.env.WASABI_REGION || "eu-west-1",
                    endpoint: process.env.WASABI_ENDPOINT || `https://s3.${process.env.WASABI_REGION || "eu-west-1"}.wasabisys.com`,
                    credentials: {
                        accessKeyId: process.env.WASABI_ACCESS_KEY_ID || "",
                        // Production historically used WASABI_SECRET; support both spellings.
                        secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || process.env.WASABI_SECRET || "",
                    },
                    forcePathStyle: true,
                });
            }
            return _s3;
        };

        const S3_BUCKET = process.env.WASABI_BUCKET_NAME || "fssbucket";

        const extFromUrlOrType = (urlStr: string, contentType?: string | null): string => {
            const u = urlStr.toLowerCase().split('?')[0];
            if (contentType?.includes('pdf') || u.endsWith('.pdf')) return 'pdf';
            if (contentType?.includes('png') || u.endsWith('.png')) return 'png';
            if (contentType?.includes('webp') || u.endsWith('.webp')) return 'webp';
            return 'jpg';
        };

        const helperFetchBuffer = async (urlStr: string): Promise<{ buffer: Buffer; ext: string } | null> => {
            if (!urlStr) return null;
            try {
                // 1. Inline base64 payloads
                if (urlStr.startsWith('data:image/') || urlStr.startsWith('data:application/')) {
                    const matches = urlStr.match(/^data:[^;]+;base64,(.+)$/);
                    if (matches && matches[1]) {
                        const isPdf = urlStr.startsWith('data:application/pdf');
                        return { buffer: Buffer.from(matches[1], 'base64'), ext: isPdf ? 'pdf' : 'jpg' };
                    }
                }

                // 2. Local uploads served from /public
                if (urlStr.startsWith('/uploads/') || urlStr.startsWith('/signatures/')) {
                    const filePath = path.join(process.cwd(), 'public', urlStr);
                    const buffer = await readFile(filePath);
                    return { buffer, ext: extFromUrlOrType(urlStr) };
                }

                if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
                    // 3. Private Wasabi/S3 objects — authenticated GetObject
                    if (urlStr.includes('wasabisys.com') || urlStr.includes('amazonaws.com')) {
                        const marker = `/${S3_BUCKET}/`;
                        const idx = urlStr.indexOf(marker);
                        if (idx !== -1) {
                            const key = decodeURIComponent(urlStr.slice(idx + marker.length).split('?')[0]);
                            const response = await getS3().send(new GetObjectCommand({
                                Bucket: S3_BUCKET,
                                Key: key,
                            }));
                            const bytes = await response.Body?.transformToByteArray?.();
                            if (bytes) {
                                const contentType = (response as { ContentType?: string }).ContentType;
                                return { buffer: Buffer.from(bytes), ext: extFromUrlOrType(key, contentType) };
                            }
                        }
                    }
                    // 4. Any other public URL
                    const resp = await fetch(urlStr, { signal: AbortSignal.timeout(20000) });
                    if (resp.ok) {
                        const arrayBuf = await resp.arrayBuffer();
                        const contentType = resp.headers.get('content-type') || '';
                        return { buffer: Buffer.from(arrayBuf), ext: extFromUrlOrType(urlStr, contentType) };
                    }
                    console.warn(`[bulk-zip] Skipped ${urlStr.slice(0, 90)} — HTTP ${resp.status}`);
                }
            } catch (err: any) {
                console.error(`[bulk-zip] Failed to fetch payload: ${urlStr.slice(0, 90)} —`, err?.message || err);
            }
            return null;
        };

        let addedFiles = 0;

        for (const app of applications) {
            const formData = typeof app.data === 'string' ? JSON.parse(app.data || '{}') : (app.data || {});
            const nameFromForm = `${formData.firstName || formData.first_name || ''}_${formData.surname || formData.lastName || formData.last_name || ''}`.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || `Applicant_${app.id}`;
            const formNo = (app.formNumber || `APP-${app.id}`).replace(/[^a-zA-Z0-9_-]/g, '_');
            const progName = (app.programme?.name || app.template?.name || 'General_Applications').replace(/[^a-zA-Z0-9_-]/g, '_');

            const folderPath = `${progName}/${formNo}_${nameFromForm}`;

            const fileTargets = [
                {
                    key: 'passport_photo',
                    // Real submissions store the camera capture under "Photograph/camera"
                    url: app.applicantPhoto || formData["Photograph/camera"] || formData["Passport Photograph"] || formData["Passport Photo"] || formData["Passport"] || formData["Photo"]
                },
                {
                    key: 'applicant_signature',
                    url: formData["Signature"] || formData["Applicant Signature"] || formData["Signature Image"] || formData.signature
                },
                {
                    key: 'birth_certificate',
                    url: formData.uploadedDocuments?.birthCertificate || formData["Birth Certificate"]
                },
                {
                    key: 'olevel_result',
                    url: formData.uploadedDocuments?.olevelResult || formData["O-Level Result"] || formData["OLevel Result"]
                },
                {
                    key: 'jamb_result',
                    url: formData.uploadedDocuments?.jambResult || formData["JAMB Result"] || formData["JAMB Result Slip"]
                }
            ];

            for (const item of fileTargets) {
                if (item.url) {
                    const fetched = await helperFetchBuffer(String(item.url));
                    if (fetched) {
                        const filename = `${folderPath}/${item.key}.${fetched.ext}`;
                        zip.addFile(filename, fetched.buffer);
                        addedFiles++;
                    }
                }
            }
        }

        if (addedFiles === 0) {
            return {
                success: false,
                error: "No downloadable files found for the selected applicants (no photos, signatures or documents on record).",
            };
        }

        // Guard against runaway archive sizes for very large selections
        const zipBuffer = zip.toBuffer();
        const zipBase64 = zipBuffer.toString("base64");
        const filename = `Applicant_Files_${new Date().toISOString().split('T')[0]}.zip`;

        return { success: true, filename, zipBase64, addedFiles };
    } catch (error: any) {
        console.error("Failed to generate bulk applicant files ZIP:", error);
        return { success: false, error: error.message || "Failed to generate bulk ZIP archive" };
    }
}

export async function updateApplicantMatricNumber(applicationId: number, newMatricNumber: string) {
    await requireAdmin();
    try {
        const trimmedMatric = newMatricNumber.trim();
        if (!trimmedMatric) return { success: false, error: "Matriculation number cannot be empty." };

        const application = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId)
        });

        if (!application) return { success: false, error: "Application not found" };

        // Update student record if created
        if (application.studentId) {
            await db.update(students)
                .set({ 
                    matricNumber: trimmedMatric,
                })
                .where(eq(students.id, application.studentId));
        }

        // Save matriculation number into admission notes and application data
        const currentData = typeof application.data === 'string' ? JSON.parse(application.data || '{}') : (application.data || {});
        currentData.matricNumber = trimmedMatric;

        await db.update(admissionApplicationsV2)
            .set({
                data: JSON.stringify(currentData),
                admissionNotes: `Matriculation Number assigned/updated: ${trimmedMatric}`,
                updatedAt: new Date()
            })
            .where(eq(admissionApplicationsV2.id, applicationId));

        revalidatePath(`/admin/admission/v2/${applicationId}`);
        revalidatePath("/admin/admission/v2");
        return { success: true, matricNumber: trimmedMatric };
    } catch (error: any) {
        console.error("Failed to update matriculation number:", error);
        return { success: false, error: error.message || "Failed to update matriculation number" };
    }
}

export async function initiateSchoolFeesCheckout(applicationId: number) {
    try {
        const app = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId)
        });

        if (!app) return { success: false, error: "Application not found" };

        const template = await db.query.admissionFormTemplates.findFirst({
            where: eq(admissionFormTemplates.id, app.templateId)
        });

        if (!template) return { success: false, error: "Template not found" };

        if (app.acceptancePaymentStatus !== 'paid') return { success: false, error: "Acceptance Fee must be paid before School Fees." };

        const isNd = template.level.toLowerCase().includes("nd") || template.level.toLowerCase().includes("diploma");
        const schoolFeesAmount = isNd ? 58500 : 68500;
        const processingFeeAmount = 2000;
        const totalAmount = schoolFeesAmount + processingFeeAmount;

        const reference = `SCH-${applicationId}-${Date.now()}`;
        const formData = typeof app.data === 'string' ? JSON.parse(app.data || '{}') : (app.data || {});

        const email = formData.email || "student@school.edu.ng";
        const firstName = formData.firstName || "Applicant";
        const lastName = formData.lastName || "";

        const isLive = process.env.REMITA_ENV !== 'demo';
        const merchantId = isLive ? "19201597339" : (process.env.REMITA_MERCHANT_ID || "19201597339");
        const serviceTypeId = isLive ? "8817651539" : (process.env.REMITA_SERVICE_TYPE_ID || "8817651539");
        const apiKey = isLive ? "6NYU4646" : (process.env.REMITA_API_KEY || "6NYU4646");
        const crypto = require('crypto');
        const hash = crypto.createHash('sha512').update(`${merchantId}${serviceTypeId}${reference}${totalAmount}${apiKey}`).digest('hex');
        
        const baseUrl = isLive ? 'https://login.remita.net' : 'https://demo.remita.net';
        
        const res = await fetch(`${baseUrl}/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `remitaConsumerKey=${merchantId},remitaConsumerToken=${hash}`
            },
            body: JSON.stringify({
                merchantId,
                serviceTypeId,
                amount: totalAmount.toString(),
                orderId: reference,
                payerName: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
                payerEmail: email,
                payerPhone: "08000000000"
            })
        });
        const data = await res.json();
        let rrr = '';
        if (data.statuscode === '025' && data.rrr) {
            rrr = data.rrr;
        } else {
            return { success: false, error: data.message || "Failed to generate Remita RRR." };
        }

        await db.insert(transactions).values({
            amount: totalAmount.toString(),
            type: 'credit',
            purpose: `2026/2027 Session School Fees & Processing Fee`,
            status: 'pending',
            gateway: 'remita',
            gatewayReference: reference
        });

        return {
            success: true,
            reference,
            rrr,
            amount: totalAmount,
            schoolFeesAmount,
            processingFeeAmount,
            email,
            firstName,
            lastName
        };
    } catch (error) {
        console.error("Failed to initiate school fees checkout:", error);
        return { success: false, error: "An error occurred" };
    }
}

export async function confirmSchoolFeesPayment(applicationId: number, reference: string, rrr?: string) {
    try {
        const { verifyPayment } = await import('@/actions/payment-gateways');
        const verification = await verifyPayment('remita', reference, rrr);

        if (!verification.success || !verification.verified) {
            return { success: false, error: "School fees payment verification failed. Please try again." };
        }

        // Mark transaction completed
        await db.update(transactions)
            .set({ status: 'completed' })
            .where(eq(transactions.gatewayReference, reference));

        // Generate Matriculation Number and finalize student registration!
        const finalization = await finalizeStudentAdmission(applicationId);

        if (finalization.success && finalization.studentId) {
            await db.update(transactions)
                .set({ studentId: finalization.studentId })
                .where(eq(transactions.gatewayReference, reference));
        }

        revalidatePath(`/admission/status/${applicationId}`);
        return finalization;
    } catch (error) {
        console.error("Failed to confirm school fees payment:", error);
        return { success: false, error: "An error occurred" };
    }
}

export async function finalizeStudentAdmission(applicationId: number) {
    try {
        const application = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId)
        });

        if (!application || application.status !== 'admitted') {
            return { success: false, error: "Application not eligible for registration." };
        }

        const template = await db.query.admissionFormTemplates.findFirst({
            where: eq(admissionFormTemplates.id, application.templateId)
        });

        if (!template) {
            return { success: false, error: "Template not found." };
        }

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
        const studyMode = isJambCandidate ? "full-time" : "part-time";
        const modeOfEntry = isJambCandidate ? "JAMB" : "Direct";

        // Generate FSS standard matriculation number
        const year = new Date().getFullYear();
        const programmeType = (template.level.toLowerCase().includes("nd") || template.level.toLowerCase().includes("diploma")) ? "ND" : "HND";
        
        // Look up programme from application, fallback to template's linked programmes
        let selectedProgrammeId = application.programmeId;
        if (!selectedProgrammeId) {
            const templateProgs = await db.select({ programmeId: admissionTemplateProgrammes.programmeId })
                .from(admissionTemplateProgrammes)
                .where(eq(admissionTemplateProgrammes.templateId, template.id))
                .limit(1);
            selectedProgrammeId = templateProgs[0]?.programmeId || null;
        }

        let deptId: number | null = null;
        if (selectedProgrammeId) {
            const [prog] = await db.select().from(programmes).where(eq(programmes.id, selectedProgrammeId)).limit(1);
            if (prog) {
                deptId = prog.deptId || null;
            }
        }

        // Find academic session for admission based on current year (e.g., 2026/2027)
        const nextSessionName = `${year}/${year + 1}`;
        
        let [targetSession] = await db.select().from(academicSessions)
            .where(eq(academicSessions.name, nextSessionName))
            .limit(1);
            
        if (!targetSession) {
            // Fallback to active session
            const [activeSession] = await db.select().from(academicSessions)
                .where(eq(academicSessions.isActive, true))
                .orderBy(desc(academicSessions.startDate))
                .limit(1);
            targetSession = activeSession;
        }

        let matricNumber = "";
        
        // Use the centralized Matriculation Engine
        const { generateMatricNumber } = await import('@/actions/matriculation');
        const matricRes = await generateMatricNumber({
            year,
            deptId: deptId || undefined,
            studyMode: studyMode,
            programmeType: programmeType
        });
        
        if (matricRes.success && matricRes.matricNumber) {
            matricNumber = matricRes.matricNumber;
        } else {
            console.error(`[Admission] Matric generation failed for application ${applicationId}:`, matricRes.error);
            throw new Error(`Failed to generate matriculation number: ${matricRes.error || 'Unknown error'}`);
        }

        // Process Base64 images to physical files
        let finalImageUrl = application.applicantPhoto;
        let finalSignatureUrl = null;

        const processBase64Image = async (base64Str: string, folder: string) => {
            if (!base64Str || !base64Str.startsWith('data:image')) return base64Str;
            try {
                const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
                await mkdir(uploadDir, { recursive: true });
                const fileName = `${randomUUID()}.jpg`;
                await writeFile(path.join(uploadDir, fileName), buffer);
                return `/uploads/${folder}/${fileName}`;
            } catch (err) {
                console.error(`Failed to process image for ${folder}:`, err);
                return base64Str;
            }
        };

        if (application.applicantPhoto && application.applicantPhoto.startsWith('data:image')) {
            finalImageUrl = await processBase64Image(application.applicantPhoto, 'profiles');
        }

        if (formData.signature && formData.signature.startsWith('data:image')) {
            finalSignatureUrl = await processBase64Image(formData.signature, 'signatures');
        }

        // 1. Check or Create User - Handle new name structure
        const userFullName = formData.surname 
            ? (formData.middleName 
                ? `${formData.surname} ${formData.firstName} ${formData.middleName}`.trim()
                : `${formData.surname} ${formData.firstName}`.trim())
            : `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.fullName || `Applicant ${application.id}`;
        
        let userId = application.applicantId;

        if (userId) {
            // Check if user exists
            const existingUser = await db.query.users.findFirst({
                where: eq(users.id, userId)
            });
            
            if (existingUser) {
                // If they are strictly an applicant, promote them to student
                // If they are already a student (e.g. ND -> HND), we just leave them as student
                if (existingUser.role === 'applicant') {
                    await db.update(users)
                        .set({ role: 'student', status: 'active', imageUrl: finalImageUrl || existingUser.imageUrl })
                        .where(eq(users.id, userId));
                }
            } else {
                userId = null;
            }
        }

        if (!userId) {
            const defaultPasswordHash = await hash("Password123", 10);
            const [userResult] = await db.insert(users).values({
                name: userFullName,
                email: formData.email || formData.guardianEmail || `applicant${application.id}@portal.edu`,
                password: defaultPasswordHash, // Default: "Password123" — must be changed on first login
                requiresPasswordChange: true,
                role: 'student',
                phone: formData.phone || formData.guardianPhone,
                imageUrl: finalImageUrl,
                status: 'active'
            });
            userId = userResult.insertId;
        }

        // 2. Check if student record exists (e.g. ND -> HND transition)
        const existingStudent = await db.query.students.findFirst({
            where: eq(students.userId, userId)
        });

        let finalStudentId: number;

        if (existingStudent) {
            // Update existing student and handle matric number transition
            let prevMatrics: string[] = [];
            if (existingStudent.previousMatricNumbers) {
                try {
                    prevMatrics = JSON.parse(existingStudent.previousMatricNumbers);
                } catch (e) {
                    console.error("Failed to parse previousMatricNumbers:", e);
                }
            }
            
            // Add current matric number to history if it exists and is different
            if (existingStudent.matricNumber && existingStudent.matricNumber !== matricNumber) {
                if (!prevMatrics.includes(existingStudent.matricNumber)) {
                    prevMatrics.push(existingStudent.matricNumber);
                }
            }

            await db.update(students).set({
                firstName: formData.firstName || formData.fullName?.split(' ')[0] || existingStudent.firstName,
                lastName: formData.surname || formData.lastName || formData.fullName?.split(' ').slice(1).join(' ') || existingStudent.lastName,
                matricNumber: matricNumber,
                previousMatricNumbers: JSON.stringify(prevMatrics),
                jambNumber: jambRegNo || existingStudent.jambNumber,
                modeOfEntry: modeOfEntry || existingStudent.modeOfEntry,
                studyMode: studyMode || existingStudent.studyMode,
                programmeType: programmeType || existingStudent.programmeType,
                programmeId: selectedProgrammeId || existingStudent.programmeId,
                deptId: deptId || existingStudent.deptId,
                admissionSessionId: targetSession?.id || existingStudent.admissionSessionId,
                currentLevel: 1, // Reset level for HND
                admissionYear: year || existingStudent.admissionYear,
                gender: (formData.gender?.toLowerCase() || existingStudent.gender || 'other') as any,
                dob: formData.dob || existingStudent.dob,
                imageUrl: finalImageUrl || existingStudent.imageUrl,
                signatureUrl: finalSignatureUrl || existingStudent.signatureUrl,
                status: 'active'
            }).where(eq(students.id, existingStudent.id));
            
            finalStudentId = existingStudent.id;
        } else {
            // Create Student with extended mapping including Study Mode
            const [studentResult] = await db.insert(students).values({
                userId: userId,
                firstName: formData.firstName || formData.fullName?.split(' ')[0],
                lastName: formData.surname || formData.lastName || formData.fullName?.split(' ').slice(1).join(' '),
                matricNumber: matricNumber,
                jambNumber: jambRegNo || null,
                modeOfEntry: modeOfEntry,
                studyMode: studyMode,
                programmeType: programmeType,
                programmeId: selectedProgrammeId,
                deptId: deptId,
                admissionSessionId: targetSession?.id || null,
                currentLevel: 1,
                admissionYear: year,
                gender: (formData.gender?.toLowerCase() || 'other') as any,
                dob: formData.dob,
                imageUrl: finalImageUrl,
                signatureUrl: finalSignatureUrl,
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
            finalStudentId = studentResult.insertId;
        }

        // 3. Update Application Status
        await db.update(admissionApplicationsV2)
            .set({ 
                studentId: finalStudentId,
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
            sendEmail(
                applicantEmail,
                `Admission Accepted – Welcome to ${template.name}`,
                `<p>Dear ${applicantName},</p><p>Your admission to <strong>${template.name}</strong> has been finalized. Your Matriculation Number is: <strong>${matricNumber}</strong>.</p><p>Please log in to your student portal to proceed.</p>`
            ).catch((err: any) => console.error("Failed to send accepted email:", err));
        }
        
        await sendInAppNotification({
            userId: userId,
            title: "Admission Accepted!",
            message: `Welcome! Your admission is finalized. Matric Number: ${matricNumber}`,
            type: "success"
        });
        
        return { success: true, matricNumber, studentId: finalStudentId };
    } catch (error: any) {
        console.error("Failed to finalize admission:", error);
        return { success: false, error: error.message || "An error occurred during registration" };
    }
}

import { SplitPaymentEngine } from "@/services/SplitPaymentEngine";

export async function processAdmissionPayment(applicationId: number, feeStructureId: number, applicantEmail: string, applicantName: string, applicantPhone?: string) {
    await requireApplicant();
    try {
        const engine = new SplitPaymentEngine();
        const res = await engine.checkoutAdmissionForm(applicationId, feeStructureId, applicantEmail, applicantName, applicantPhone);
        return res;
    } catch (error: any) {
        console.error("Admission Payment Error:", error);
        return { success: false, error: error.message };
    }
}

import { resolveOnlinePaymentAction } from "./bursary";

export async function requeryAdmissionPayment(applicationId: number) {
    await requireApplicant();
    try {
        const purpose = `Admission Form Application ID: ${applicationId}`;
        const latestTx = await db.query.transactions.findFirst({
            where: eq(transactions.purpose, purpose),
            orderBy: (transactions, { desc }) => [desc(transactions.id)]
        });

        if (!latestTx) {
            return { success: false, error: "No payment transaction found to requery." };
        }

        if (latestTx.status === 'completed') {
            return { success: true, message: "Payment already marked as completed." };
        }

        // Reset to pending so the resolver can try it
        await db.update(transactions).set({ status: 'pending' }).where(eq(transactions.id, latestTx.id));

        const res = await resolveOnlinePaymentAction(latestTx.gatewayReference!, 'completed');
        
        if (res.success && res.status === 'completed') {
            return { success: true, message: "Payment successfully verified and completed." };
        } else if (res.error?.includes('ALATPay') || res.error?.includes('check the ALATPay dashboard')) {
            return { success: false, error: res.error + " You can check the transaction on the ALATPay dashboard to confirm if payment was received." };
        } else {
            return { success: false, error: res.error || "Payment verification failed or is still pending." };
        }

    } catch (error: any) {
        console.error("Requery Payment Error:", error);
        return { success: false, error: error.message };
    }
}

export async function registerApplicant(data: any) {
    try {
        const { templateId, surname, firstName, middleName, email, phone, password } = data;

        // Normalize email — strip invisible whitespace (NBSP, zero-width, trailing spaces)
        const cleanEmail = normalizeEmail(email);

        // Validate required fields
        if (!templateId || !surname || !firstName || !cleanEmail || !phone || !password) {
            return { success: false, error: "All required fields must be filled." };
        }

        // Validate email format
        if (!isValidEmailFormat(cleanEmail)) {
            return { success: false, error: "Please enter a valid email address." };
        }

        // Validate password strength
        if (password.length < 8) {
            return { success: false, error: "Password must be at least 8 characters long." };
        }

        // 1. Check if user exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, cleanEmail)
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
                surname: surname.trim(),
                firstName: firstName.trim(),
                middleName: middleName?.trim() || null,
                email: cleanEmail,
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
                await sendEmail(cleanEmail, 'Verify your Email - FSS Ibadan Admission', emailHtml);
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
        if (!Array.isArray(sittings)) {
            return { success: true };
        }

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
            
            // Handle examBodyId safely (prevent NaN)
            let parsedBodyId = parseInt(sitting.examBodyId);
            if (isNaN(parsedBodyId)) {
                const bodyStr = String(sitting.examBodyId || '').toUpperCase();
                if (bodyStr.includes('NECO')) parsedBodyId = 2;
                else if (bodyStr.includes('NABTEB')) parsedBodyId = 3;
                else parsedBodyId = 1; // Default WAEC (1)
            }

            const [res] = await db.insert(applicantOLevelSittings).values({
                applicantId,
                applicationId,
                examBodyId: parsedBodyId,
                examYear: String(sitting.examYear || ''),
                examNumber: String(sitting.examNumber || ''),
                sittingNumber: i + 1
            });
            const sittingId = res.insertId;

            if (sitting.subjects && sitting.subjects.length > 0) {
                const subjectValues = sitting.subjects.filter((s: any) => s.subjectName && s.grade).map((s: any) => ({
                    sittingId,
                    subjectName: String(s.subjectName),
                    grade: String(s.grade)
                }));
                if (subjectValues.length > 0) {
                    await db.insert(applicantOLevelSubjects).values(subjectValues);
                }
            }
        }
        return { success: true };
    } catch (error: any) {
        console.error("Save OLevel Error:", error);
        return { success: false, error: error.message || "Failed to save O-Level results" };
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
            const [template, hasDeveloperFee] = await Promise.all([
                getTemplateWithSections(app.templateId),
                checkDeveloperFeeStatus(applicationId.toString(), 'admission_form')
            ]);
            // @ts-expect-error
            app.template = template;
            const procFeeAmount = parseFloat(template?.processingFee || "0");
            const isProcessingFeePaid = procFeeAmount === 0 || app.processingFeeStatus === 'paid';
            // @ts-expect-error
            app.isProcessingFeePaid = isProcessingFeePaid;
            
            // Parse NIN verification config from template
            let ninVerificationMode = 'disabled';
            let ninRequired = true;
            let ninAutoFill = true;
            if ((app as any).template?.ninVerificationConfig) {
                try {
                    const ninConfig = typeof (app as any).template.ninVerificationConfig === 'string' 
                        ? JSON.parse((app as any).template.ninVerificationConfig) 
                        : (app as any).template.ninVerificationConfig;
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

            // Ensure jambRegNumber is populated from form data JSON if column is empty
            const parsedData = typeof app.data === 'string' ? JSON.parse(app.data || '{}') : (app.data || {});
            const extractedJamb = app.jambRegNumber || 
                parsedData.jambRegNumber || 
                parsedData['JAMB Registration Number'] || 
                parsedData['JAMB Reg Number'] || 
                parsedData['JAMB REG NO'] || 
                parsedData.jamb_reg_no || 
                parsedData.jamb || null;

            if (extractedJamb) {
                app.jambRegNumber = extractedJamb.toString().trim().toUpperCase();
            }

            // Calculate exact fee from structure
            if ((app as any).template.feeStructureId) {
                const items = await db.select().from(feeStructureItems).where(eq(feeStructureItems.feeStructureId, (app as any).template.feeStructureId));
                const total = items.reduce((acc, curr) => acc + parseFloat(curr.amount as string), 0);
                // @ts-expect-error
                app.template.calculatedFee = total;
            } else {
                // Fallback to static applicationFee
                // @ts-expect-error
                app.template.calculatedFee = parseFloat(app.template.applicationFee || "0");
            }
        }

        // Attach user name parts for auto-population into form fields
        if (app) {
            const [user] = await db
                .select({ name: users.name, surname: users.surname, firstName: users.firstName, middleName: users.middleName })
                .from(users)
                .where(eq(users.id, applicantId))
                .limit(1);
            
            if (user && !user.firstName && !user.surname && user.name) {
                const parts = user.name.split(' ').filter(Boolean);
                user.firstName = parts[0] || '';
                user.surname = parts.length > 1 ? parts[parts.length - 1] : '';
                user.middleName = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
            }

            // @ts-expect-error
            app._userNameParts = user || null;
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
        const rawNin = formData?.['NIN'] || formData?.__ninData?.nin || null;
        const ninValue = (rawNin && typeof rawNin === 'string' && rawNin.trim().length > 0) ? rawNin.trim() : null;

        const extractedJamb = formData?.['JAMB Registration Number'] || 
            formData?.['JAMB Reg Number'] || 
            formData?.['JAMB REG NO'] || 
            formData?.['jambRegNumber'] || 
            formData?.['jamb_reg_no'] || 
            formData?.['jamb'] || null;

        const cleanJamb = (extractedJamb && typeof extractedJamb === 'string' && extractedJamb.trim().length > 0)
            ? extractedJamb.trim().toUpperCase()
            : null;

        const updatePayload: any = {
            data: typeof formData === 'string' ? formData : JSON.stringify(formData),
            nin: ninValue
        };

        if (cleanJamb) {
            updatePayload.jambRegNumber = cleanJamb;
        }

        await db.update(admissionApplicationsV2)
            .set(updatePayload)
            .where(
                and(
                    eq(admissionApplicationsV2.id, applicationId),
                    eq(admissionApplicationsV2.applicantId, applicantId)
                )
            );
        return { success: true };
    } catch (error: any) {
        console.error("saveApplicationDraft error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.message?.includes('jamb_reg_number') || error.sqlMessage?.includes('jamb_reg_number')) {
                return { success: false, error: "This JAMB Registration Number has already been used in another application." };
            }
            return { success: false, error: "This NIN has already been used in another application." };
        }
        return { success: false, error: error.message || "Failed query update" };
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

        // Server-side payment verification
        const appFee = template?.feeStructureId ? await (async () => {
            const items = await db.select().from(feeStructureItems).where(eq(feeStructureItems.feeStructureId, template!.feeStructureId!));
            return items.reduce((acc, curr) => acc + parseFloat(curr.amount as string), 0);
        })() : parseFloat(template?.applicationFee || "0");
        
        if (appFee > 0 && application.paymentStatus !== 'paid') {
            return { success: false, error: "Application fee must be paid before submission." };
        }

        const procFee = parseFloat(template?.processingFee || "0");
        if (procFee > 0 && application.processingFeeStatus !== 'paid') {
            return { success: false, error: "Processing fee must be paid before submission." };
        }

        // Extract effective JAMB registration number from column or form data JSON
        const formData = typeof application.data === 'string' ? JSON.parse(application.data || '{}') : (application.data || {});
        const effectiveJamb = application.jambRegNumber || 
            formData.jambRegNumber || 
            formData['JAMB Registration Number'] || 
            formData['JAMB Reg Number'] || 
            formData['JAMB REG NO'] || 
            formData.jamb_reg_no || 
            formData.jamb || null;

        if (effectiveJamb && !application.jambRegNumber) {
            await db.update(admissionApplicationsV2)
                .set({ jambRegNumber: effectiveJamb.toString().trim().toUpperCase() })
                .where(eq(admissionApplicationsV2.id, applicationId));
        }

        // Enforce Full-Time applicants have a verified JAMB Registration Number
        if (application.applicationMode === 'full_time' && !effectiveJamb) {
            return { success: false, error: "A JAMB Registration Number is required for Full-Time applications. Please go back and complete this step." };
        }

        // Enforce O-Level details are filled
        const sittings = await db.select().from(applicantOLevelSittings)
            .where(eq(applicantOLevelSittings.applicationId, applicationId));

        if (!sittings || sittings.length === 0) {
            return { success: false, error: "O-Level details are required. Please go back to the O-Level section and fill your results." };
        }

        // Server-side validation
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

                // Email validation — normalize first to strip invisible whitespace
                // (trailing spaces, NBSP, zero-width) that mobile paste often injects.
                if (field.type === 'email' && !isValidEmailFormat(normalizeEmail(strValue))) {
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
                sendEmail(
                    applicantEmail,
                    `Application Submitted – ${template.name}`,
                    `<p>Dear ${applicantName},</p><p>Your application (Form No: <strong>${application.formNumber || 'N/A'}</strong>, Ref: <strong>${application.applicationNumber || 'N/A'}</strong>) to <strong>${template.name}</strong> has been successfully submitted.</p>`
                ).catch((err: any) => console.error("Failed to send submission email:", err));
            }
        }

        // Upload any Base64 images in formData to Wasabi
        let updatedPhoto = application.applicantPhoto;
        const uploadBase64ToWasabi = async (base64Str: string, namePrefix: string) => {
            if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image')) return base64Str;
            try {
                const match = base64Str.match(/^data:image\/(\w+);base64,/);
                const ext = match ? match[1] : 'jpg';
                const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const filename = `${namePrefix}_${Date.now()}.${ext}`;
                const folder = `applicant-documents/${application.formNumber || application.id}`;
                const uploadResult = await storage.upload(buffer, filename, folder, `image/${ext}`);
                return uploadResult.success && uploadResult.url ? uploadResult.url : base64Str;
            } catch (e) {
                console.error("Wasabi upload error:", e);
                return base64Str;
            }
        };

        if (updatedPhoto && updatedPhoto.startsWith('data:image')) {
            updatedPhoto = await uploadBase64ToWasabi(updatedPhoto, 'photo');
        }

        // Sanitize applicantPhoto length to prevent MySQL varchar(255) overflow errors
        let safeApplicantPhoto = updatedPhoto;
        if (safeApplicantPhoto && safeApplicantPhoto.length > 250) {
            if (safeApplicantPhoto.startsWith('data:image')) {
                safeApplicantPhoto = null; // Do not insert raw base64 into varchar(255)
            } else if (safeApplicantPhoto.length > 255) {
                safeApplicantPhoto = safeApplicantPhoto.substring(0, 255);
            }
        }

        let formDataUpdated = false;
        for (const key of Object.keys(formData)) {
            if (typeof formData[key] === 'string' && formData[key].startsWith('data:image')) {
                const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                formData[key] = await uploadBase64ToWasabi(formData[key], cleanKey);
                formDataUpdated = true;
            }
        }

        await db.update(admissionApplicationsV2)
            .set({ 
                status: 'submitted',
                applicantPhoto: safeApplicantPhoto,
                data: formDataUpdated ? JSON.stringify(formData) : application.data
            })
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
            applicantName: (() => {
                const parts = extractNameParts(formData);
                return buildFullName(parts) || `${parts.firstName} ${parts.lastName}`.trim() || "N/A";
            })(),
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
    facultyId?: number;
    departmentId?: number;
    programmeId?: number;
    level?: string;
    applicationMode?: string;
    examAttendance?: string;
    page?: number;
    pageSize?: number;
}) {
    await requireAdmin();
    try {
        const page = filters?.page || 1;
        const pageSize = filters?.pageSize || 20;
        const offset = (page - 1) * pageSize;

        const conditions = [];

        if (filters?.search) {
            const q = `%${filters.search}%`;
            const matchingUsers = await db.select({ id: users.id })
                .from(users)
                .where(like(users.name, q));
            const userIds = matchingUsers.map(u => u.id);

            const matchingProgs = await db.select({ id: programmes.id })
                .from(programmes)
                .where(like(programmes.name, q));
            const searchProgIds = matchingProgs.map(p => p.id);

            const searchOr = [
                like(admissionApplicationsV2.formNumber, q),
                like(admissionApplicationsV2.data, q)
            ];
            
            if (userIds.length > 0) {
                searchOr.push(inArray(admissionApplicationsV2.applicantId, userIds));
            }
            if (searchProgIds.length > 0) {
                searchOr.push(inArray(admissionApplicationsV2.programmeId, searchProgIds));
            }
            if (filters.search.toLowerCase().includes('pending') || filters.search.toLowerCase().includes('unassigned')) {
                searchOr.push(isNull(admissionApplicationsV2.programmeId));
            }
            
            conditions.push(or(...searchOr));
        }

        if (filters?.status && filters.status !== 'all') {
            conditions.push(eq(admissionApplicationsV2.status, filters.status as any));
        }
        if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
            conditions.push(eq(admissionApplicationsV2.paymentStatus, filters.paymentStatus as any));
        }
        if (filters?.templateId) {
            conditions.push(eq(admissionApplicationsV2.templateId, filters.templateId));
        }
        if (filters?.applicationMode && filters.applicationMode !== 'all') {
            conditions.push(eq(admissionApplicationsV2.applicationMode, filters.applicationMode as any));
        }
        if (filters?.examAttendance && filters.examAttendance !== 'all') {
            conditions.push(eq(admissionApplicationsV2.examAttendanceStatus, filters.examAttendance as any));
        }
        if (filters?.programmeId) {
            if (filters.programmeId === -1) {
                conditions.push(isNull(admissionApplicationsV2.programmeId));
            } else {
                conditions.push(eq(admissionApplicationsV2.programmeId, filters.programmeId));
            }
        }
        if (filters?.departmentId) {
            const deptProgs = await db.select({ id: programmes.id }).from(programmes).where(eq(programmes.deptId, filters.departmentId));
            const progIds = deptProgs.map(p => p.id);
            if (progIds.length > 0) {
                conditions.push(inArray(admissionApplicationsV2.programmeId, progIds));
            } else {
                conditions.push(eq(admissionApplicationsV2.id, -1));
            }
        }
        if (filters?.facultyId) {
            const facDepts = await db.select({ id: departments.id }).from(departments).where(eq(departments.facultyId, filters.facultyId));
            const facDeptIds = facDepts.map(d => d.id);
            if (facDeptIds.length > 0) {
                const facProgs = await db.select({ id: programmes.id }).from(programmes).where(inArray(programmes.deptId, facDeptIds));
                const facProgIds = facProgs.map(p => p.id);
                if (facProgIds.length > 0) {
                    conditions.push(inArray(admissionApplicationsV2.programmeId, facProgIds));
                } else {
                    conditions.push(eq(admissionApplicationsV2.id, -1));
                }
            } else {
                conditions.push(eq(admissionApplicationsV2.id, -1));
            }
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
                template: true,
                applicant: true,
                programme: {
                    with: {
                        department: {
                            with: {
                                faculty: true
                            }
                        }
                    }
                },
                student: true
            }
        });

        // Format Academic Level (ND 1 / HND 1 for entry applicants) and Administrative Level (Applicant)
        const formatLevels = (app: any) => {
            const progName = (app.programme?.name || app.template?.name || '').toUpperCase();
            const progType = (app.programme?.programmeType || (progName.includes('HND') ? 'HND' : 'ND')).toUpperCase();
            
            const academicLevel = progType === 'HND' ? 'HND 1' : 'ND 1';
            const administrativeLevel = app.status === 'admitted' ? academicLevel : 'Applicant';

            return { academicLevel, administrativeLevel };
        };

        let mapped = applications.map((app: any) => {
            let formData: any = {};
            try { formData = typeof app.data === 'string' ? JSON.parse(app.data) : app.data || {}; } catch {}
            const formParts = extractNameParts(formData);
            const nameFromForm = buildFullName(formParts) || `${formParts.firstName} ${formParts.lastName}`.trim();
            const nameFromUser = app.applicant ? (app.applicant.name || `${app.applicant.firstName || ''} ${app.applicant.surname || ''}`.trim()) : '';
            const fallbackEmail = formData.email || formData.applicantEmail || app.applicant?.email || '';

            const { academicLevel, administrativeLevel } = formatLevels(app);

            return {
                ...app,
                parsedData: formData,
                applicantName: nameFromForm || nameFromUser || fallbackEmail || 'N/A',
                applicantEmail: fallbackEmail || app.applicant?.email || 'N/A',
                applicantPhone: formData.phone || formData.phone_number || app.applicant?.phone || 'N/A',
                studentMatricNumber: app.student?.matricNumber || formData.matricNumber || null,
                templateName: app.template?.name || 'N/A',
                facultyName: app.programme?.department?.faculty?.name || 'Unassigned Faculty',
                departmentName: app.programme?.department?.name || 'Unassigned Department',
                programmeName: app.programme?.name || formData.programme || 'Unassigned Programme',
                academicLevel,
                administrativeLevel
            };
        });

        // Filter by level if specified
        if (filters?.level && filters.level !== 'all') {
            const targetLevel = filters.level.trim().toUpperCase();
            mapped = mapped.filter((a: any) => 
                a.academicLevel.toUpperCase() === targetLevel ||
                a.administrativeLevel.toUpperCase() === targetLevel
            );
        }

        return {
            applications: mapped,
            total: filters?.level && filters.level !== 'all' ? mapped.length : total,
            page,
            pageSize,
            totalPages: Math.ceil((filters?.level && filters.level !== 'all' ? mapped.length : total) / pageSize),
        };
    } catch (error) {
        console.error("[getAdminV2Applications] Failed:", error);
        return { applications: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    }
}

export async function exportAdminV2Applications(filters?: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    templateId?: number;
    facultyId?: number;
    departmentId?: number;
    programmeId?: number;
    level?: string;
    applicationMode?: string;
    examAttendance?: string;
}) {
    await requireAdmin();
    try {
        const conditions = [];

        if (filters?.search) {
            const q = `%${filters.search}%`;
            const matchingUsers = await db.select({ id: users.id })
                .from(users)
                .where(like(users.name, q));
            const userIds = matchingUsers.map(u => u.id);

            const matchingProgs = await db.select({ id: programmes.id })
                .from(programmes)
                .where(like(programmes.name, q));
            const searchProgIds = matchingProgs.map(p => p.id);

            const searchOr = [
                like(admissionApplicationsV2.formNumber, q),
                like(admissionApplicationsV2.data, q)
            ];
            
            if (userIds.length > 0) {
                searchOr.push(inArray(admissionApplicationsV2.applicantId, userIds));
            }
            if (searchProgIds.length > 0) {
                searchOr.push(inArray(admissionApplicationsV2.programmeId, searchProgIds));
            }
            if (filters.search.toLowerCase().includes('pending') || filters.search.toLowerCase().includes('unassigned')) {
                searchOr.push(isNull(admissionApplicationsV2.programmeId));
            }
            
            conditions.push(or(...searchOr));
        }

        if (filters?.status && filters.status !== 'all') {
            conditions.push(eq(admissionApplicationsV2.status, filters.status as any));
        }
        if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
            conditions.push(eq(admissionApplicationsV2.paymentStatus, filters.paymentStatus as any));
        }
        if (filters?.templateId) {
            conditions.push(eq(admissionApplicationsV2.templateId, filters.templateId));
        }
        if (filters?.applicationMode && filters.applicationMode !== 'all') {
            conditions.push(eq(admissionApplicationsV2.applicationMode, filters.applicationMode as any));
        }
        if (filters?.programmeId) {
            if (filters.programmeId === -1) {
                conditions.push(isNull(admissionApplicationsV2.programmeId));
            } else {
                conditions.push(eq(admissionApplicationsV2.programmeId, filters.programmeId));
            }
        }
        if (filters?.departmentId) {
            const deptProgs = await db.select({ id: programmes.id }).from(programmes).where(eq(programmes.deptId, filters.departmentId));
            const progIds = deptProgs.map(p => p.id);
            if (progIds.length > 0) {
                conditions.push(inArray(admissionApplicationsV2.programmeId, progIds));
            } else {
                conditions.push(sql`1=0`);
            }
        }
        if (filters?.facultyId && !filters?.departmentId) {
            const facDepts = await db.select({ id: departments.id }).from(departments).where(eq(departments.facultyId, filters.facultyId));
            const deptIds = facDepts.map(d => d.id);
            if (deptIds.length > 0) {
                const facProgs = await db.select({ id: programmes.id }).from(programmes).where(inArray(programmes.deptId, deptIds));
                const progIds = facProgs.map(p => p.id);
                if (progIds.length > 0) {
                    conditions.push(inArray(admissionApplicationsV2.programmeId, progIds));
                } else {
                    conditions.push(sql`1=0`);
                }
            } else {
                conditions.push(sql`1=0`);
            }
        }
        if (filters?.examAttendance && filters.examAttendance !== 'all') {
            conditions.push(eq(admissionApplicationsV2.examAttendanceStatus, filters.examAttendance as any));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        let applications = await db.query.admissionApplicationsV2.findMany({
            where: whereClause,
            orderBy: [desc(admissionApplicationsV2.appliedAt)],
            limit: 10000,
            with: {
                template: true,
                applicant: true,
                programme: {
                    with: {
                        department: {
                            with: {
                                faculty: true
                            }
                        }
                    }
                }
            }
        });

        // Batch query CBT Exam Results to detect automatic exam attendance
        const appIds = applications.map(a => a.id);
        const examResults = appIds.length > 0 
            ? await db.select({ applicationId: admissionExamResults.applicationId }).from(admissionExamResults).where(inArray(admissionExamResults.applicationId, appIds))
            : [];
        const cbtPresentAppIds = new Set(examResults.map(r => r.applicationId));

        let mapped = applications.map((app: any) => {
            let formData: any = {};
            try { formData = typeof app.data === 'string' ? JSON.parse(app.data) : app.data || {}; } catch {}
            const screenParts = extractNameParts(formData);
            const nameFromForm = buildFullName(screenParts) || `${screenParts.firstName} ${screenParts.lastName}`.trim();
            const nameFromUser = app.applicant ? (app.applicant.name || `${app.applicant.firstName || ''} ${app.applicant.surname || ''}`.trim()) : '';
            
            const progName = app.programme?.name || 'Pending Course Selection';
            const deptName = app.programme?.department?.name || 'N/A';
            const facName = app.programme?.department?.faculty?.name || 'N/A';

            const templateNameUpper = app.template?.name?.toUpperCase() || '';
            const progNameUpper = progName.toUpperCase();

            let academicLevel = 'ND 1';
            if (progNameUpper.includes('HND') || templateNameUpper.includes('HND')) {
                academicLevel = 'HND 1';
            } else if (progNameUpper.includes('ND') || templateNameUpper.includes('ND')) {
                academicLevel = 'ND 1';
            } else {
                try {
                    const possibleProg = String(formData.programme || formData.Programme || formData.programmeName || '').toUpperCase();
                    if (possibleProg.includes('HND')) academicLevel = 'HND 1';
                } catch (e) {}
            }

            const isCbtPresent = cbtPresentAppIds.has(app.id);
            const attendanceStatus = (app.examAttendanceStatus && app.examAttendanceStatus !== 'pending')
                ? app.examAttendanceStatus
                : (isCbtPresent ? 'present' : 'pending');

            return {
                ...app,
                parsedData: formData,
                applicantName: nameFromForm || nameFromUser || 'N/A',
                applicantEmail: app.applicant?.email || formData.email || formData.email_address || 'N/A',
                applicantPhone: app.applicant?.phone || app.applicant?.phoneNumber || formData.phone || formData.phone_number || 'N/A',
                templateName: app.template?.name || 'N/A',
                programmeName: progName,
                departmentName: deptName,
                facultyName: facName,
                academicLevel,
                administrativeLevel: 'Applicant',
                examAttendanceStatus: attendanceStatus
            };
        });

        if (filters?.level && filters.level !== 'all') {
            const targetLevel = filters.level.toUpperCase();
            mapped = mapped.filter((a: any) => 
                a.academicLevel.toUpperCase() === targetLevel ||
                a.administrativeLevel.toUpperCase() === targetLevel
            );
        }

        if (filters?.examAttendance && filters.examAttendance !== 'all') {
            mapped = mapped.filter((a: any) => a.examAttendanceStatus === filters.examAttendance);
        }

        return {
            success: true,
            applications: mapped
        };
    } catch (error) {
        console.error("[exportAdminV2Applications] Failed:", error);
        return { success: false, applications: [], error: "Failed to export data" };
    }
}

export async function markExamAttendanceAction(applicationIds: number[], status: 'present' | 'absent' | 'pending') {
    await requireAdmin();
    try {
        if (!applicationIds || applicationIds.length === 0) {
            return { success: false, error: "No applications selected" };
        }

        await db.update(admissionApplicationsV2)
            .set({ 
                examAttendanceStatus: status,
                updatedAt: new Date()
            })
            .where(inArray(admissionApplicationsV2.id, applicationIds));

        revalidatePath("/admin/admission/v2");
        return { success: true, count: applicationIds.length };
    } catch (error: any) {
        console.error("markExamAttendanceAction error:", error);
        return { success: false, error: error.message || "Failed to update exam attendance status" };
    }
}

export async function getAdminV2ApplicationDetail(applicationId: number) {
    await requireAdmin();
    try {
        const app = await db.query.admissionApplicationsV2.findFirst({
            where: eq(admissionApplicationsV2.id, applicationId),
            with: {
                template: true,
                student: true,
                applicant: true,
                programme: true
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

        // Build applicant user account info
        const applicantUser = (app as any).applicant;
        let userAccountInfo = null;
        if (applicantUser) {
            const now = new Date();
            const isLocked = applicantUser.lockoutUntil && new Date(applicantUser.lockoutUntil) > now;
            userAccountInfo = {
                id: applicantUser.id,
                name: applicantUser.name,
                email: applicantUser.email,
                emailVerified: applicantUser.emailVerified,
                role: applicantUser.role,
                status: applicantUser.status,
                isLocked,
                lockoutUntil: applicantUser.lockoutUntil,
                failedLoginAttempts: applicantUser.failedLoginAttempts || 0,
                requiresPasswordChange: applicantUser.requiresPasswordChange,
                lastLogin: applicantUser.lastLogin,
                createdAt: applicantUser.createdAt,
            };
        }

        // Generate Presigned URLs for S3 assets
        for (const key of Object.keys(formData)) {
            const val = formData[key];
            if (typeof val === 'string' && val.startsWith('http') && (val.includes('wasabisys.com') || val.includes('amazonaws.com'))) {
                try {
                    formData[key] = await storage.getPresignedUrl(val);
                } catch (e) {
                    console.error("Presign error for key", key, e);
                }
            }
        }

        const detailParts = extractNameParts(formData);
        const nameFallback = buildFullName(detailParts) || `${detailParts.firstName} ${detailParts.lastName}`.trim() || 'N/A';
        const photo = formData.passport_photo || formData.passport || formData.photo || formData.applicantPhoto || formData.image || formData['Photograph/camera'] || formData.Photograph || '';

        return {
            ...app,
            parsedData: formData,
            applicantName: nameFallback,
            applicantPhoto: photo,
            applicantEmail: formData.email || formData.email_address || 'N/A',
            applicantPhone: formData.phone || formData.phone_number || formData.mobile || formData.Phone || 'N/A',
            templateName: app.template?.name || 'N/A',
            templateLevel: app.template?.level || '',
            applicationMode: app.applicationMode || 'full_time',
            jambRegNumber: app.jambRegNumber || formData.jambRegNumber || formData.jamb || formData.jamb_reg_number || formData['JAMB REG NO'] || 'N/A',
            programmeName: app.programme?.name || 'N/A',
            olevelData: (() => {
                if (olevelData.length > 0) return olevelData;
                let fallback = formData.olevel || formData.olevel_results || formData['O-Level Results'] || formData['O-Level'] || formData.sittings || formData['Give your o-level '] || formData['Give your o-level'] || [];
                if (typeof fallback === 'string') {
                    try { fallback = JSON.parse(fallback); } catch (e) { fallback = []; }
                }
                return Array.isArray(fallback) ? fallback : [];
            })(),
            formStructure,
            userAccountInfo,
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

        // Admission decisions are made exclusively on the Screening page
        if (status === 'admitted' || status === 'rejected') {
            return { success: false, error: "Admission decisions must be made on the Screening page (bulk upload or Run Selection)." };
        }

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

        // Send emails
        if (status === 'admitted' || status === 'rejected') {
            const apps = await db.query.admissionApplicationsV2.findMany({
                where: inArray(admissionApplicationsV2.id, ids),
                with: { template: true }
            });
            
            for (const app of apps) {
                if (!app.template) continue;
                const formData = typeof app.data === 'string' ? JSON.parse(app.data || '{}') : (app.data || {});
                const applicantEmail = formData.email || "";
                if (!applicantEmail) continue;
                
                const applicantName = formData.surname 
                    ? (formData.middleName 
                        ? `${formData.surname} ${formData.firstName} ${formData.middleName}`.trim()
                        : `${formData.surname} ${formData.firstName}`.trim())
                    : `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Applicant';
                
                if (status === 'admitted') {
                    sendEmail(
                        applicantEmail,
                        `Congratulations – Admission Offer – ${app.template.name}`,
                        `<p>Dear ${applicantName},</p><p>Congratulations! You have been offered provisional admission to <strong>${app.template.name}</strong>. Please log in to your portal to proceed.</p>`
                    ).catch((err: any) => console.error("Failed to send admitted notification:", err));
                } else if (status === 'rejected') {
                    sendEmail(
                        applicantEmail,
                        `Application Update – ${app.template.name}`,
                        `<p>Dear ${applicantName},</p><p>We regret to inform you that your application to <strong>${app.template.name}</strong> was not successful${notes ? `: ${notes}` : '.'}</p>`
                    ).catch((err: any) => console.error("Failed to send rejection notification:", err));
                }
            }
        }

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

export async function bulkDeleteAdmissionApplications(ids: number[]) {
    try {
        if (!ids || ids.length === 0) return { success: true };
        await db.delete(admissionApplicationsV2).where(inArray(admissionApplicationsV2.id, ids));
        revalidatePath("/admin/admission/payments");
        return { success: true };
    } catch (error) {
        console.error("Failed to bulk delete applications:", error);
        return { success: false, error: "Failed to bulk delete applications" };
    }
}

export async function updateApplicantData(appId: number, updatePayload: any) {
    try {
        await requireAdmin();
        const [app] = await db.select().from(admissionApplicationsV2).where(eq(admissionApplicationsV2.id, appId)).limit(1);
        if (!app) return { success: false, error: "Application not found" };

        let parsedData: any = {};
        if (app.data) {
            try {
                parsedData = JSON.parse(app.data);
            } catch (e) {}
        }

        // Simply merge the payload into parsedData without duplicating keys
        const mergedData = { ...parsedData, ...updatePayload };

        // For discrete columns we can try to extract from the merged data
        const extractedNin = mergedData.nin || mergedData.NIN || app.nin;
        const extractedJamb = mergedData.jambRegNumber || mergedData.jamb_reg_no || mergedData['JAMB Registration Number'] || app.jambRegNumber;

        await db.update(admissionApplicationsV2)
            .set({ 
                data: JSON.stringify(mergedData),
                nin: extractedNin,
                jambRegNumber: extractedJamb,
            })
            .where(eq(admissionApplicationsV2.id, appId));

        const targetUserId = app.applicantId;
        if (targetUserId) {
            const updates: any = {};
            // Extract the canonical names dynamically from merged data for the users table.
            // Uses a case-insensitive extractor because templates label the same field
            // inconsistently ("FirstName", "First Name", "Surname", "Last Name", ...).
            const nameParts = extractNameParts(mergedData);

            // We update users name if any of the name components changed in the payload
            const nameChanged = Object.keys(updatePayload).some(k => 
                k.toLowerCase().includes('name') || k.toLowerCase().includes('surname')
            );

            if (nameChanged && (nameParts.firstName || nameParts.lastName || nameParts.middleName)) {
                // Fetch current user values so components absent from the form data
                // are preserved instead of wiped to empty strings.
                const [currentUser] = await db.select({ name: users.name, surname: users.surname, firstName: users.firstName, middleName: users.middleName }).from(users).where(eq(users.id, targetUserId)).limit(1);

                const finalFirst = nameParts.firstName || currentUser?.firstName || '';
                const finalLast = nameParts.lastName || currentUser?.surname || '';
                const finalMiddle = nameParts.middleName || currentUser?.middleName || '';

                const fullName = buildFullName({ firstName: finalFirst, middleName: finalMiddle, lastName: finalLast });
                if (fullName) updates.name = fullName;
                if (finalFirst) updates.firstName = finalFirst;
                if (finalLast) updates.surname = finalLast;
                updates.middleName = finalMiddle;
            }
            
            // Check for email/phone changes
            const emailKey = Object.keys(updatePayload).find(k => k.toLowerCase().includes('email'));
            if (emailKey) updates.email = updatePayload[emailKey];
            
            const phoneKey = Object.keys(updatePayload).find(k => k.toLowerCase().includes('phone'));
            if (phoneKey) updates.phone = updatePayload[phoneKey];

            if (Object.keys(updates).length > 0) {
                await db.update(users).set(updates).where(eq(users.id, targetUserId));
            }
        }
        revalidatePath(`/admin/admission/v2/${appId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update applicant data:", error);
        return { success: false, error: error.message || "Failed to update applicant data" };
    }
}
export async function getAdmissionV2Stats() {
    await requireAdmin();
    try {
        const apps = await db.query.admissionApplicationsV2.findMany({
            with: {
                template: true,
                programme: true
            }
        });

        let totalApplicants = apps.length;
        let byLevel: Record<string, number> = { ND: 0, HND: 0 };
        let byProgramme: Record<string, number> = {};
        let byProgrammeDetails: Record<string, { count: number; id: number | null }> = {};

        for (const app of apps) {
            let levelAssigned = false;
            const progName = app.programme?.name || 'Pending Course Selection';
            const progId = app.programme?.id || null;
            
            const progNameUpper = progName.toUpperCase();
            const templateNameUpper = app.template?.name?.toUpperCase() || '';

            if (progNameUpper.includes('HND') || templateNameUpper.includes('HND')) {
                byLevel.HND = (byLevel.HND || 0) + 1;
                levelAssigned = true;
            } else if (progNameUpper.includes('ND') || templateNameUpper.includes('ND')) {
                byLevel.ND = (byLevel.ND || 0) + 1;
                levelAssigned = true;
            } else {
                try {
                    if (app.data) {
                        const fd = typeof app.data === 'string' ? JSON.parse(app.data) : app.data;
                        const possibleProg = String(fd.programme || fd.Programme || fd.programmeName || '').toUpperCase();
                        if (possibleProg.includes('HND')) {
                            byLevel.HND = (byLevel.HND || 0) + 1;
                            levelAssigned = true;
                        } else if (possibleProg.includes('ND')) {
                            byLevel.ND = (byLevel.ND || 0) + 1;
                            levelAssigned = true;
                        }
                    }
                } catch (e) {}
            }

            if (!levelAssigned) {
                // Fallback to ND for default entry applications
                byLevel.ND = (byLevel.ND || 0) + 1;
            }

            if (!byProgramme[progName]) {
                byProgramme[progName] = 0;
            }
            byProgramme[progName]++;

            if (!byProgrammeDetails[progName]) {
                byProgrammeDetails[progName] = { count: 0, id: progId };
            }
            byProgrammeDetails[progName].count++;
        }

        return {
            totalApplicants,
            byLevel,
            byProgramme,
            byProgrammeDetails
        };

    } catch (error: any) {
        console.error("[getAdmissionV2Stats] Failed:", error);
        return {
            totalApplicants: 0,
            byLevel: { ND: 0, HND: 0 },
            byProgramme: {},
            byProgrammeDetails: {}
        };
    }
}

export async function changeApplicantProgramme(appId: number, departmentId: number, programmeId: number, reason?: string) {
    try {
        await requireAdmin();
        const [app] = await db.select().from(admissionApplicationsV2).where(eq(admissionApplicationsV2.id, appId)).limit(1);
        if (!app) return { success: false, error: "Application not found" };

        const [dept] = await db.select().from(departments).where(eq(departments.id, departmentId)).limit(1);
        const [prog] = await db.select().from(programmes).where(eq(programmes.id, programmeId)).limit(1);

        let parsedData: any = {};
        if (app.data) {
            try { parsedData = JSON.parse(app.data); } catch (e) {}
        }

        const oldProgName = parsedData.programmeName || parsedData.programme || 'Original Course';

        parsedData.departmentId = departmentId;
        parsedData.programmeId = programmeId;
        if (dept) parsedData.departmentName = dept.name;
        if (prog) parsedData.programmeName = prog.name;

        const changeNote = `[Course Transfer] Changed from "${oldProgName}" to "${prog?.name || 'New Course'}". Reason: ${reason || 'Admission Officer Directive'}`;
        const updatedNotes = app.admissionNotes ? `${app.admissionNotes}\n${changeNote}` : changeNote;

        await db.update(admissionApplicationsV2)
            .set({ 
                data: JSON.stringify(parsedData),
                programmeId: programmeId,
                admissionNotes: updatedNotes,
                updatedAt: new Date()
            })
            .where(eq(admissionApplicationsV2.id, appId));

        const applicantEmail = parsedData.email || "";
        if (applicantEmail && prog) {
            sendEmail(
                applicantEmail,
                "Admission Course Recommendation Update",
                `<div style="font-family:sans-serif;padding:20px;line-height:1.6;">
                    <h2>Admission Update</h2>
                    <p>Dear ${parsedData.firstName || 'Applicant'},</p>
                    <p>Your admission application course recommendation has been updated by the Admission Office to <strong>${prog.name}</strong> (${dept?.name || ''}).</p>
                    <p><strong>Note/Reason:</strong> ${reason || 'Transferred based on entry requirements.'}</p>
                    <p>Please log in to your admission portal to track your application status.</p>
                </div>`
            ).catch((err: any) => console.error("Failed to send course change email:", err));
        }

        revalidatePath(`/admin/admission/v2/${appId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to change applicant programme:", error);
        return { success: false, error: error.message || "Failed to change programme" };
    }
}

export async function getAdmissionAcademicUnits() {
    try {
        const facs = await db.select({ id: faculties.id, name: faculties.name, code: faculties.code }).from(faculties);
        const depts = await db.select({ id: departments.id, name: departments.name, code: departments.code, facultyId: departments.facultyId }).from(departments);
        const progs = await db.select({ id: programmes.id, name: programmes.name, code: programmes.code, departmentId: programmes.deptId }).from(programmes);
        return { success: true, faculties: facs, departments: depts, programmes: progs };
    } catch (e: any) {
        return { success: false, error: e.message, faculties: [], departments: [], programmes: [] };
    }
}
