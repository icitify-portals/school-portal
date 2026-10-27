import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getStudentMedicalFormData } from "@/actions/dossier";
import MedicalFormContainer from "./MedicalFormContainer";

export const metadata = {
  title: "Official Student Medical Form | Federal School of Statistics, Ibadan",
};

export default async function MedicalFormPage() {
  const session = await auth();
  const user = session?.user;
  if (!user || (user as any).role !== "student") {
    redirect("/login");
  }

  const res = await getStudentMedicalFormData();
  if (!res.success || !res.data) {
    redirect("/student");
  }

  const { student, medicalRecord } = res.data;

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

  const hasSubmitted = !!(student.medicalFormSubmittedAt || medicalRecord);

  return (
    <MedicalFormContainer 
      data={res.data}
      initialData={initialData}
      hasSubmitted={hasSubmitted}
    />
  );
}
