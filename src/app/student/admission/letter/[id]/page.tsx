import { notFound } from "next/navigation";
import { AdmissionLetterService } from "@/services/AdmissionLetterService";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdmissionLetterPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const appId = parseInt(id);

    try {
        const htmlContent = await AdmissionLetterService.generateLetter(appId);

        return (
            <div className="min-h-screen bg-slate-100 p-4 md:p-8 print:bg-white print:p-0">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Actions (Hidden on Print) */}
                    <div className="flex justify-between items-center print:hidden bg-white p-4 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-bold text-slate-700">Admission Letter</h2>
                        <Button onClick={() => window.print()} className="bg-indigo-600">
                            <Printer className="h-4 w-4 mr-2" /> Print Letter
                        </Button>
                    </div>

                    {/* The Letter */}
                    <div 
                        className="bg-white shadow-2xl p-12 md:p-20 min-h-[1100px] border-t-8 border-indigo-600 print:shadow-none print:border-none print:p-0"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                </div>
            </div>
        );
    } catch (error) {
        console.error("Failed to load admission letter:", error);
        notFound();
    }
}
