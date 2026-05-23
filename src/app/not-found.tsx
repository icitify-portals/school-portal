import Link from "next/link";
import { MessageSquare, Home, ChevronLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative">
                    <div className="text-[150px] font-black text-slate-100 leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-indigo-600 rounded-3xl rotate-12 flex items-center justify-center shadow-xl shadow-indigo-200">
                            <MessageSquare className="w-12 h-12 text-white -rotate-12" />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Location Not Found</h1>
                    <p className="text-slate-500 font-medium">
                        The page you are looking for doesn't exist or has been moved to another wing of the portal.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href="/"
                        className="flex-1 bg-white border-2 border-slate-200 text-slate-700 font-black uppercase text-xs tracking-widest px-8 py-4 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Go Back
                    </Link>
                    <Link
                        href="/"
                        className="flex-1 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest px-8 py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                        <Home className="w-4 h-4" />
                        Dashboard
                    </Link>
                </div>

                <div className="pt-8 border-t border-slate-200 flex items-center justify-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Portal System v2.0</span>
                </div>
            </div>
        </div>
    );
}
