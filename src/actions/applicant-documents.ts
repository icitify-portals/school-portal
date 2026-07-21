"use server";

import { db } from "@/db/db";
import {
  applicantDocuments,
  users,
  roleTransitions,
  students,
  programmes
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { storage } from "@/lib/storage";

// Upload applicant document (passport photo or signature)
export async function uploadApplicantDocument(
  formData: FormData,
  documentType: 'passport_photo' | 'signature'
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Invalid file type. Only JPEG and PNG images are allowed" };
    }

    if (file.size > maxSize) {
      return { success: false, error: "File size too large. Maximum 2MB allowed" };
    }

    // Create unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${session.user.id}_${documentType}_${Date.now()}.${fileExtension}`;

    // Upload file via storage provider (local or S3/Wasabi)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadResult = await storage.upload(buffer, uniqueFilename, 'applicant-documents', file.type);

    if (!uploadResult.success || !uploadResult.url) {
      return { success: false, error: uploadResult.error || "Failed to upload file" };
    }

    const fileUrl = uploadResult.url;

    // Check if document already exists for this user and type
    const existingDoc = await db
      .select()
      .from(applicantDocuments)
      .where(and(
        eq(applicantDocuments.userId, parseInt(session.user.id)),
        eq(applicantDocuments.documentType, documentType)
      ))
      .limit(1);

    if (existingDoc.length > 0) {
      // Update existing document
      await db
        .update(applicantDocuments)
        .set({
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          status: 'pending',
          uploadedAt: new Date(),
          approvedBy: null,
          approvedAt: null,
          rejectionReason: null
        })
        .where(eq(applicantDocuments.id, existingDoc[0].id));
    } else {
      // Insert new document
      await db.insert(applicantDocuments).values({
        userId: parseInt(session.user.id),
        documentType,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        status: 'pending'
      });
    }

    revalidatePath("/fresher/documents");
    revalidatePath("/admin/applicant-documents");

    return {
      success: true,
      message: `${documentType === 'passport_photo' ? 'Passport photo' : 'Signature'} uploaded successfully`
    };

  } catch (error) {
    console.error("Upload document error:", error);
    return { success: false, error: "Failed to upload document" };
  }
}

// Get applicant documents for current user
export async function getApplicantDocuments() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const documents = await db
      .select()
      .from(applicantDocuments)
      .where(eq(applicantDocuments.userId, parseInt(session.user.id)))
      .orderBy(desc(applicantDocuments.uploadedAt));

    return { success: true, documents };

  } catch (error) {
    console.error("Get documents error:", error);
    return { success: false, error: "Failed to get documents" };
  }
}

// Get all applicant documents (for admin)
export async function getAllApplicantDocuments() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user has admin privileges
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(session.user.id)))
      .limit(1);

    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return { success: false, error: "Insufficient privileges" };
    }

    const documents = await db
      .select({
        id: applicantDocuments.id,
        documentType: applicantDocuments.documentType,
        fileUrl: applicantDocuments.fileUrl,
        fileName: applicantDocuments.fileName,
        fileSize: applicantDocuments.fileSize,
        mimeType: applicantDocuments.mimeType,
        status: applicantDocuments.status,
        uploadedAt: applicantDocuments.uploadedAt,
        approvedAt: applicantDocuments.approvedAt,
        rejectionReason: applicantDocuments.rejectionReason,
        userId: applicantDocuments.userId,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role
      })
      .from(applicantDocuments)
      .leftJoin(users, eq(applicantDocuments.userId, users.id))
      .orderBy(desc(applicantDocuments.uploadedAt));

    return { success: true, documents };

  } catch (error) {
    console.error("Get all documents error:", error);
    return { success: false, error: "Failed to get documents" };
  }
}

// Approve document
export async function approveDocument(documentId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user has admin privileges
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(session.user.id)))
      .limit(1);

    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return { success: false, error: "Insufficient privileges" };
    }

    await db
      .update(applicantDocuments)
      .set({
        status: 'approved',
        approvedBy: parseInt(session.user.id),
        approvedAt: new Date(),
        rejectionReason: null
      })
      .where(eq(applicantDocuments.id, documentId));

    revalidatePath("/admin/applicant-documents");
    return { success: true };

  } catch (error) {
    console.error("Approve document error:", error);
    return { success: false, error: "Failed to approve document" };
  }
}

