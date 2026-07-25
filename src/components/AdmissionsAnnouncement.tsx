import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, AlertCircle, Phone, Mail, MapPin } from "lucide-react";

export function AdmissionsAnnouncement() {
    return (
        <Card className="bg-white/80 backdrop-blur-xl border-indigo-100 shadow-2xl rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
            <div className="bg-indigo-50/50 p-6 md:p-10 border-b border-indigo-100">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <Megaphone className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">2026/2027 ADMISSIONS NOW OPEN</h2>
                        <div className="text-indigo-600 font-bold text-sm tracking-widest uppercase mt-1">Official Announcement</div>
                    </div>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed max-w-4xl text-lg">
                    The Management of <strong className="text-indigo-900">Federal School of Statistics, Ibadan</strong> wishes to inform the general public that the <strong className="text-indigo-900">maintenance and upgrade of the School Portal has been completed</strong>.
                </p>
            </div>
            
            <CardContent className="p-6 md:p-10 space-y-12">
                <section>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-6 border-b pb-2 inline-block border-indigo-200">Application Invitation</h3>
                    <p className="text-slate-600 font-medium mb-6">
                        Applications are hereby invited from qualified candidates for admission into the following programmes for the <strong className="text-slate-900">2026/2027 Academic Session</strong>:
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h4 className="font-bold text-indigo-900 mb-4 tracking-tight"><strong className="text-indigo-600">1.</strong> NATIONAL DIPLOMA (ND) – Full Time</h4>
                            <ul className="space-y-2 text-slate-600 font-medium list-disc pl-5">
                                <li>Statistics</li>
                                <li>Computer Science</li>
                                <li>Business Administration</li>
                                <li>Accountancy</li>
                            </ul>
                        </div>
                        
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h4 className="font-bold text-indigo-900 mb-4 tracking-tight"><strong className="text-indigo-600">2.</strong> HIGHER NATIONAL DIPLOMA (HND) – Full Time</h4>
                            <ul className="space-y-2 text-slate-600 font-medium list-disc pl-5">
                                <li>Statistics</li>
                                <li>Business Administration and Management</li>
                                <li>Networking and Cloud Computing</li>
                                <li>Artificial Intelligence</li>
                            </ul>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h4 className="font-bold text-indigo-900 mb-4 tracking-tight"><strong className="text-indigo-600">3.</strong> DAILY PART-TIME PROGRAMME (DPP) – ND</h4>
                            <ul className="space-y-2 text-slate-600 font-medium list-disc pl-5">
                                <li>Statistics</li>
                                <li>Computer Science</li>
                                <li>Business Administration</li>
                                <li>Accountancy</li>
                            </ul>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h4 className="font-bold text-indigo-900 mb-4 tracking-tight"><strong className="text-indigo-600">4.</strong> DAILY PART-TIME PROGRAMME (DPP) – HND</h4>
                            <ul className="space-y-2 text-slate-600 font-medium list-disc pl-5">
                                <li>Statistics</li>
                                <li>Business Administration and Management</li>
                                <li>Accountancy</li>
                                <li>Networking and Cloud Computing</li>
                                <li>Artificial Intelligence</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 flex items-start gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-indigo-900 italic">
                            <strong>NB:</strong> All full-time programmes offered by the institution are fully accredited by the National Board for Technical Education (NBTE).
                        </p>
                    </div>
                </section>

                <section>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-6 border-b pb-2 inline-block border-indigo-200">Admission Requirements</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-slate-900 mb-2"><strong>A.</strong> National Diploma (ND)</h4>
                            <ul className="list-decimal pl-5 space-y-1 text-slate-600 font-medium">
                                <li>Candidates must have scored a minimum of <strong>120</strong> in the <strong>2026 UTME</strong>.</li>
                                <li>Candidates must meet the minimum entry requirements for their chosen programme.</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-2"><strong>B.</strong> Higher National Diploma (HND)</h4>
                            <ul className="list-decimal pl-5 space-y-1 text-slate-600 font-medium">
                                <li>Applicants must possess a relevant <strong>National Diploma (ND)</strong> certificate from a recognized institution.</li>
                                <li>Applicants must have completed the <strong>NBTE compulsory One (1) Year Industrial Training (IT)</strong>.</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-2"><strong>C.</strong> Daily Part-Time Programme (DPP)</h4>
                            <ul className="list-decimal pl-5 space-y-1 text-slate-600 font-medium">
                                <li>Candidates without the <strong>2026 UTME</strong> result may apply.</li>
                                <li>Candidates must meet the minimum entry requirements for their chosen programme.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <div className="grid md:grid-cols-2 gap-8">
                    <section className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
                        <h3 className="text-lg font-black uppercase tracking-widest mb-4">Method of Application</h3>
                        <p className="text-slate-300 font-medium mb-4">
                            Interested applicants should apply via the official school portal:
                        </p>
                        <a href="https://portal.fssibadan.edu.ng" className="inline-block text-xl font-black text-indigo-400 hover:text-indigo-300 transition-colors mb-6">
                            <strong>portal.fssibadan.edu.ng</strong>
                        </a>
                        <p className="text-sm text-slate-400">
                            Applicants are advised to apply early and ensure that all required documents are properly uploaded.
                        </p>
                        
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <p className="text-xl font-black text-white italic tracking-tighter">
                                Apply now and secure your future with us!
                            </p>
                        </div>
                    </section>

                    <section className="space-y-6 flex flex-col justify-center">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-6">For Enquiries</h3>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                        <Phone className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div className="text-slate-700 font-medium">
                                        <strong>Contact:</strong> 0708 180 8456, 0703 651 6563, 0803 874 3249
                                    </div>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div className="text-slate-700 font-medium">
                                        <strong>Email:</strong> registrar@fssibadan.edu.ng
                                    </div>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div className="text-slate-700 font-medium">
                                        <strong>Office:</strong> Registrar's Office, Federal School of Statistics, Ibadan.
                                    </div>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="pt-6 border-t border-slate-100">
                            <p className="text-slate-500 font-medium text-sm">Signed,</p>
                            <p className="font-black text-slate-900 text-lg mt-1"><strong>Mr. Mosugu T. M.</strong></p>
                            <p className="text-indigo-600 font-bold text-sm tracking-widest uppercase">Registrar</p>
                            <p className="text-slate-400 text-xs mt-1"><strong>For: Management</strong></p>
                        </div>
                    </section>
                </div>
            </CardContent>
        </Card>
    );
}
