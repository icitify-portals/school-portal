"use client";

import { useEffect, useState } from "react";
import LiveClassRoom from "@/components/live/LiveClassRoom";
import { joinClassSession, markLiveAttendance } from "@/actions/live-class";
import { getLiveKitCredentials } from "@/actions/system-settings";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

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

    if (!token) return <div className="flex items-center justify-center h-screen">Joining class...</div>;

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
