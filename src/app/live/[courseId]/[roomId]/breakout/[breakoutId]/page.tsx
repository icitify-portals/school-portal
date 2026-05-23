"use client";

import { useEffect, useState } from "react";
import LiveClassRoom from "@/components/live/LiveClassRoom";
import { getBreakoutToken } from "@/actions/live-class";
import { getLiveKitCredentials } from "@/actions/system-settings";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
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

    if (!token) return <div className="flex items-center justify-center h-screen">Joining breakout room...</div>;

    const handleDisconnected = () => {
        toast.info("Left breakout room.");
        router.push(`/live/${resolvedParams.courseId}/${resolvedParams.roomId}`);
    };

    return (
        <div className="relative h-screen flex flex-col">
            <div className="bg-indigo-900 text-white px-4 py-2 flex justify-between items-center text-sm shrink-0">
                <div className="font-semibold">Breakout Room: {resolvedParams.breakoutId}</div>
                <button
                    onClick={handleDisconnected}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors text-xs"
                >
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
