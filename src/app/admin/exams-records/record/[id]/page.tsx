import AcademicRecordPrintout from "@/components/exams-records/AcademicRecordPrintout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function StudentRecordPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const studentId = parseInt(id);

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/exams-records">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Detailed Academic Record</h2>
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Exams and Records Clearance</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 md:p-12">
                    <AcademicRecordPrintout studentId={studentId} />
                </div>
            </div>
        </div>
    );
}
