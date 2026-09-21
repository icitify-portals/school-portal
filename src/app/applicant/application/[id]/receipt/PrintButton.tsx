"use client";

export default function PrintButton() {
    return (
        <div className="text-center print:hidden">
            <button
                onClick={() => window.print()}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-700"
            >
                Print Receipt
            </button>
        </div>
    );
}
