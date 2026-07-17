import { auth } from "@/auth";
import { db } from "@/db/db";
import { admissionFormTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewApplicationPage() {
    const session = await auth();
    if (!session || !session.user) {
        redirect("/login");
    }

    // Fetch active admission form templates
    const templates = await db.query.admissionFormTemplates.findMany({
        where: eq(admissionFormTemplates.isActive, true)
    });

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="absolute -right-20 -bottom-20 opacity-5 blur-2xl">
                    <Sparkles className="w-[400px] h-[400px]" />
                </div>
                <div className="relative z-10 text-center md:text-left">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-black uppercase tracking-widest text-slate-300 mb-4">
                        New Application
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Available Programmes</h2>
                    <p className="text-slate-400 font-medium">Select a programme below to begin your application process.</p>
                </div>
            </div>

            {templates.length === 0 ? (
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-12 text-center flex flex-col items-center justify-center min-h-[40vh]">
                    <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="w-10 h-10 text-rose-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No Active Programmes</h3>
                    <p className="text-slate-500 font-medium mb-8 max-w-sm">There are currently no admission programmes open for application. Please check back later.</p>
                    <Link href="/applicant" className="bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-4 rounded-xl text-sm uppercase tracking-widest shadow-xl">
                        Back to Dashboard
                    </Link>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {templates.map((template) => (
                        <Card key={template.id} className="border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all rounded-[2rem] bg-white flex flex-col h-full overflow-hidden group">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">{template.level}</div>
                                <CardTitle className="text-xl font-black text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors">
                                    {template.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex-1 flex flex-col">
                                <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-3">
                                    {template.description || "Apply for this programme to join our institution."}
                                </p>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">App Fee:</span>
                                        <span className="font-black text-slate-800">₦{parseFloat(template.applicationFee || "0").toLocaleString()}</span>
                                    </div>
                                    <form action={`/api/applicant/start-application`} method="POST">
                                        <input type="hidden" name="templateId" value={template.id} />
                                        <button type="submit" className="w-full bg-[#1a5b3a] hover:bg-[#134229] text-white font-black py-4 rounded-xl flex items-center justify-between px-6 transition-all text-xs uppercase tracking-widest shadow-lg">
                                            <span>Apply Now</span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                        </button>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
