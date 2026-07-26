"use server";

import { auth } from "@/auth";
import { IDCardService } from "@/services/IDCardService";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import {
    students, programmes, departments,
    admissionApplicationsV2, admissionFormTemplates,
} from "@/db/schema";
import { eq, and, or, like, isNotNull, isNull, desc, asc, sql, count } from "drizzle-orm";

const ADMIN_ROLES = ['admin', 'superadmin', 'icitify_dev', 'dvc', 'registrar', 'admission_officer'];

async function requireAdmin() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized: Please log in");
    if (!ADMIN_ROLES.includes(session.user.role as string)) {
        throw new Error("Forbidden: You do not have permission to perform this action");
    }
    return session;
}

export async function requestIDCardAction(userType: 'student' | 'staff') {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id) return { success: false, error: "Unauthorized" };

    const userId = parseInt(user.id);

    const existing = await IDCardService.getActiveCard(userId);
    if (existing) return { success: true, message: "ID Card already issued", card: existing };

    const res = await IDCardService.issueIDCard(userId, userType);
    if (res.success) {
        revalidatePath(`/${userType}/id-card`);
    }
    return res;
}

export async function getMyIDCardAction() {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id) return null;

    return await IDCardService.getActiveCard(parseInt(user.id));
}

export async function getVerificationDataAction(code: string) {
    return await IDCardService.verifyIDCard(code);
}

export async function generateQRAction(code: string) {
    return await IDCardService.generateVerificationQR(code);
}

export async function getAllIDCardsAction(limit = 50, offset = 0) {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id || user.role !== 'admin') return [];

    return await IDCardService.getAllIDCards(limit, offset);
}

export async function revokeIDCardAction(cardId: number) {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id || user.role !== 'admin') return { success: false, error: "Unauthorized" };

    const res = await IDCardService.revokeCard(cardId);
    if (res.success) {
        revalidatePath("/admin/identity/id-cards");
    }
    return res;
}

export async function getIdCardStudents(options?: {
    search?: string;
    deptId?: number;
    programmeType?: string;
    page?: number;
    pageSize?: number;
}) {
    await requireAdmin();
    try {
        const page = options?.page || 1;
        const pageSize = options?.pageSize || 50;
        const offset = (page - 1) * pageSize;

        const conditions: any[] = [
            eq(students.status, 'active'),
        ];

        if (options?.search) {
            const s = `%${options.search}%`;
            conditions.push(
                or(
                    like(students.firstName, s),
                    like(students.lastName, s),
                    like(students.matricNumber, s),
                    like(students.admissionNumber, s),
                )
            );
        }
        if (options?.deptId) {
            conditions.push(eq(students.deptId, options.deptId));
        }
        if (options?.programmeType) {
            conditions.push(eq(students.programmeType, options.programmeType as "ND" | "HND"));
        }

        const whereClause = and(...conditions);

        const [totalRow] = await db
            .select({ value: count() })
            .from(students)
            .where(whereClause);
        const total = totalRow.value;

        const data = await db
            .select({
                id: students.id,
                firstName: students.firstName,
                lastName: students.lastName,
                otherNames: students.otherNames,
                matricNumber: students.matricNumber,
                admissionNumber: students.admissionNumber,
                programmeType: students.programmeType,
                currentLevel: students.currentLevel,
                imageUrl: students.imageUrl,
                signatureUrl: students.signatureUrl,
                deptName: departments.name,
                deptCode: departments.code,
                programmeName: programmes.name,
                applicationId: admissionApplicationsV2.id,
                applicantPhoto: admissionApplicationsV2.applicantPhoto,
                applicationData: admissionApplicationsV2.data,
                formNumber: admissionApplicationsV2.formNumber,
            })
            .from(students)
            .leftJoin(programmes, eq(students.programmeId, programmes.id))
            .leftJoin(departments, eq(students.deptId, departments.id))
            .leftJoin(admissionApplicationsV2, eq(admissionApplicationsV2.studentId, students.id))
            .where(whereClause)
            .orderBy(asc(students.lastName), asc(students.firstName))
            .limit(pageSize)
            .offset(offset);

        return {
            students: data.map((s) => {
                let formData: any = {};
                try {
                    formData = typeof s.applicationData === 'string'
                        ? JSON.parse(s.applicationData)
                        : s.applicationData || {};
                } catch {}

                const signature = formData.signature
                    || formData["Signature"]
                    || formData["Applicant Signature"]
                    || formData["Student Signature"]
                    || null;

                const photo = s.imageUrl
                    || s.applicantPhoto
                    || formData["Passport Photograph"]
                    || formData["Passport Photo"]
                    || formData["Passport"]
                    || formData["Photo"]
                    || null;

                return {
                    id: s.id,
                    firstName: s.firstName,
                    lastName: s.lastName,
                    otherNames: s.otherNames,
                    matricNumber: s.matricNumber,
                    admissionNumber: s.admissionNumber,
                    programmeType: s.programmeType,
                    currentLevel: s.currentLevel,
                    deptName: s.deptName,
                    deptCode: s.deptCode,
                    programmeName: s.programmeName,
                    photo,
                    signature,
                    applicationId: s.applicationId,
                    formNumber: s.formNumber,
                    formData,
                };
            }),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    } catch (error) {
        console.error("[getIdCardStudents] Failed:", error);
        return { students: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };
    }
}
