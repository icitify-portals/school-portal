import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultSlipProps {
    studentName: string;
    regNumber?: string;
    examTitle: string;
    score: number;
    totalMarks: number;
    percentage: number;
}

export function ResultSlip({ studentName, regNumber, examTitle, score, totalMarks, percentage }: ResultSlipProps) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-3xl w-full mx-auto p-4 space-y-6">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #result-slip, #result-slip * { visibility: visible; }
                    #result-slip { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
                    .no-print { display: none !important; }
                }
            `}</style>
            
            <div className="flex justify-end no-print">
                <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2 font-black uppercase text-xs tracking-widest">
                    <Printer className="w-4 h-4" /> Print Result Slip
                </Button>
            </div>

            <Card id="result-slip" className="bg-white border-2 border-slate-200 shadow-2xl rounded-3xl overflow-hidden">
                {/* Header */}
                <div className="bg-emerald-700 p-8 text-center border-b-[8px] border-emerald-500 relative">
                    <ShieldCheck className="w-24 h-24 text-emerald-100 mx-auto opacity-20 absolute inset-0 m-auto" />
                    <div className="relative z-10">
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                            Joint Assessment Result Slip
                        </h1>
                        <p className="text-emerald-100 font-semibold tracking-widest text-sm uppercase">
                            Official Notification of Results
                        </p>
                    </div>
                </div>

                {/* Candidate Info */}
                <div className="p-8 border-b-2 border-slate-100 flex items-start gap-8">
                    <div className="w-32 h-32 bg-slate-100 border-4 border-white shadow-lg rounded-2xl flex items-center justify-center shrink-0">
                        <User className="w-16 h-16 text-slate-300" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Name</p>
                                <p className="text-lg font-black text-slate-900 uppercase">{studentName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration No.</p>
                                <p className="text-lg font-black text-slate-900 uppercase">{regNumber || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Examination Date</p>
                                <p className="text-lg font-black text-slate-900 uppercase">{new Date().toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-black uppercase">Verified</Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scores */}
                <div className="p-8 bg-slate-50">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Subject Performance</h3>
                    
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b-2 border-slate-100 bg-slate-100/50">
                            <span className="font-black text-slate-500 uppercase text-xs tracking-widest">Subject</span>
                            <span className="font-black text-slate-500 uppercase text-xs tracking-widest text-right">Score</span>
                        </div>
                        <div className="flex items-center justify-between p-6">
                            <span className="font-black text-slate-900 uppercase">{examTitle}</span>
                            <span className="font-black text-3xl tabular-nums tracking-tighter text-indigo-600">{score.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Aggregate Percentage</p>
                                <div className="text-5xl font-black tracking-tighter">{percentage.toFixed(1)}%</div>
                            </div>
                            <div className="absolute -right-4 -bottom-4 text-[120px] font-black text-white/5 opacity-50 leading-none select-none">
                                %
                            </div>
                        </div>
                        
                        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Marks Obtainable</p>
                            <div className="text-5xl font-black tracking-tighter text-slate-300">{totalMarks.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 text-center border-t-2 border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    This result is electronically generated and secured by the Examination Board.
                </div>
            </Card>
        </div>
    );
}
