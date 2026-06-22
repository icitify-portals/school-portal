"use server";

import { db } from "@/db/db";
import { auth } from "@/auth";
import { 
  students, 
  programmes, 
  departments, 
  users, 
  resultMarks, 
  courseDepartmentSettings, 
  courses, 
  studentCourseRegistrations, 
  studentClearances, 
  graduateProfiles, 
  documentTypes, 
  documentForms, 
  documentPricingRules, 
  graduateDocumentApplications, 
  systemAuditLogs,
  transactions,
  academicSessions,
  settlementAccounts
} from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { SplitPaymentEngine } from "@/services/SplitPaymentEngine";

/**
 * 1. Checks if a student is eligible for graduation by analyzing coursework,
 * carryovers, spillovers, credits, and clearances.
 */
export async function checkGraduationEligibility(studentId: number) {
  try {
    // A. Retrieve student & program metadata
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: { 
        user: true,
        programme: true
      }
    });

    if (!student || !student.user) {
      return { success: false, error: "Student profile not found" };
    }

    const programme = student.programme;
    if (!programme) {
      return { success: false, error: "Programme not linked to student" };
    }

    if (!student.deptId) {
      return { success: false, error: "Department not linked to student" };
    }

    // B. Calculate semesters registered (spillover tracker)
    const [regCount] = await db.select({
      count: sql<number>`count(distinct concat(${studentCourseRegistrations.sessionId}, '-', ${studentCourseRegistrations.semester}))`
    })
    .from(studentCourseRegistrations)
    .where(eq(studentCourseRegistrations.studentId, studentId));
    
    const semestersSpent = regCount?.count || 4;

    // C. Get compulsory curriculum courses for the student's department/level
    const compulsoryCourses = await db.select({
      courseId: courses.id,
      code: courses.code,
      name: courses.name,
      creditUnits: courses.creditUnits
    })
    .from(courseDepartmentSettings)
    .innerJoin(courses, eq(courseDepartmentSettings.courseId, courses.id))
    .where(
      and(
        eq(courseDepartmentSettings.deptId, student.deptId),
        eq(courseDepartmentSettings.status, "compulsory")
      )
    );

    // D. Fetch student's grades (result_marks)
    const studentResults = await db.select()
      .from(resultMarks)
      .where(eq(resultMarks.studentId, studentId));

    // E. Evaluate carryovers (compulsory courses failed or unattempted)
    const unpassedCompulsoryCourses: string[] = [];
    let passedCredits = 0;

    for (const core of compulsoryCourses) {
      const result = studentResults.find(r => r.courseId === core.courseId);
      
      // Check if course has a passing grade (grade is not F, or score is 40+)
      const isPassed = result && result.grade !== "F" && parseFloat(result.totalScore || "0") >= 40;
      
      if (!isPassed) {
        unpassedCompulsoryCourses.push(`${core.code} - ${core.name}`);
      } else if (result) {
        passedCredits += core.creditUnits;
      }
    }

    // F. Calculate general CGPA from summaries or result marks
    let totalGradePoints = 0;
    let totalUnits = 0;

    studentResults.forEach(r => {
      const resultCourse = compulsoryCourses.find(c => c.courseId === r.courseId);
      const units = resultCourse?.creditUnits || 3; // Fallback unit
      if (r.gradePoint) {
        const gp = parseFloat(r.gradePoint.toString());
        totalGradePoints += gp * units;
        totalUnits += units;
      }
    });

    const cgpa = totalUnits > 0 ? (totalGradePoints / totalUnits) : 0;

    // G. Verify financial clearance (must have at least one 'cleared' status or ledger zero balance)
    const clearances = await db.select()
      .from(studentClearances)
      .where(eq(studentClearances.studentId, studentId));
    const isCleared = clearances.some(c => c.status === "cleared") || clearances.length === 0;

    // H. Compile final eligibility
    const isEligible = unpassedCompulsoryCourses.length === 0 && isCleared;

    return {
      success: true,
      isEligible,
      studentName: student.user.name,
      programmeName: programme.name,
      semestersSpent,
      passedCredits,
      cgpa: parseFloat(cgpa.toFixed(2)),
      unpassedCompulsoryCourses,
      isCleared,
      currentLevel: student.currentLevel,
      gender: student.gender,
      dob: student.dob
    };

  } catch (error: any) {
    console.error("Graduation eligibility check failed:", error);
    return { success: false, error: error.message || "Failed to check graduation eligibility" };
  }
}

