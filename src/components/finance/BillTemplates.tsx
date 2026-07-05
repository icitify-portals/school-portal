"use client";

import React from "react";
import { User } from "lucide-react";
import { AcademicNomenclature } from "@/lib/nomenclature";

interface BillItem {
    sn: number;
    description: string;
    cost: number;
    discount: number;
    amount: number;
    billType: string;
}

interface BillSummary {
    totalCost: number;
    totalDiscount: number;
    broughtForward: number;
    outstandingDebt: number;
    amountExpected: number;
    amountPaid: number;
}

interface SchoolBillProps {
    bill: any;
    student: any;
    items: BillItem[];
    summary: BillSummary;
    branding: any;
    bursarySettings?: Record<string, string>;
    billNote?: string;
    schoolBillNote?: string;
}

const fmt = (n: number) => n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const SchoolBillTemplate = ({
    bill,
    student,
    items,
    summary,
    branding,
    bursarySettings = {},
    billNote,
    schoolBillNote
}: SchoolBillProps) => {
    const termLabel = AcademicNomenclature.getLabel(
        bill.session?.currentSemester || "1",
        bursarySettings
    );
    const sessionName = bill.session?.name || "Current Session";
    const dateStr = new Date(bill.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    // Ordinal suffix for day
    const day = new Date(bill.createdAt).getDate();
    const suffix = ['th','st','nd','rd'][(day % 10 > 3 || [11,12,13].includes(day % 100)) ? 0 : day % 10];
    const formattedDate = dateStr.replace(/^\d+/, `${day}${suffix}`);

    const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    const levelProgramme = student.programme?.name
        ? `${student.currentLevel || ''} Level, ${student.programme.name}`
        : `${student.currentLevel || ''} Level`;

    return (
        <div
            id="bill-content"
            className="max-w-3xl mx-auto bg-white p-8 md:p-10 shadow-2xl shadow-slate-200 border border-slate-200 print:shadow-none print:border-none print:p-4 print:max-w-none"
            style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
        >
            {/* ====== TOP HEADER: Logo | School Info | Student Photo ====== */}
            <div className="flex justify-between items-center mb-1">
                {/* School Logo */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center w-[80px]">
                    {(branding?.INST_LOGO?.trim() && branding.INST_LOGO !== 'null') ? (
                        <img
                            src={branding.INST_LOGO}
                            alt="School Logo"
                            className="w-[60px] h-[60px] object-contain"
                            onError={(e) => { e.currentTarget.src = "/logo.png"; }}
                        />
                    ) : (
                        <div className="w-[60px] h-[60px] bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase">
                            Logo
                        </div>
                    )}
                </div>

                {/* School Info (center) */}
                <div className="flex-1 text-center uppercase">
                    <h1
                        className="text-[22px] font-bold tracking-tight text-slate-900 leading-tight"
                        style={{ fontFamily: branding.FONT_FAMILY || "'Montserrat', sans-serif", fontWeight: 700 }}
                    >
                        {branding.INST_NAME}
                    </h1>
                    {branding.INST_MOTTO && (
                        <p className="text-[11px] font-medium italic text-slate-600 mt-0.5">
                            <span className="capitalize not-italic font-semibold">Motto:</span>{' '}
                            {branding.INST_MOTTO}
                        </p>
                    )}
                    {branding.INST_ADDRESS && (
                        <p className="text-[9px] font-medium italic text-slate-500 mt-0.5 max-w-[400px] mx-auto text-center leading-tight">
                            {branding.INST_ADDRESS}
                        </p>
                    )}
                </div>

                {/* Student Passport Photo */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center w-[80px]">
                    {student.imageUrl ? (
                        <img
                            src={student.imageUrl}
                            alt="Student"
                            className="w-[60px] h-[60px] object-cover border border-slate-200"
                        />
                    ) : (
                        <div className="w-[60px] h-[60px] bg-slate-50 border border-slate-200 flex items-center justify-center">
                            <User className="w-7 h-7 text-slate-300" />
                        </div>
                    )}
                </div>
            </div>

            {/* ====== BILL DESCRIPTION ====== */}
            <div className="text-center mt-3 mb-0.5">
                <p className="text-[12px] font-bold text-slate-900 uppercase tracking-wide">
                    School Bill — {studentName}, {levelProgramme}
                </p>
                <p className="text-[12px] font-bold text-slate-700">
                    Admission No: {student.matricNumber || student.admissionNumber || '—'}
                </p>
            </div>

            {/* ====== SESSION / SEMESTER ====== */}
            <div className="text-center mt-1 mb-0.5">
                <p className="text-[12px] font-bold text-slate-800 uppercase">
                    {termLabel}, {sessionName} Session
                </p>
            </div>

            {/* ====== DATE (Right aligned) ====== */}
            <div className="text-right mb-2">
                <p className="text-[12px] font-bold text-slate-800">
                    Date: {formattedDate}
                </p>
            </div>

            {/* ====== ITEMIZED FEE TABLE ====== */}
            <table className="w-full border-collapse text-[11px] mb-1">
                <thead>
                    <tr className="bg-slate-50">
                        <th className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-700 w-[40px]">S/N</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-700">Item</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-700 w-[100px]">Cost (₦)</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-700 w-[95px]">Discount (₦)</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-700 w-[100px]">Amount (₦)</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-700 w-[95px]">Bill Type</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.sn} className="hover:bg-slate-50/50">
                            <td className="border border-slate-400 px-2 py-1 text-center text-slate-700">{item.sn}</td>
                            <td className="border border-slate-400 px-2 py-1 text-slate-800 font-medium">{item.description}</td>
                            <td className="border border-slate-400 px-2 py-1 text-center text-slate-700">{fmt(item.cost)}</td>
                            <td className="border border-slate-400 px-2 py-1 text-center text-slate-700">
                                {item.discount > 0 ? fmt(item.discount) : '---'}
                            </td>
                            <td className="border border-slate-400 px-2 py-1 text-center font-semibold text-slate-800">{fmt(item.amount)}</td>
                            <td className="border border-slate-400 px-2 py-1 text-center text-slate-600 text-[10px]">{item.billType}</td>
                        </tr>
                    ))}

                    {items.length === 0 && (
                        <tr>
                            <td colSpan={6} className="border border-slate-400 px-4 py-6 text-center text-slate-400 italic">
                                No fee items on this bill.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* ====== SUMMARY TABLE ====== */}
            <table className="w-full border-collapse text-[12px] mt-1 mb-4">
                <tbody>
                    <tr>
                        <td className="border border-slate-400 px-3 py-1.5 text-left font-bold text-slate-800 w-[55%]">
                            Total Cost (₦) :
                        </td>
                        <td className="border border-slate-400 px-3 py-1.5 text-right font-bold text-slate-900">
                            {fmt(summary.totalCost)}
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-slate-400 px-3 py-1.5 text-left font-bold text-slate-800">
                            Total Discount (₦) :
                        </td>
                        <td className="border border-slate-400 px-3 py-1.5 text-right font-bold text-slate-900">
                            {fmt(summary.totalDiscount)}
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-slate-400 px-3 py-1.5 text-left font-bold text-slate-800">
                            Brought Forward (₦) :
                        </td>
                        <td className="border border-slate-400 px-3 py-1.5 text-right font-bold text-slate-900">
                            {fmt(summary.broughtForward)}
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-slate-400 px-3 py-1.5 text-left font-bold text-slate-800">
                            Outstanding Debt (₦) :
                        </td>
                        <td className="border border-slate-400 px-3 py-1.5 text-right font-bold text-rose-700">
                            {fmt(summary.outstandingDebt)}
                        </td>
                    </tr>
                    <tr className="bg-slate-50">
                        <td className="border border-slate-400 px-3 py-2 text-left font-extrabold text-slate-900 text-[13px]">
                            Amount Expected (₦) :
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-right font-extrabold text-slate-900 text-[14px]">
                            {fmt(summary.amountExpected)}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ====== NOTES SECTION ====== */}
            {(billNote || schoolBillNote) && (
                <div className="mt-6 text-[11px] text-slate-700 leading-relaxed space-y-2">
                    {billNote && (
                        <div className="font-bold border-t border-slate-200 pt-3">
                            <span className="text-slate-900">NB:</span> {billNote}
                        </div>
                    )}
                    {schoolBillNote && (
                        <div
                            className="text-[11px] text-slate-600"
                            dangerouslySetInnerHTML={{ __html: schoolBillNote }}
                        />
                    )}
                </div>
            )}

            {/* ====== FOOTER WATERMARK ====== */}
            <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center print:mt-6">
                <p className="text-[8px] text-slate-300 uppercase tracking-[0.3em] font-bold">
                    This is a computer-generated bill — {branding.INST_NAME}
                </p>
            </div>
        </div>
    );
};
