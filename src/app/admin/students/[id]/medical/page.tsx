import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getStudentMedicalFormData } from "@/actions/dossier";
import { MedicalFormPrintable } from "@/components/documents/MedicalFormPrintable";

export const metadata = {
    title: "Official Student Medical Examination Record (Admin) | Federal School of Statistics, Ibadan",
};

export default async function AdminStudentMedicalPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const studentId = parseInt(params.id);
    if (isNaN(studentId)) {
        redirect("/admin/students");
    }

    const res = await getStudentMedicalFormData(studentId);
    if (!res.success || !res.data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Medical Form Not Found</h2>
                    <p className="text-slate-500 text-sm mb-4">
                        {res.error || "Medical record not submitted for this student."}
                    </p>
                    <a href={`/admin/students/${studentId}`} className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                        Back to Student Profile
                    </a>
                </div>
            </div>
        );
    }

    return <MedicalFormPrintable data={res.data} isStaffView={true} />;
}
