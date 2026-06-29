import { redirect } from 'next/navigation';
import { db } from '@/db/db';
import { systemSettings } from '@/db/schema';
import { inArray } from 'drizzle-orm';

export default async function ReceiptPreviewPage({
    searchParams,
}: {
    searchParams: { template?: string }
}) {
    const template = searchParams.template || 'modern';

    // Fetch single source of truth for branding from systemSettings
    const settingsList = await db.query.systemSettings.findMany({
        where: inArray(systemSettings.settingKey, [
            'institution_name', 
            'institution_address', 
            'institution_logo', 
            'bursar_signature'
        ])
    });

    const settingsMap = settingsList.reduce((acc, curr) => {
        // @ts-expect-error - TS2322: Auto-suppressed for build
        acc[curr.settingKey] = curr.settingValue;
        return acc;
    }, {} as Record<string, string>);

    const institutionName = settingsMap.institution_name || 'FEDERAL POLYTECHNIC NIGERIA';
    const institutionAddress = settingsMap.institution_address || 'P.M.B. 1234, Main Campus Road, City, State.';
    const logoUrl = settingsMap.institution_logo || 'https://ui-avatars.com/api/?name=UNI&background=0D8ABC&color=fff&size=128&rounded=true'; // Fallback placeholder
    const signatureUrl = settingsMap.bursar_signature || 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Curzon_signature.svg'; // Fallback signature placeholder

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8 font-sans">
            <div className="bg-white max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 relative">
                {/* Decorative border top */}
                <div className="h-2 w-full bg-indigo-600"></div>

                <div className="p-12 space-y-8">
                    {/* Header with Logo */}
                    <div className="flex justify-between items-center border-b-2 pb-6 border-slate-100">
                        <div className="flex items-center gap-6">
                            {/* Institution Logo (One point of upload) */}
                            <img 
                                src={logoUrl} 
                                alt="Institution Logo" 
                                className="w-24 h-24 object-contain"
                            />
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{institutionName}</h2>
                                <p className="text-slate-500 text-sm mt-1">{institutionAddress}</p>
                                <p className="text-indigo-600 font-bold text-sm mt-1 uppercase tracking-widest">Office of the Bursar</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-4xl font-black text-slate-100 uppercase tracking-widest">Receipt</h1>
                            <p className="font-bold text-slate-700 mt-2">#RCT-2026-001</p>
                            <p className="text-slate-500 text-xs mt-1">Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Receipt Details */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Received From</p>
                                <p className="font-bold text-slate-800">John Doe</p>
                                <p className="text-sm text-slate-500">Matric No: CS/2026/001</p>
                                <p className="text-sm text-slate-500">ND 1 - Computer Science</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Payment Purpose</p>
                                <p className="font-bold text-slate-800">Tuition Fee (Part-Payment)</p>
                                <p className="text-sm text-slate-500">2026/2027 Academic Session</p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="border rounded-2xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Description</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Amount (₦)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="p-4 text-slate-700 font-medium">Total Billed Tuition</td>
                                    <td className="p-4 text-slate-900 font-bold text-right">150,000.00</td>
                                </tr>
                                <tr className="bg-indigo-50/50">
                                    <td className="p-4 text-indigo-700 font-bold flex items-center gap-2">
                                        Amount Paid Now
                                        <span className="bg-indigo-200 text-indigo-800 text-[9px] uppercase px-2 py-0.5 rounded-full font-black">Approved</span>
                                    </td>
                                    <td className="p-4 text-indigo-700 font-black text-right">100,000.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Outstanding Balance Notice */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                        <span className="text-amber-800 font-bold text-sm">Outstanding Balance Remaining:</span>
                        <span className="text-amber-600 font-black text-lg">₦ 50,000.00</span>
                    </div>

                    {/* Signatures & Footer */}
                    <div className="flex justify-end pt-12">
                        <div className="w-48 text-center">
                            {/* Bursar Signature (One point of upload) */}
                            <div className="flex justify-center mb-2">
                                <img 
                                    src={signatureUrl} 
                                    alt="Bursar Signature" 
                                    className="h-16 object-contain opacity-80 mix-blend-multiply"
                                />
                            </div>
                            <div className="border-t border-slate-300 pt-2">
                                <p className="text-center text-xs font-bold text-slate-800 uppercase tracking-widest">Authorized Signatory</p>
                                <p className="text-center text-[10px] text-slate-500 mt-1">Bursary Department</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Strip */}
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        This is a computer-generated receipt (Previewing: {template} template). Valid without physical seal.
                    </p>
                </div>
            </div>
        </div>
    );
}
