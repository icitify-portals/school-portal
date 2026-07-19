"use server";

import { db } from "@/db/db";
import {
  programmes,
  programmeUtmeRequirements,
  programmeOLevelRequirements
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// UTME Requirements Management
export async function addUtmeRequirement(
  programmeId: number,
  subjectName: string,
  isCompulsory: boolean = true,
  isAlternative: boolean = false,
  alternativeSubjects: string[] = []
) {
  try {
    await db.insert(programmeUtmeRequirements).values({
      programmeId,
      subjectName: subjectName.trim(),
      isCompulsory: isCompulsory,
      isAlternative: isAlternative,
      alternativeSubjects: alternativeSubjects.length > 0 ? JSON.stringify(alternativeSubjects) : null
    });

    revalidatePath(`/admin/programmes/${programmeId}/requirements`);
    return { success: true };

  } catch (error) {
    console.error("Add UTME requirement error:", error);
    return { success: false, error: "Failed to add UTME requirement" };
  }
}

export async function updateUtmeRequirement(
  id: number,
  subjectName: string,
  isCompulsory: boolean,
  isAlternative: boolean,
  alternativeSubjects: string[] = []
) {
  try {
    await db
      .update(programmeUtmeRequirements)
      .set({
        subjectName: subjectName.trim(),
        isCompulsory: isCompulsory,
        isAlternative: isAlternative,
        alternativeSubjects: alternativeSubjects.length > 0 ? JSON.stringify(alternativeSubjects) : null
      })
      .where(eq(programmeUtmeRequirements.id, id));

    revalidatePath("/admin/programmes");
    return { success: true };

  } catch (error) {
    console.error("Update UTME requirement error:", error);
    return { success: false, error: "Failed to update UTME requirement" };
  }
}

export async function deleteUtmeRequirement(id: number) {
  try {
    await db
      .delete(programmeUtmeRequirements)
      .where(eq(programmeUtmeRequirements.id, id));

    revalidatePath("/admin/programmes");
    return { success: true };

  } catch (error) {
    console.error("Delete UTME requirement error:", error);
    return { success: false, error: "Failed to delete UTME requirement" };
  }
}

// O-Level Requirements Management
export async function addOLevelRequirement(
  programmeId: number,
  subjectName: string,
  isCompulsory: boolean = true,
  minGrade: string = 'C6',
  acceptTwoSittings: boolean = false,
  sixthSubjectRequired: boolean = false
) {
  try {
    await db.insert(programmeOLevelRequirements).values({
      programmeId,
      subjectName: subjectName.trim(),
      isCompulsory: isCompulsory,
      minGrade,
      acceptTwoSittings: acceptTwoSittings,
      sixthSubjectRequired: sixthSubjectRequired
    });

    revalidatePath(`/admin/programmes/${programmeId}/requirements`);
    return { success: true };

  } catch (error) {
    console.error("Add O-Level requirement error:", error);
    return { success: false, error: "Failed to add O-Level requirement" };
  }
}

export async function updateOLevelRequirement(
  id: number,
  subjectName: string,
  isCompulsory: boolean,
  minGrade: string,
  acceptTwoSittings: boolean,
  sixthSubjectRequired: boolean
) {
  try {
    await db
      .update(programmeOLevelRequirements)
      .set({
        subjectName: subjectName.trim(),
        isCompulsory: isCompulsory,
        minGrade,
        acceptTwoSittings: acceptTwoSittings,
        sixthSubjectRequired: sixthSubjectRequired
      })
      .where(eq(programmeOLevelRequirements.id, id));

    revalidatePath("/admin/programmes");
    return { success: true };

  } catch (error) {
    console.error("Update O-Level requirement error:", error);
    return { success: false, error: "Failed to update O-Level requirement" };
  }
}

export async function deleteOLevelRequirement(id: number) {
  try {
    await db
      .delete(programmeOLevelRequirements)
      .where(eq(programmeOLevelRequirements.id, id));

    revalidatePath("/admin/programmes");
    return { success: true };

  } catch (error) {
    console.error("Delete O-Level requirement error:", error);
    return { success: false, error: "Failed to delete O-Level requirement" };
  }
}

// Get programme requirements
export async function getProgrammeRequirements(programmeId: number) {
  try {
    const [programme] = await db
      .select()
      .from(programmes)
      .where(eq(programmes.id, programmeId))
      .limit(1);

    if (!programme) {
      return { success: false, error: "Programme not found" };
    }

    const utmeRequirements = await db
      .select()
      .from(programmeUtmeRequirements)
      .where(eq(programmeUtmeRequirements.programmeId, programmeId));

    const oLevelRequirements = await db
      .select()
      .from(programmeOLevelRequirements)
      .where(eq(programmeOLevelRequirements.programmeId, programmeId));

    // Parse JSON fields
    const parsedUtmeRequirements = utmeRequirements.map(req => ({
      ...req,
      alternativeSubjects: req.alternativeSubjects ? JSON.parse(req.alternativeSubjects) : []
    }));

    return {
      success: true,
      programme,
      utmeRequirements: parsedUtmeRequirements,
      oLevelRequirements
    };

  } catch (error) {
    console.error("Get programme requirements error:", error);
    return { success: false, error: "Failed to get programme requirements" };
  }
}

// Get all programmes with their requirements
export async function getAllProgrammesWithRequirements() {
  try {
    const allProgrammes = await db.select().from(programmes);

    const programmesWithRequirements = [];

    for (const programme of allProgrammes) {
      const requirements = await getProgrammeRequirements(programme.id);

      if (requirements.success) {
        programmesWithRequirements.push({
          ...programme,
          utmeRequirements: requirements.utmeRequirements,
          oLevelRequirements: requirements.oLevelRequirements
        });
      }
    }

    return {
      success: true,
      programmes: programmesWithRequirements
    };

  } catch (error) {
    console.error("Get all programmes with requirements error:", error);
    return { success: false, error: "Failed to get programmes" };
  }
}

// Copy requirements from one programme to another
export async function copyProgrammeRequirements(
  sourceProgrammeId: number,
  targetProgrammeId: number
) {
  try {
    const sourceRequirements = await getProgrammeRequirements(sourceProgrammeId);

    if (!sourceRequirements.success || !sourceRequirements.utmeRequirements || !sourceRequirements.oLevelRequirements) {
      return { success: false, error: "Source programme not found" };
    }

    // Clear existing requirements for target programme
    await db
      .delete(programmeUtmeRequirements)
      .where(eq(programmeUtmeRequirements.programmeId, targetProgrammeId));

    await db
      .delete(programmeOLevelRequirements)
      .where(eq(programmeOLevelRequirements.programmeId, targetProgrammeId));

    // Copy UTME requirements
    for (const req of sourceRequirements.utmeRequirements) {
      await db.insert(programmeUtmeRequirements).values({
        programmeId: targetProgrammeId,
        subjectName: req.subjectName,
        isCompulsory: req.isCompulsory,
        isAlternative: req.isAlternative,
        alternativeSubjects: req.alternativeSubjects
      });
    }

    // Copy O-Level requirements
    for (const req of sourceRequirements.oLevelRequirements) {
      await db.insert(programmeOLevelRequirements).values({
        programmeId: targetProgrammeId,
        subjectName: req.subjectName,
        isCompulsory: req.isCompulsory,
        minGrade: req.minGrade,
        acceptTwoSittings: req.acceptTwoSittings,
        sixthSubjectRequired: req.sixthSubjectRequired
      });
    }

    revalidatePath(`/admin/programmes/${targetProgrammeId}/requirements`);
    return { success: true };

  } catch (error) {
    console.error("Copy programme requirements error:", error);
    return { success: false, error: "Failed to copy requirements" };
  }
}

// Get common subject templates for quick setup
import { UTME_SUBJECT_TEMPLATES, OLEVEL_SUBJECT_TEMPLATES } from "@/lib/constants/admission-templates";

// Apply template to programme
export async function applyUtmeTemplate(
  programmeId: number,
  template: keyof typeof UTME_SUBJECT_TEMPLATES
) {
  try {
    const templateData = UTME_SUBJECT_TEMPLATES[template];

    // Clear existing requirements
    await db
      .delete(programmeUtmeRequirements)
      .where(eq(programmeUtmeRequirements.programmeId, programmeId));

    // Add compulsory subjects
    for (const subject of templateData.compulsory) {
      await addUtmeRequirement(programmeId, subject, true, false, []);
    }

    // Add alternative subjects
    if (templateData.alternatives) {
      for (const [subject, alternatives] of Object.entries(templateData.alternatives)) {
        await addUtmeRequirement(programmeId, subject, false, true, alternatives as string[]);
      }
    }

    revalidatePath(`/admin/programmes/${programmeId}/requirements`);
    return { success: true };

  } catch (error) {
    console.error("Apply UTME template error:", error);
    return { success: false, error: "Failed to apply template" };
  }
}

export async function applyOLevelTemplate(
  programmeId: number,
  template: keyof typeof OLEVEL_SUBJECT_TEMPLATES
) {
  try {
    const templateData = OLEVEL_SUBJECT_TEMPLATES[template];

    // Clear existing requirements
    await db
      .delete(programmeOLevelRequirements)
      .where(eq(programmeOLevelRequirements.programmeId, programmeId));

    // Add compulsory subjects
    for (const subject of templateData.compulsory) {
      await addOLevelRequirement(
        programmeId,
        subject,
        true,
        templateData.minGrade,
        templateData.acceptsTwoSittings,
        templateData.sixthSubjectRequired
      );
    }

    // Add optional subjects (not compulsory)
    for (const subject of templateData.optional) {
      await addOLevelRequirement(
        programmeId,
        subject,
        false,
        templateData.minGrade,
        templateData.acceptsTwoSittings,
        templateData.sixthSubjectRequired
      );
    }

    revalidatePath(`/admin/programmes/${programmeId}/requirements`);
    return { success: true };

  } catch (error) {
    console.error("Apply O-Level template error:", error);
    return { success: false, error: "Failed to apply template" };
  }
}
