"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students, studentMedicalRecords } from "@/db/schema";
import { auth } from "@/auth";

export async function submitMedicalForm(formData: any) {
  try {
    const session = await auth();
  const user = session?.user;
    if (!user || user.role !== "student") {
      return { success: false, message: "Unauthorized. Please log in as a student." };
    }

    // Ensure student exists
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.userId, user.id));

    if (!student) {
      return { success: false, message: "Student record not found." };
    }

    // 1. Update students table (kin, blood, genotype, healthStatus)
    await db
      .update(students)
      .set({
        kinName: formData.kinName,
        kinPhone: formData.kinPhone,
        kinAddress: formData.kinAddress,
        bloodGroup: formData.bloodGroup,
        genotype: formData.genotype,
        healthStatus: "cleared", // Mark as cleared
      })
      .where(eq(students.id, student.id));

    // 2. Insert or update student_medical_records
    const [existingRecord] = await db
      .select()
      .from(studentMedicalRecords)
      .where(eq(studentMedicalRecords.studentId, student.id));

    if (existingRecord) {
      await db
        .update(studentMedicalRecords)
        .set({
          commonIllness: formData.commonIllness,
          illnessFrequency: formData.illnessFrequency,
          lastOccurrence: formData.lastOccurrence,
          illnessDescription: formData.illnessDescription,
          weight: formData.weight,
          height: formData.height,
          bloodPressure: formData.bloodPressure,
          allergies: formData.allergies,
          medicalHistory: formData.medicalHistory,
          currentMedications: formData.currentMedications,
        })
        .where(eq(studentMedicalRecords.id, existingRecord.id));
    } else {
      await db.insert(studentMedicalRecords).values({
        studentId: student.id,
        commonIllness: formData.commonIllness,
        illnessFrequency: formData.illnessFrequency,
        lastOccurrence: formData.lastOccurrence,
        illnessDescription: formData.illnessDescription,
        weight: formData.weight,
        height: formData.height,
        bloodPressure: formData.bloodPressure,
        allergies: formData.allergies,
        medicalHistory: formData.medicalHistory,
        currentMedications: formData.currentMedications,
      });
    }

    return { success: true, message: "Medical records updated successfully." };
  } catch (error: any) {
    console.error("Error submitting medical form:", error);
    return { success: false, message: error.message || "Failed to submit medical records." };
  }
}
