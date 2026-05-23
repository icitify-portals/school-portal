"use server";

import { db } from "@/db/db";
import { 
    admissionFormTemplates, 
    admissionFormSections, 
    admissionFormFields,
    admissionApplicationsV2,
    users,
    students
} from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Form Template Actions
 */

export async function getAdmissionTemplates() {
    return await getFormTemplates();
}

export async function getFormTemplates() {
    try {
        return await db.query.admissionFormTemplates.findMany({
            with: {
                sections: {
                    with: {
                        fields: true
                    },
                    orderBy: (sections, { asc }) => [asc(sections.order)]
                }
            },
            orderBy: [desc(admissionFormTemplates.createdAt)]
        });
    } catch (error) {
        console.error("Failed to fetch form templates:", error);
        return [];
    }
}

export async function getFormTemplate(id: number) {
    try {
        return await db.query.admissionFormTemplates.findFirst({
            where: eq(admissionFormTemplates.id, id),
            with: {
                sections: {
                    with: {
                        fields: true
                    },
                    orderBy: (sections, { asc }) => [asc(sections.order)]
                }
            }
        });
    } catch (error) {
        console.error("Failed to fetch form template:", error);
        return null;
    }
}

export async function saveFormTemplate(data: any) {
    try {
        const { id, name, level, slug, description, applicationFee, lateFee, startDate, endDate, lateEndDate, minAge, isActive } = data;
        
        if (id) {
            await db.update(admissionFormTemplates)
                .set({ name, level, slug, description, applicationFee, lateFee, startDate, endDate, lateEndDate, minAge, isActive })
                .where(eq(admissionFormTemplates.id, id));
            revalidatePath(`/admin/admission/builder/${id}`);
            return { success: true, id };
        } else {
            const [result] = await db.insert(admissionFormTemplates).values({
                name, level, slug, description, applicationFee, lateFee, startDate, endDate, lateEndDate, minAge, isActive
            });
            revalidatePath("/admin/admission/builder");
            return { success: true, id: result.insertId };
        }
    } catch (error) {
        console.error("Failed to save form template:", error);
        return { success: false, error: "Failed to save template" };
    }
}

/**
 * Form Section Actions
 */

