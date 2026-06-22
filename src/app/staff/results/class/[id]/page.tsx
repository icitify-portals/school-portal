"use client";

import { useParams, useSearchParams } from "next/navigation";
import ClassPerformanceEntry from "@/components/lms/ClassPerformanceEntry";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getStaffProfileByUserId } from "@/actions/hr_leave";
import { Loader2 } from "lucide-react";

export default function ClassEntryPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const [staffId, setStaffId] = useState<number | null>(null);

    const groupId = parseInt(params.id as string);
    const term = (searchParams.get("term") as '1' | '2' | '3') || '1';
    const sessionId = parseInt(searchParams.get("sessionId") || "0");

    useEffect(() => {
        if (session?.user?.id) {
            getStaffProfileByUserId(parseInt(session.user.id)).then(p => {
                if (p) setStaffId(p.id);
            });
        }
    }, [session]);

    if (!staffId || !sessionId) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto">
            <ClassPerformanceEntry 
                groupId={groupId}
                sessionId={sessionId}
                term={term}
                staffId={staffId}
            />
        </div>
    );
}
