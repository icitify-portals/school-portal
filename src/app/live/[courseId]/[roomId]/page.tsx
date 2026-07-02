"use client";

import { useEffect, useState } from "react";
import LiveClassRoom from "@/components/live/LiveClassRoom";
import { joinClassSession, markLiveAttendance } from "@/actions/live-class";
import { getLiveKitCredentials } from "@/actions/system-settings";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Video } from "lucide-react";

import { use } from "react";

export default function LiveClassPage({ params }: { params: Promise<{ courseId: string; roomId: string }> }) {
    const resolvedParams = use(params);
    const [token, setToken] = useState("");
    const [roomName, setRoomName] = useState("");
    const [role, setRole] = useState<"staff" | "student">("student");
    const router = useRouter();

    const [serverUrl, setServerUrl] = useState("ws://localhost:7880");

    useEffect(() => {
        const init = async () => {
            if (!resolvedParams.courseId || !resolvedParams.roomId) return;

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

                const data = await joinClassSession(courseIdInt, roomIdInt);
                setToken(data.token);
                setRoomName(data.roomName);
                if (data.role) setRole(data.role as "staff" | "student");

                // Auto-Attendance Feature
                if (data.role === 'student') {
                    await markLiveAttendance();
                }

            } catch (error: any) {
                toast.error(error.message);
                router.back();
            }
        };
        init();
    }, [resolvedParams.courseId, resolvedParams.roomId, router]);

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)]" />
                <div className="relative z-10 w-full max-w-md p-8 border border-white/10 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 animate-pulse">
                        <Video className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-wider italic text-slate-100">Joining Live Classroom</h3>
                        <p className="text-sm text-slate-400 font-medium">Securing session connection and setting up audio/video feeds...</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/15 px-5 py-3 rounded-xl">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">Connecting...</span>
                    </div>
                </div>
            </div>
        );
    }

    const handleDisconnected = () => {
        toast.error("Disconnected from Live Class server.");
        setTimeout(() => {
            router.back();
        }, 2000);
    };

    return (
        <LiveClassRoom
            token={token}
            roomName={roomName}
            serverUrl={serverUrl}
            onDisconnected={handleDisconnected}
            role={role}
            courseId={resolvedParams.courseId}
            dbRoomId={resolvedParams.roomId}
        />
    );
}