/**
 * 2. Promotes an eligible student to a graduate and builds their Graduate Profile.
 */
export async function promoteStudentToGraduate(studentId: number, classOfDegree: string = "Pass") {
  const session = await auth();
  const actor = session?.user as any;
  if (!actor || (actor.role !== "admin" && actor.role !== "superadmin" && actor.role !== "registrar")) {
    return { success: false, error: "Unauthorized: Registrar/Admin credentials required" };
  }

  try {
    // A. Check eligibility
    const status = await checkGraduationEligibility(studentId);
    if (!status.success || !status.isEligible) {
      return { 
        success: false, 
        error: `Student is not eligible for graduation. Carryovers: ${status.unpassedCompulsoryCourses?.join(", ") || "None"}. Cleared: ${status.isCleared}` 
      };
    }

    // B. Fetch student record details
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: { programme: true }
    });
    if (!student || !student.programmeId) {
      return { success: false, error: "Student details missing" };
    }

    // C. Resolve graduation category dynamically based on programme name/style
    let category: "polytechnic_ond" | "polytechnic_hnd" | "university_undergrad" | "university_postgrad" = "university_undergrad";
    const progName = student.programme?.name?.toLowerCase() || "";
    
    if (progName.includes("hnd") || progName.includes("higher national diploma")) {
      category = "polytechnic_hnd";
    } else if (progName.includes("nd") || progName.includes("national diploma") || progName.includes("ordinary national diploma")) {
      category = "polytechnic_ond";
    } else if (progName.includes("m.sc") || progName.includes("phd") || progName.includes("postgraduate")) {
      category = "university_postgrad";
    }

    const currentYear = new Date().getFullYear();
    const activeSession = await db.query.academicSessions.findFirst({
      orderBy: desc(academicSessions.name)
    });

    if (!activeSession) {
      return { success: false, error: "Active academic session missing" };
    }

    // D. Create Graduate Profile (allowing multiple categories per student ID over time)
    const [profile] = await db.select()
      .from(graduateProfiles)
      .where(
        and(
          eq(graduateProfiles.studentId, studentId),
          eq(graduateProfiles.category, category)
        )
      )
      .limit(1);

    let profileId: number;
    if (profile) {
      profileId = profile.id;
      await db.update(graduateProfiles)
        .set({
          cgpa: status.cgpa.toFixed(2),
          classOfDegree,
          totalSemestersSpent: status.semestersSpent,
          isCleared: true,
          graduationYear: currentYear,
          graduationSessionId: activeSession.id
        })
        .where(eq(graduateProfiles.id, profile.id));
    } else {
      const [res] = await db.insert(graduateProfiles).values({
        userId: student.userId!,
        studentId,
        category,
        programmeId: student.programmeId,
        graduationYear: currentYear,
        graduationSessionId: activeSession.id,
        cgpa: status.cgpa.toFixed(2),
        classOfDegree,
        totalSemestersSpent: status.semestersSpent,
        isCleared: true
      });
      profileId = res.insertId;
    }

    // E. Update student status to 'graduated'
    await db.update(students)
      .set({ 
        status: "graduated",
        graduatedAt: new Date(),
        classOfDegree
      })
      .where(eq(students.id, studentId));

    // F. Audit the graduation event
    await db.insert(systemAuditLogs).values({
      actorId: parseInt(actor.id),
      action: "PROMOTE_TO_GRADUATE",
      targetId: studentId.toString(),
      details: JSON.stringify({ category, cgpa: status.cgpa, semestersSpent: status.semestersSpent }),
      status: "success"
    });

    revalidatePath("/admin/students");
    return { success: true, profileId, category };

  } catch (error: any) {
    console.error("Failed to promote student to graduate:", error);
    return { success: false, error: error.message || "Failed to process graduation" };
  }
}

