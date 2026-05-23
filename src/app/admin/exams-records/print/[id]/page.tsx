import AcademicRecordPrintout from "@/components/exams-records/AcademicRecordPrintout";

export default async function PrintRecordPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const studentId = parseInt(id);

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 print:bg-white print:p-0">
            <AcademicRecordPrintout studentId={studentId} />
        </div>
    );
}
