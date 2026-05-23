"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, MapPin, Phone, Mail, Globe, Droplets } from "lucide-react";
import React from "react";

interface IDCardVisualProps {
    data: {
        name: string;
        image?: string;
        identifier: string; // Matric or Staff ID
        designation: string; // "Student" or Job Title
        department: string;
        issueDate: string;
        expiryDate: string;
        qrCode?: string;
        bloodGroup?: string;
        genotype?: string;
    }
    userType: 'student' | 'staff';
}

export function IDCardVisual({ data, userType }: IDCardVisualProps) {
    const isStudent = userType === 'student';

    return (
        <div className="relative w-[340px] h-[540px] bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-200 group perspective-1000">
            {/* Background Security Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            {/* Top Branding Section */}
            <div className={`h-32 ${isStudent ? 'bg-indigo-600' : 'bg-slate-900'} relative p-6 flex flex-col justify-between overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-lg">
                            <ShieldCheck className={`${isStudent ? 'text-indigo-600' : 'text-slate-900'} w-full h-full`} />
                        </div>
                        <span className="text-white font-black uppercase text-[10px] tracking-widest leading-none">Academic<br />Portal</span>
                    </div>
                </div>
                <div className="relative z-10 flex justify-between items-baseline">
                    <h2 className="text-white font-black uppercase italic text-lg tracking-tighter leading-none">
                        {isStudent ? "Student ID" : "Staff ID"}
                    </h2>
                    <span className="text-white/40 font-bold text-[8px] uppercase tracking-widest">Official Credential</span>
                </div>
            </div>

            {/* Photo Section */}
            <div className="px-6 -mt-10 relative z-20 flex flex-col items-center">
                <div className="relative">
                    <Avatar className="w-32 h-32 rounded-[40px] border-4 border-white shadow-2xl ring-1 ring-slate-200">
                        <AvatarImage src={data.image} alt={data.name} />
                        <AvatarFallback className="bg-slate-100 text-slate-400 font-black text-3xl">{data.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-2 -right-2 w-10 h-10 ${isStudent ? 'bg-indigo-600' : 'bg-slate-900'} rounded-2xl flex items-center justify-center shadow-lg border-2 border-white`}>
                        <ShieldCheck className="text-white w-5 h-5" />
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight">{data.name}</h3>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isStudent ? 'text-indigo-600' : 'text-slate-500'} mt-1`}>{data.designation}</p>
                </div>
            </div>

            {/* Details Section */}
            <div className="px-8 mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Identifier" value={data.identifier} />
                    <DetailItem label="Department" value={data.department} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Issued" value={data.issueDate} />
                    <DetailItem label="Expires" value={data.expiryDate} />
                </div>

                <div className="h-px bg-slate-100 w-full" />

                <div className="flex justify-between items-end">
                    <div className="space-y-3">
                        {data.bloodGroup && (
                            <div className="flex items-center gap-2">
                                <Droplets className="w-3.5 h-3.5 text-red-500" />
                                <span className="text-[11px] font-bold text-slate-600">{data.bloodGroup} / {data.genotype}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-600">portal.example.edu.ng</span>
                        </div>
                    </div>

                    {data.qrCode && (
                        <div className="p-1 bg-white border border-slate-100 rounded-xl shadow-inner">
                            <img src={data.qrCode} alt="Verification QR" className="w-16 h-16 grayscale opacity-80" />
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Guilloché Strip */}
            <div className={`absolute bottom-0 left-0 w-full h-1.5 ${isStudent ? 'bg-indigo-600' : 'bg-slate-900'} opacity-20`} />
            <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-indigo-500 to-purple-600`} />
        </div>
    );
}

function DetailItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{label}</p>
            <p className="text-[11px] font-bold text-slate-800 uppercase truncate">{value}</p>
        </div>
    );
}