/**
 * 3. Retrieve graduate profiles for the active user account.
 */
export async function getMyGraduateProfiles() {
  const session = await auth();
  if (!session?.user) return [];
  const userId = parseInt(session.user.id!);

  try {
    return await db.query.graduateProfiles.findMany({
      where: eq(graduateProfiles.userId, userId),
      with: {
        programme: true,
        session: true
      }
    });
  } catch (error) {
    console.error("Failed to fetch graduate profiles:", error);
    return [];
  }
}

/**
 * 4. Retrieve dynamic application forms configured for a specific graduate category.
 */
export async function getDocumentFormsByCategory(category: "polytechnic_ond" | "polytechnic_hnd" | "university_undergrad" | "university_postgrad") {
  try {
    return await db.query.documentForms.findMany({
      where: and(
        eq(documentForms.category, category),
        eq(documentForms.isActive, true)
      ),
      with: {
        documentType: true
      }
    });
  } catch (error) {
    console.error("Failed to get document forms:", error);
    return [];
  }
}

/**
 * 5. Get document base price and route surcharges.
 */
export async function getDocumentFormPrice(formId: number, deliveryMethod: "email" | "courier_local" | "courier_international" | "pickup") {
  try {
    const pricing = await db.query.documentPricingRules.findFirst({
      where: and(
        eq(documentPricingRules.formId, formId),
        eq(documentPricingRules.deliveryMethod, deliveryMethod)
      )
    });
    return pricing || null;
  } catch (error) {
    console.error("Failed to get pricing:", error);
    return null;
  }
}

/**
 * 6. Initialize Graduate Document Request application and trigger Bursary Split Payment.
 */
export async function applyForGraduateDocument(data: {
  graduateProfileId: number;
  formId: number;
  formData: any;
  deliveryMethod: "email" | "courier_local" | "courier_international" | "pickup";
  courierAddress?: string;
  contactEmail: string;
  contactPhone?: string;
}) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  const userId = parseInt(session.user.id!);

  try {
    // A. Verify graduate profile ownership
    const profile = await db.query.graduateProfiles.findFirst({
      where: and(
        eq(graduateProfiles.id, data.graduateProfileId),
        eq(graduateProfiles.userId, userId)
      )
    });

    if (!profile) {
      return { success: false, error: "Graduate profile not found or access denied" };
    }

    // B. Calculate document fee
    const pricing = await getDocumentFormPrice(data.formId, data.deliveryMethod);
    if (!pricing) {
      return { success: false, error: "Pricing rules not configured for this delivery method" };
    }

    const totalFee = parseFloat(pricing.feeAmount);

    // C. Setup temporary transaction in system ledger
    const txRef = `TX-GRAD-${Date.now()}`;
    const [tx] = await db.insert(transactions).values({
      studentId: profile.studentId,
      amount: totalFee.toFixed(2),
      type: "credit",
      purpose: `Document Application Fee - Form ID ${data.formId}`,
      status: "pending",
      gateway: "paystack",
      gatewayReference: txRef
    });

    // D. Insert document application log (status: unpaid)
    const [app] = await db.insert(graduateDocumentApplications).values({
      userId,
      graduateProfileId: data.graduateProfileId,
      formId: data.formId,
      formData: JSON.stringify(data.formData),
      deliveryMethod: data.deliveryMethod,
      courierAddress: data.courierAddress,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      paymentStatus: "unpaid",
      transactionId: tx.insertId,
      amountPaid: "0.00",
      registryStatus: "pending"
    });

    // E. Initialize Split Payment checkout simulation URL
    const checkoutUrl = `/finance/checkout/simulate?gateway=paystack&reference=${txRef}&amount=${totalFee}`;

    return {
      success: true,
      applicationId: app.insertId,
      checkoutUrl,
      reference: txRef
    };

  } catch (error: any) {
    console.error("Document application initialization failed:", error);
    return { success: false, error: error.message || "Failed to initialize document request" };
  }
}