export async function saveFormSection(data: any) {
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
        revalidatePath(`/admin/admission/builder/${templateId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to save form section:", error);
        return { success: false, error: "Failed to save section" };
    }
}

export async function deleteFormSection(id: number, templateId: number) {
    try {
        await db.delete(admissionFormSections).where(eq(admissionFormSections.id, id));
        revalidatePath(`/admin/admission/builder/${templateId}`);
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
        const { id, sectionId, templateId, label, type, placeholder, options, isRequired, order, isSystemField, systemKey } = data;
        if (id) {
            await db.update(admissionFormFields)
                .set({ label, type, placeholder, options, isRequired, order, isSystemField, systemKey })
                .where(eq(admissionFormFields.id, id));
        } else {
            await db.insert(admissionFormFields).values({
                sectionId, label, type, placeholder, options, isRequired, order, isSystemField, systemKey
            });
        }
        revalidatePath(`/admin/admission/builder/${templateId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to save form field:", error);
        return { success: false, error: "Failed to save field" };
    }
}

export async function deleteFormField(id: number, templateId: number) {
    try {
        await db.delete(admissionFormFields).where(eq(admissionFormFields.id, id));
        revalidatePath(`/admin/admission/builder/${templateId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete form field:", error);
        return { success: false, error: "Failed to delete field" };
    }
}

export async function updateFieldsOrder(fields: { id: number, order: number }[], templateId: number) {
    try {
        await db.transaction(async (tx) => {
            for (const field of fields) {
                await tx.update(admissionFormFields)
                    .set({ order: field.order })
                    .where(eq(admissionFormFields.id, field.id));
            }
        });
        revalidatePath(`/admin/admission/builder/${templateId}`);
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
        return await db.query.admissionFormTemplates.findFirst({
            where: and(
                eq(admissionFormTemplates.slug, slug),
                eq(admissionFormTemplates.isActive, true)
            ),
            with: {
                sections: {
                    with: {
                        fields: true
                    },
                    orderBy: (sections, { asc }) => [asc(sections.order)]
                }
            }
        });
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

        const [result] = await db.insert(admissionApplicationsV2).values({
            templateId,
            formData: JSON.stringify(formData),
            applicantPhoto,
            ageAtAdmission,
            status: 'submitted',
            paymentStatus: 'pending'
        });

        return { success: true, applicationId: result.insertId };
    } catch (error) {
        console.error("Failed to submit admission application:", error);
        return { success: false, error: "Failed to submit application" };
    }
}

export async function getAdmissionApplications(templateId?: number) {
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
    try {
        await db.update(admissionApplicationsV2)
            .set({ 
                paymentStatus: 'paid', 
                status: 'paid',
                paymentReference: reference 
            })
            .where(eq(admissionApplicationsV2.id, applicationId));
        
        revalidatePath("/admin/admission/payments");
        return { success: true };
    } catch (error) {
        console.error("Failed to confirm admission payment:", error);
        return { success: false, error: "Failed to confirm payment" };
    }
}

export async function getAdmissionSummary() {
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
    try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour window

        await db.update(admissionApplicationsV2)
            .set({
                editFineStatus: 'paid',
                editFineReference: reference,
                editWindowExpiresAt: expiresAt
            })
            .where(eq(admissionApplicationsV2.id, applicationId));

        return { success: true, expiresAt };
    } catch (error) {
        console.error("Failed to confirm edit fine:", error);
        return { success: false, error: "Failed to confirm payment" };
    }
}

export async function updateAdmissionApplication(applicationId: number, formData: any) {
    try {
        // Double check access window in action
        const access = await requestEditAccess(applicationId);
        if (!access.success) return { success: false, error: "Edit window is closed or fine required." };

        await db.update(admissionApplicationsV2)
            .set({
                formData: JSON.stringify(formData),
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
    try {
        await db.update(admissionApplicationsV2)
            .set({ 
                status: status,
                admissionNotes: notes,
                updatedAt: new Date()
            })
            .where(eq(admissionApplicationsV2.id, applicationId));
        
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
                results: {
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
    try {
        await db.update(admissionApplicationsV2)
            .set({ 
                acceptancePaymentStatus: 'paid',
                updatedAt: new Date()
            })
            .where(eq(admissionApplicationsV2.id, applicationId));
        
        revalidatePath(`/admission/status/${applicationId}`);
    } catch (error) {
        console.error("Failed to confirm acceptance payment:", error);
        return { success: false, error: "An error occurred" };
    }
}

export async function finalizeStudentAdmission(applicationId: number) {
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

        const formData = JSON.parse(application.formData || "{}");

        // Generate Matric Number (Simple Year + Level + Application ID)
        const year = new Date().getFullYear();
        const levelCode = template.level.charAt(0).toUpperCase();
        const matricNumber = `${year}/${levelCode}/${application.id}/${Math.floor(1000 + Math.random() * 9000)}`;

        // 1. Create User
        const [userResult] = await db.insert(users).values({
            name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.fullName || `Applicant ${application.id}`,
            email: formData.email || formData.guardianEmail || `applicant${application.id}@portal.edu`,
            password: "$2a$12$R.uX0X.uX0X.uX0X.uX0X.uX0X.uX0X.uX0X.uX0X.uX0X.uX", // "Password123"
            role: 'student',
            phone: formData.phone || formData.guardianPhone,
            imageUrl: application.applicantPhoto,
            status: 'active'
        });

        const userId = userResult.insertId;

        // 2. Create Student with extended mapping
        await db.insert(students).values({
            userId: userId,
            firstName: formData.firstName || formData.fullName?.split(' ')[0],
            lastName: formData.lastName || formData.fullName?.split(' ').slice(1).join(' '),
            matricNumber: matricNumber,
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
        
        return { success: true, matricNumber };
    } catch (error: any) {
        console.error("Failed to finalize admission:", error);
        return { success: false, error: error.message || "An error occurred during registration" };
    }
}
