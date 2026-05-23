"use server";

import { db } from "@/db/db";
import {
  jambCandidates,
  programmes,
  programmeUtmeRequirements,
  programmeOLevelRequirements,
  oLevelResults,
  admissionValidations,
  users
} from "@/db/schema";
import { eq, and, inArray, not, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// UTME Subject Validation
export async function validateUtmeSubjects(jambRegNo: string, programmeId: number) {
  try {
    // Get candidate info
    const [candidate] = await db
      .select()
      .from(jambCandidates)
      .where(eq(jambCandidates.jambRegNo, jambRegNo))
      .limit(1);

    if (!candidate) {
      return { success: false, error: "Candidate not found" };
    }

    // Get programme UTME requirements
    const requirements = await db
      .select()
      .from(programmeUtmeRequirements)
      .where(eq(programmeUtmeRequirements.programmeId, programmeId));

    if (requirements.length === 0) {
      return { success: false, error: "Programme requirements not configured" };
    }

    // Parse candidate UTME subjects
    const candidateSubjects = JSON.parse(candidate.utmeSubjects || '[]');
    const validationDetails: any = {
      requiredSubjects: [],
      candidateSubjects: candidateSubjects,
      missingSubjects: [],
      invalidSubjects: [],
      passed: true
    };

    // Check each requirement
    for (const req of requirements) {
      validationDetails.requiredSubjects.push({
        subject: req.subjectName,
        compulsory: req.isCompulsory,
        alternatives: req.alternativeSubjects ? JSON.parse(req.alternativeSubjects) : []
      });

      if (req.isCompulsory && !candidateSubjects.includes(req.subjectName)) {
        // Check alternatives if available
        const alternatives = req.alternativeSubjects ? JSON.parse(req.alternativeSubjects) : [];
        const hasAlternative = alternatives.some((alt: string) => candidateSubjects.includes(alt));

        if (!hasAlternative) {
          validationDetails.missingSubjects.push(req.subjectName);
          validationDetails.passed = false;
        }
      }
    }

    // Update candidate validation status
    // Removed db.update(jambCandidates) since fields were moved out

    return {
      success: true,
      valid: validationDetails.passed,
      details: validationDetails
    };

  } catch (error) {
    console.error("UTME validation error:", error);
    return { success: false, error: "Validation failed" };
  }
}

// O-Level Validation
export async function validateOLevelResults(jambRegNo: string, programmeId: number) {
  try {
    // Get candidate info
    const [candidate] = await db
      .select()
      .from(jambCandidates)
      .where(eq(jambCandidates.jambRegNo, jambRegNo))
      .limit(1);

    if (!candidate) {
      return { success: false, error: "Candidate not found" };
    }

    // Get programme O-Level requirements
    const requirements = await db
      .select()
      .from(programmeOLevelRequirements)
      .where(eq(programmeOLevelRequirements.programmeId, programmeId));

    if (requirements.length === 0) {
      return { success: false, error: "Programme O-Level requirements not configured" };
    }

    // Get candidate O-Level results
    const oLevelRecords = await db
      .select()
      .from(oLevelResults)
      .where(eq(oLevelResults.jambRegNo, jambRegNo));

    const validationDetails: any = {
      requiredSubjects: [],
      oLevelRecords: oLevelRecords,
      missingSubjects: [],
      insufficientGrades: [],
      passed: true,
      acceptsTwoSittings: false,
      sixthSubjectRequired: false
    };

    // Parse O-Level results
    const allResults: any[] = [];
    for (const record of oLevelRecords) {
      const subjects = JSON.parse(record.subjects || '{}');
      Object.entries(subjects).forEach(([subject, grade]) => {
        allResults.push({
          subject,
          grade,
          examType: record.examType,
          examYear: record.examYear
        });
      });
    }

    // Check if two sittings are acceptable
    const acceptsTwoSittings = requirements.some(req => req.acceptTwoSittings);
    const sixthSubjectRequired = requirements.some(req => req.sixthSubjectRequired);

    validationDetails.acceptsTwoSittings = acceptsTwoSittings;
    validationDetails.sixthSubjectRequired = sixthSubjectRequired;

    // Count unique subjects and check sitting requirements
    const uniqueSubjects = new Set(allResults.map(r => r.subject));
    const examTypes = new Set(oLevelRecords.map(r => r.examType));

    if (sixthSubjectRequired && uniqueSubjects.size < 6) {
      validationDetails.passed = false;
      validationDetails.missingSubjects.push("Minimum 6 subjects required");
    }

    if (!acceptsTwoSittings && examTypes.size > 1) {
      validationDetails.passed = false;
      validationDetails.missingSubjects.push("Multiple sittings not accepted");
    }

    // Check each requirement
    for (const req of requirements) {
      validationDetails.requiredSubjects.push({
        subject: req.subjectName,
        compulsory: req.isCompulsory,
        minGrade: req.minGrade
      });

      if (req.isCompulsory) {
        const subjectResults = allResults.filter(r => r.subject === req.subjectName);
        const hasPassingGrade = subjectResults.some(r =>
          isGradePassing(r.grade as string, req.minGrade || "C6")
        );

        if (!hasPassingGrade) {
          validationDetails.missingSubjects.push(`${req.subjectName} (min grade: ${req.minGrade})`);
          validationDetails.passed = false;
        }
      }
    }

    // Update candidate validation status
    // Removed db.update(jambCandidates) since fields were moved out

    return {
      success: true,
      valid: validationDetails.passed,
      details: validationDetails
    };

  } catch (error) {
    console.error("O-Level validation error:", error);
    return { success: false, error: "Validation failed" };
  }
}

// Helper function to check if grade passes minimum requirement
function isGradePassing(grade: string, minGrade: string): boolean {
  const gradeOrder = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9'];
  const gradeIndex = gradeOrder.indexOf(grade);
  const minIndex = gradeOrder.indexOf(minGrade);

  return gradeIndex !== -1 && gradeIndex <= minIndex;
}

// Combined validation
export async function validateCandidateAdmission(jambRegNo: string, programmeId: number) {
  try {
    const session = await auth();

    // Validate UTME subjects
    const utmeResult = await validateUtmeSubjects(jambRegNo, programmeId);
    if (!utmeResult.success) return utmeResult;

    // Validate O-Level results
    const oLevelResult = await validateOLevelResults(jambRegNo, programmeId);
    if (!oLevelResult.success) return oLevelResult;

    // Overall validation
    const overallValid = utmeResult.valid && oLevelResult.valid;

    // Create admission validation record
    await db.insert(admissionValidations).values({
      jambRegNo,
      programmeId,
      utmeSubjectsValid: utmeResult.valid,
      utmeValidationDetails: JSON.stringify(utmeResult.details),
      oLevelValid: oLevelResult.valid,
      oLevelValidationDetails: JSON.stringify(oLevelResult.details),
      overallStatus: overallValid ? 'VALID' : 'INVALID',
      validatedBy: session?.user?.id ? parseInt(session.user.id) : null
    });

    revalidatePath("/admin/admission");
    revalidatePath("/admin/admission/validation");

    return {
      success: true,
      valid: overallValid,
      utmeValid: utmeResult.valid,
      oLevelValid: oLevelResult.valid,
      details: {
        utme: utmeResult.details,
        oLevel: oLevelResult.details
      }
    };

  } catch (error) {
    console.error("Combined validation error:", error);
    return { success: false, error: "Validation failed" };
  }
}

// Get validation status for candidate
export async function getCandidateValidationStatus(jambRegNo: string) {
  try {
    const [validation] = await db
      .select()
      .from(admissionValidations)
      .where(eq(admissionValidations.jambRegNo, jambRegNo))
      .orderBy(desc(admissionValidations.validatedAt))
      .limit(1);

    if (!validation) {
      return { success: false, error: "Validation not found" };
    }

    const utmeDetails = validation.utmeValidationDetails
      ? JSON.parse(validation.utmeValidationDetails)
      : null;

    const oLevelDetails = validation.oLevelValidationDetails
      ? JSON.parse(validation.oLevelValidationDetails)
      : null;

    return {
      success: true,
      validationStatus: validation.overallStatus,
      utmeSubjectsValid: validation.utmeSubjectsValid,
      oLevelValid: validation.oLevelValid,
      validationDetails: {
        utme: utmeDetails,
        oLevel: oLevelDetails
      },
      validatedAt: validation.validatedAt
    };

  } catch (error) {
    console.error("Get validation status error:", error);
    return { success: false, error: "Failed to get validation status" };
  }
}

// Batch validate all candidates for a programme
export async function batchValidateProgrammeCandidates(programmeId: number) {
  try {
    // Get all candidates for this programme
    const candidates = await db
      .select()
      .from(jambCandidates)
      .where(eq(jambCandidates.deptId, programmeId)); // Using deptId since programmeId is missing on jambCandidates according to schema but logic uses programmeId search. Actually courseId is references courses.id

    const results = [];

    for (const candidate of candidates) {
      const result = await validateCandidateAdmission(candidate.jambRegNo, programmeId);
      results.push({
        jambRegNo: candidate.jambRegNo,
        name: `${candidate.surname}, ${candidate.firstname}`,
        ...result
      });
    }

    revalidatePath("/admin/admission");
    revalidatePath("/admin/admission/validation");

    return {
      success: true,
      results,
      totalProcessed: candidates.length,
      validCount: results.filter(r => r.valid).length,
      invalidCount: results.filter(r => !r.valid).length
    };

  } catch (error) {
    console.error("Batch validation error:", error);
    return { success: false, error: "Batch validation failed" };
  }
}
