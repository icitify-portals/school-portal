import { db } from "@/db";
import { students, studentMedicalRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import MedicalFormClient from "./MedicalFormClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Student Medical Form",
};

export default async function MedicalFormPage() {
  const session = await auth();
  const user = session?.user;
  if (!user || user.role !== "student") {
    redirect("/login");
  }

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.userId, user.id));

  if (!student) {
    redirect("/dashboard");
  }

  const [medicalRecord] = await db
    .select()
    .from(studentMedicalRecords)
    .where(eq(studentMedicalRecords.studentId, student.id));

  const initialData = {
    kinName: student.kinName || "",
    kinPhone: student.kinPhone || "",
    kinAddress: student.kinAddress || "",
    bloodGroup: student.bloodGroup || "",
    genotype: student.genotype || "",
    commonIllness: medicalRecord?.commonIllness || "",
    illnessFrequency: medicalRecord?.illnessFrequency || "",
    lastOccurrence: medicalRecord?.lastOccurrence || "",
    illnessDescription: medicalRecord?.illnessDescription || "",
    weight: medicalRecord?.weight || "",
    height: medicalRecord?.height || "",
    bloodPressure: medicalRecord?.bloodPressure || "",
    allergies: medicalRecord?.allergies || "",
    medicalHistory: medicalRecord?.medicalHistory || "",
    currentMedications: medicalRecord?.currentMedications || "",
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        {/* Header matching the green theme of the uploaded forms */}
        <div className="bg-green-700 px-6 py-8 sm:px-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <h1 className="relative text-3xl font-black text-white uppercase tracking-wider">
            Student Medical Form
          </h1>
          <p className="relative text-green-100 mt-2 font-medium">
            Federal School of Statistics, Ibadan
          </p>
        </div>

        <div className="p-6 sm:p-10 bg-slate-50">
          <MedicalFormClient initialData={initialData} />
        </div>
      </div>
    </div>
  );
}
