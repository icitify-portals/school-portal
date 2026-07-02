"use client";

import { useEffect, useState } from "react";
import LiveClassRoom from "@/components/live/LiveClassRoom";
import { getBreakoutToken } from "@/actions/live-class";
import { getLiveKitCredentials } from "@/actions/system-settings";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Video, LogOut } from "lucide-react";
import { use } from "react";

export default function BreakoutRoomPage({ params }: { params: Promise<{ courseId: string; roomId: string; breakoutId: string }> }) {
    const resolvedParams = use(params);
    const [token, setToken] = useState("");
    const [roomName, setRoomName] = useState("");
    const [role, setRole] = useState<"staff" | "student">("student");
    const router = useRouter();

    const [serverUrl, setServerUrl] = useState("ws://localhost:7880");

    useEffect(() => {
        const init = async () => {
            if (!resolvedParams.courseId || !resolvedParams.roomId || !resolvedParams.breakoutId) return;

            const courseIdInt = parseInt(resolvedParams.courseId as string);
            const roomIdInt = parseInt(resolvedParams.roomId as string);

            if (Number.isNaN(courseIdInt) || Number.isNaN(roomIdInt)) {
                toast.error("Invalid class session link");
                router.back();
                return;
            }

            try {
                const creds = await getLiveKitCredentials();
                setServerUrl(creds.url);

                const data = await getBreakoutToken(roomIdInt, resolvedParams.breakoutId);
                setToken(data.token);
                setRoomName(data.roomName);
                if (data.role) setRole(data.role as "staff" | "student");

            } catch (error: any) {
                toast.error(error.message);
                router.back();
            }
        };
        init();
    }, [resolvedParams.courseId, resolvedParams.roomId, resolvedParams.breakoutId, router]);

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)]" />
                <div className="relative z-10 w-full max-w-md p-8 border border-white/10 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 animate-pulse">
                        <Video className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-wider italic text-slate-100">Joining Breakout Room</h3>
                        <p className="text-sm text-slate-400 font-medium">Connecting to sub-session workspace: {resolvedParams.breakoutId}...</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/15 px-5 py-3 rounded-xl">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">Redirecting...</span>
                    </div>
                </div>
            </div>
        );
    }

    const handleDisconnected = () => {
        toast.info("Left breakout room.");
        router.push(`/live/${resolvedParams.courseId}/${resolvedParams.roomId}`);
    };

    return (
        <div className="relative h-screen flex flex-col bg-slate-950">
            <div className="bg-slate-900 border-b border-white/10 px-6 py-4 flex justify-between items-center text-sm shrink-0 z-20 relative">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-black text-white uppercase tracking-wider text-xs">Breakout Session:</span>
                    <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold font-mono">
                        {resolvedParams.breakoutId}
                    </span>
                </div>
                <button
                    onClick={handleDisconnected}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-md shadow-rose-900/20"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    Return to Main Class
                </button>
            </div>
            <div className="flex-1 relative">
                <LiveClassRoom
                    token={token}
                    roomName={roomName}
                    serverUrl={serverUrl}
                    onDisconnected={handleDisconnected}
                    role={role}
                    courseId={resolvedParams.courseId}
                    dbRoomId={resolvedParams.roomId}
                />
            </div>
        </div>
    );
}
