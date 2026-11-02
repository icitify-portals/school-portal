"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students, studentMedicalRecords } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function submitMedicalForm(formData: any) {
  try {
    const session = await auth();
    const user = session?.user;
    if (!user || user.role !== "student") {
      return { success: false, message: "Unauthorized. Please log in as a student." };
    }

    // Validate essential contact and health background fields
    const requiredFields: { key: string; label: string }[] = [
      { key: "kinName", label: "Next of Kin Name" },
      { key: "kinPhone", label: "Next of Kin Phone" },
      { key: "kinAddress", label: "Next of Kin Address" },
      { key: "commonIllness", label: "Common Illness (enter 'None' if not applicable)" },
      { key: "illnessFrequency", label: "Illness Frequency (enter 'None' or 'N/A' if not applicable)" },
      { key: "lastOccurrence", label: "Last Occurrence (enter 'None' or 'N/A' if not applicable)" },
      { key: "illnessDescription", label: "Illness Description (enter 'None' or 'N/A' if not applicable)" },
      { key: "allergies", label: "Allergies (enter 'None' if not applicable)" },
      { key: "medicalHistory", label: "Medical History (enter 'None' if not applicable)" },
      { key: "currentMedications", label: "Current Medications (enter 'None' if not applicable)" },
    ];

    for (const f of requiredFields) {
      const val = String(formData?.[f.key] ?? "").trim();
      if (!val) {
        return {
          success: false,
          message: `Please fill in: ${f.label}. (Enter "None" or "N/A" if not applicable).`,
        };
      }
    }

    // Ensure student exists
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.userId, Number(user.id)));

    if (!student) {
      return { success: false, message: "Student record not found." };
    }

    // 1. Update students table (kin, blood, genotype, healthStatus, medicalFormSubmittedAt)
    const bloodGroup = String(formData.bloodGroup ?? "").trim() || student.bloodGroup || "Pending Test";
    const genotype = String(formData.genotype ?? "").trim() || student.genotype || "Pending Test";

    await db
      .update(students)
      .set({
        kinName: String(formData.kinName).trim(),
        kinPhone: String(formData.kinPhone).trim(),
        kinAddress: String(formData.kinAddress).trim(),
        bloodGroup,
        genotype,
        healthStatus: student.healthStatus === "cleared" ? "cleared" : "pending",
        medicalFormSubmittedAt: student.medicalFormSubmittedAt || new Date(),
      })
      .where(eq(students.id, student.id));

    // 2. Insert or update student_medical_records
    const [existingRecord] = await db
      .select()
      .from(studentMedicalRecords)
      .where(eq(studentMedicalRecords.studentId, student.id));

    // Height, weight, blood pressure can be filled by student or measured later by clinic officer
    const height = String(formData.height ?? "").trim() || existingRecord?.height || "Pending Clinic Measurement";
    const weight = String(formData.weight ?? "").trim() || existingRecord?.weight || "Pending Clinic Measurement";
    const bloodPressure = String(formData.bloodPressure ?? "").trim() || existingRecord?.bloodPressure || "Pending Clinic Measurement";

    const medicalPayload = {
      commonIllness: String(formData.commonIllness).trim(),
      illnessFrequency: String(formData.illnessFrequency).trim(),
      lastOccurrence: String(formData.lastOccurrence).trim(),
      illnessDescription: String(formData.illnessDescription).trim(),
      weight,
      height,
      bloodPressure,
      allergies: String(formData.allergies).trim(),
      medicalHistory: String(formData.medicalHistory).trim(),
      currentMedications: String(formData.currentMedications).trim(),
    };

    if (existingRecord) {
      await db
        .update(studentMedicalRecords)
        .set(medicalPayload)
        .where(eq(studentMedicalRecords.id, existingRecord.id));
    } else {
      await db.insert(studentMedicalRecords).values({
        studentId: student.id,
        ...medicalPayload,
      });
    }

    revalidatePath("/student/medical");
    revalidatePath("/student");
    revalidatePath(`/admin/students/${student.id}/medical`);
    revalidatePath("/admin/health/medical-records");

    return {
      success: true,
      message: "Medical form submitted successfully.",
    };
  } catch (error: any) {
    console.error("Error submitting medical form:", error);
    return {
      success: false,
      message: error?.message || "An unexpected error occurred while saving your medical form.",
    };
  }
}
