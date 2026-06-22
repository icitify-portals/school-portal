import { getDeletedStudents, restoreStudentAction, purgeStudentAction, emptyBinAction } from "@/actions/super_admin";
import { format } from "date-fns";

export default async function RecycleBinPage() {
    const deletedStudents = await getDeletedStudents();

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header section with Glassmorphism */}
            <div className="flex justify-between items-end bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight italic uppercase">Institutional Recycle Bin</h1>
                    <p className="text-blue-200 mt-2 font-medium">Safe recovery and permanent purging of institutional records</p>
                </div>
                
                {deletedStudents.length > 0 && (
                    <form action={emptyBinAction}>
                        <button 
                            type="submit"
                            className="px-6 py-3 bg-red-500/20 hover:bg-red-500/40 text-red-100 border border-red-500/30 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 backdrop-blur-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Empty Bin
                        </button>
                    </form>
                )}
            </div>

            {/* List Section */}
            <div className="grid gap-4">
                {deletedStudents.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 p-20 rounded-2xl text-center backdrop-blur-sm">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white">The Bin is Empty</h3>
                        <p className="text-blue-200/60 mt-2">No deleted student records found.</p>
                    </div>
                ) : (
                    deletedStudents.map((student) => (
                        <div 
                            key={student.id}
                            className="group bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-2xl flex items-center justify-between transition-all hover:translate-x-1 backdrop-blur-sm"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg group-hover:rotate-6 transition-transform">
                                    {student.name?.[0]}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-white">{student.name}</h4>
                                    <div className="flex gap-4 mt-1 text-sm font-medium">
                                        <span className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-md border border-blue-400/20">{student.admissionNumber}</span>
                                        <span className="text-slate-400">{student.branch}</span>
                                        <span className="text-slate-500 italic">Deleted {format(new Date(student.deletedAt!), 'MMM dd, HH:mm')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <form action={restoreStudentAction.bind(null, student.admissionNumber)}>
                                    <button 
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg active:scale-95"
                                    >
                                        Restore
                                    </button>
                                </form>
                                <form action={purgeStudentAction.bind(null, student.admissionNumber)}>
                                    <button 
                                        className="px-5 py-2.5 bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-bold text-sm transition-all active:scale-95"
                                    >
                                        Purge
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