// Reject document
export async function rejectDocument(documentId: number, reason: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user has admin privileges
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(session.user.id)))
      .limit(1);

    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return { success: false, error: "Insufficient privileges" };
    }

    await db
      .update(applicantDocuments)
      .set({
        status: 'rejected',
        approvedBy: parseInt(session.user.id),
        approvedAt: new Date(),
        rejectionReason: reason
      })
      .where(eq(applicantDocuments.id, documentId));

    revalidatePath("/admin/applicant-documents");
    return { success: true };

  } catch (error) {
    console.error("Reject document error:", error);
    return { success: false, error: "Failed to reject document" };
  }
}

// Transition user role (applicant -> fresher -> student)
export async function transitionUserRole(
  userId: number,
  toRole: 'fresher' | 'student',
  transitionType: 'admission_utme' | 'admission_de' | 'manual',
  academicSession: string,
  level: number,
  matricNumber?: string,
  programmeId?: number,
  reason?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user has admin privileges
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(session.user.id)))
      .limit(1);

    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'staff')) {
      return { success: false, error: "Insufficient privileges" };
    }

    // Get current user info
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Create role transition record
    await db.insert(roleTransitions).values({
      userId,
      fromRole: currentUser.role as any,
      toRole,
      transitionType,
      reason,
      academicSession,
      level,
      matricNumber,
      programmeId,
      processedBy: parseInt(session.user.id)
    });

    // Update user role
    await db
      .update(users)
      .set({ role: toRole })
      .where(eq(users.id, userId));

    // If transitioning to student, create student record
    if (toRole === 'student' && programmeId) {
      const existingStudent = await db
        .select()
        .from(students)
        .where(eq(students.userId, userId))
        .limit(1);

      if (existingStudent.length === 0) {
        await db.insert(students).values({
          userId,
          programmeId,
          matricNumber,
          currentLevel: level
        });
      }
    }

    revalidatePath("/admin/admission");
    revalidatePath("/admin/role-transitions");
    return { success: true };

  } catch (error) {
    console.error("Role transition error:", error);
    return { success: false, error: "Failed to transition user role" };
  }
}

// Get role transitions
export async function getRoleTransitions() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user has admin privileges
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(session.user.id)))
      .limit(1);

    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return { success: false, error: "Insufficient privileges" };
    }

    const transitions = await db
      .select({
        id: roleTransitions.id,
        fromRole: roleTransitions.fromRole,
        toRole: roleTransitions.toRole,
        transitionType: roleTransitions.transitionType,
        reason: roleTransitions.reason,
        academicSession: roleTransitions.academicSession,
        level: roleTransitions.level,
        matricNumber: roleTransitions.matricNumber,
        processedAt: roleTransitions.processedAt,
        userId: roleTransitions.userId,
        userName: users.name,
        userEmail: users.email,
        programmeName: programmes.name
      })
      .from(roleTransitions)
      .leftJoin(users, eq(roleTransitions.userId, users.id))
      .leftJoin(programmes, eq(roleTransitions.programmeId, programmes.id))
      .orderBy(desc(roleTransitions.processedAt));

    return { success: true, transitions };

  } catch (error) {
    console.error("Get role transitions error:", error);
    return { success: false, error: "Failed to get role transitions" };
  }
}

// Check if user can upload documents (must be fresher)
export async function canUploadDocuments() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, canUpload: false, reason: "Not authenticated" };
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(session.user.id)))
      .limit(1);

    if (!user) {
      return { success: false, canUpload: false, reason: "User not found" };
    }

    // Only fresher users can upload documents
    const canUpload = user.role === 'fresher';
    const reason = canUpload ? "Allowed" : "Only admitted students (fresher) can upload documents";

    return { success: true, canUpload, reason };

  } catch (error) {
    console.error("Check upload permission error:", error);
    return { success: false, canUpload: false, reason: "Failed to check permissions" };
  }
}

// Check if user has uploaded required documents
export async function getDocumentUploadStatus() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const documents = await getApplicantDocuments();
    if (!documents.success) {
      return { success: false, error: "Failed to get documents" };
    }

    const passportPhoto = documents.documents?.find(doc => doc.documentType === 'passport_photo');
    const signature = documents.documents?.find(doc => doc.documentType === 'signature');

    return {
      success: true,
      passportPhoto: {
        uploaded: !!passportPhoto,
        status: passportPhoto?.status || 'not_uploaded',
        url: passportPhoto?.fileUrl,
        rejectionReason: passportPhoto?.rejectionReason
      },
      signature: {
        uploaded: !!signature,
        status: signature?.status || 'not_uploaded',
        url: signature?.fileUrl,
        rejectionReason: signature?.rejectionReason
      },
      complete: !!(passportPhoto?.status === 'approved' && signature?.status === 'approved')
    };

  } catch (error) {
    console.error("Get upload status error:", error);
    return { success: false, error: "Failed to get upload status" };
  }
}