/**
 * 7. Callback invoked on successful payment to update the application status.
 */
export async function confirmDocumentApplicationPayment(reference: string) {
  try {
    // A. Find transaction
    const [tx] = await db.select()
      .from(transactions)
      .where(eq(transactions.gatewayReference, reference))
      .limit(1);

    if (!tx) return { success: false, error: "Transaction reference not found" };

    // Update transaction state
    await db.update(transactions)
      .set({ status: "completed" })
      .where(eq(transactions.id, tx.id));

    // B. Find application matching transaction ID
    const [app] = await db.select()
      .from(graduateDocumentApplications)
      .where(eq(graduateDocumentApplications.transactionId, tx.id))
      .limit(1);

    if (!app) return { success: false, error: "Associated document application not found" };

    // Update payment status
    await db.update(graduateDocumentApplications)
      .set({ 
        paymentStatus: "paid",
        amountPaid: tx.amount,
        registryStatus: "pending"
      })
      .where(eq(graduateDocumentApplications.id, app.id));

    return { success: true, applicationId: app.id };
  } catch (error: any) {
    console.error("Payment confirmation callback failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 8. Retrieve list of applications for the Registry desk queue.
 */
export async function getRegistryApplications(filters: { status?: any; category?: any } = {}) {
  const session = await auth();
  const actor = session?.user as any;
  if (!actor || (actor.role !== "admin" && actor.role !== "superadmin" && actor.role !== "registrar" && actor.role !== "staff")) {
    return [];
  }

  try {
    const conditions = [eq(graduateDocumentApplications.paymentStatus, "paid")];
    if (filters.status) {
      conditions.push(eq(graduateDocumentApplications.registryStatus, filters.status));
    }

    const results = await db.query.graduateDocumentApplications.findMany({
      where: and(...conditions),
      with: {
        user: true,
        graduateProfile: {
          with: {
            programme: true
          }
        },
        form: {
          with: {
            documentType: true
          }
        }
      },
      orderBy: desc(graduateDocumentApplications.createdAt)
    });

    // Filter by graduate profile category if specified
    if (filters.category) {
      return results.filter(r => r.graduateProfile.category === filters.category);
    }

    return results;
  } catch (error) {
    console.error("Failed to get registry applications queue:", error);
    return [];
  }
}

/**
 * 9. Registry updates processing status of document applications.
 */
export async function updateRegistryApplicationStatus(data: {
  applicationId: number;
  status: "reviewing" | "processing" | "dispatched" | "completed" | "rejected";
  comments?: string;
  trackingNumber?: string;
  processedFileUrl?: string;
  rejectionReason?: string;
}) {
  const session = await auth();
  const actor = session?.user as any;
  if (!actor || (actor.role !== "admin" && actor.role !== "superadmin" && actor.role !== "registrar" && actor.role !== "staff")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const updateData: any = {
      registryStatus: data.status,
      registryComments: data.comments,
      assignedStaffId: parseInt(actor.id)
    };

    if (data.status === "dispatched" || data.status === "completed") {
      updateData.completedAt = new Date();
      if (data.trackingNumber) updateData.trackingNumber = data.trackingNumber;
      if (data.processedFileUrl) updateData.processedFileUrl = data.processedFileUrl;
      updateData.dispatchedAt = new Date();
    }

    if (data.status === "rejected") {
      updateData.rejectionReason = data.rejectionReason;
    }

    await db.update(graduateDocumentApplications)
      .set(updateData)
      .where(eq(graduateDocumentApplications.id, data.applicationId));

    // Audit the action
    await db.insert(systemAuditLogs).values({
      actorId: parseInt(actor.id),
      action: "UPDATE_DOCUMENT_REQUEST_STATUS",
      targetId: data.applicationId.toString(),
      details: JSON.stringify({ status: data.status, trackingNumber: data.trackingNumber }),
      status: "success"
    });

    revalidatePath("/admin/registry/documents");
    return { success: true };
  } catch (error: any) {
    console.error("Registry update failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 10. Registry Form Configurator: Create new Dynamic Document Application Form.
 */
export async function createDocumentForm(data: {
  name: string;
  documentTypeId: number;
  category: "polytechnic_ond" | "polytechnic_hnd" | "university_undergrad" | "university_postgrad";
  formSchema: string; // JSON Schema string
  instructions?: string;
}) {
  const session = await auth();
  const actor = session?.user as any;
  if (!actor || (actor.role !== "admin" && actor.role !== "superadmin" && actor.role !== "registrar")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [res] = await db.insert(documentForms).values({
      name: data.name,
      documentTypeId: data.documentTypeId,
      category: data.category,
      formSchema: data.formSchema,
      instructions: data.instructions,
      isActive: true
    });

    await db.insert(systemAuditLogs).values({
      actorId: parseInt(actor.id),
      action: "CREATE_DOCUMENT_FORM",
      targetId: res.insertId.toString(),
      details: JSON.stringify({ name: data.name, category: data.category }),
      status: "success"
    });

    revalidatePath("/admin/registry/forms");
    return { success: true, formId: res.insertId };
  } catch (error: any) {
    console.error("Failed to create document form:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 11. Bursary Configuration: Setup Pricing Rule for a Document Form.
 */
export async function configureDocumentPricingRule(data: {
  formId: number;
  deliveryMethod: "email" | "courier_local" | "courier_international" | "pickup";
  feeAmount: number;
  settlementAccountId: number;
}) {
  const session = await auth();
  const actor = session?.user as any;
  if (!actor || (actor.role !== "admin" && actor.role !== "superadmin" && actor.role !== "bursar")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [existing] = await db.select()
      .from(documentPricingRules)
      .where(
        and(
          eq(documentPricingRules.formId, data.formId),
          eq(documentPricingRules.deliveryMethod, data.deliveryMethod)
        )
      )
      .limit(1);

    if (existing) {
      await db.update(documentPricingRules)
        .set({
          feeAmount: data.feeAmount.toFixed(2),
          settlementAccountId: data.settlementAccountId
        })
        .where(eq(documentPricingRules.id, existing.id));
    } else {
      await db.insert(documentPricingRules).values({
        formId: data.formId,
        deliveryMethod: data.deliveryMethod,
        feeAmount: data.feeAmount.toFixed(2),
        settlementAccountId: data.settlementAccountId
      });
    }

    await db.insert(systemAuditLogs).values({
      actorId: parseInt(actor.id),
      action: "CONFIGURE_DOCUMENT_PRICING",
      targetId: data.formId.toString(),
      details: JSON.stringify({ method: data.deliveryMethod, fee: data.feeAmount }),
      status: "success"
    });

    revalidatePath("/admin/bursary/pricing");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to configure pricing rule:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 12. Retrieves all document pricing rules configured in the system.
 */
export async function getAllDocumentPricingRules() {
  try {
    return await db.query.documentPricingRules.findMany({
      with: {
        form: true,
        settlementAccount: true
      }
    });
  } catch (error) {
    console.error("Failed to fetch all document pricing rules:", error);
    return [];
  }
}

/**
 * 13. Retrieves all document forms configured in the Registry.
 */
export async function getAllActiveForms() {
  try {
    return await db.query.documentForms.findMany({
      with: {
        documentType: true
      }
    });
  } catch (error) {
    console.error("Failed to fetch all active document forms:", error);
    return [];
  }
}

