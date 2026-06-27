import { auth } from "@/auth";
import { db } from "@/db/db";
import {
    hostels, hostelRooms, hostelBlocks, hostelApplications,
    students, users, academicSessions, hostelSettings
} from "@/db/schema";
import { eq, and, sql, or } from "drizzle-orm";
import StudentHostelPortal from "@/components/hostels/StudentHostelPortal";
import { Landmark } from "lucide-react";

export default async function StudentHostelPage() {
    const session = await auth();
    if (!session?.user) return <div>Unauthorized</div>;

    const [student] = await db.select()
        .from(students)
        .where(eq(students.userId, parseInt((session.user as any).id)))
        .limit(1);

    if (!student) return <div>Student profile not found</div>;

    const [activeSession] = await db.select()
        .from(academicSessions)
        .where(eq(academicSessions.isActive, true))
        .limit(1);

    // Fetch current application if any
    const [application] = await db.select({
        id: hostelApplications.id,
        status: hostelApplications.status,
        paymentStatus: hostelApplications.paymentStatus,
        paymentDeadline: hostelApplications.paymentDeadline,
        isPriority: hostelApplications.isPriority,
        appliedAt: hostelApplications.appliedAt,
        hostel: {
            name: hostels.name,
            code: hostels.code
        },
        room: {
            roomNumber: hostelRooms.roomNumber
        }
    })
        .from(hostelApplications)
        .innerJoin(hostels, eq(hostelApplications.hostelId, hostels.id))
        .leftJoin(hostelRooms, eq(hostelApplications.allocatedRoomId, hostelRooms.id))
        .where(and(
            eq(hostelApplications.studentId, student.id),
            eq(hostelApplications.sessionId, activeSession?.id || 0)
        ))
        .limit(1);

    // Fetch available hostels based on student gender
    const availableHostels = await db.select({
        id: hostels.id,
        name: hostels.name,
        type: hostels.type,
        capacity: hostels.capacity,
        occupiedCount: sql<number>`(SELECT SUM(occupied_count) FROM ${hostelRooms} r JOIN ${hostelBlocks} b ON r.block_id = b.id WHERE b.hostel_id = ${hostels.id})`,
    })
        .from(hostels)
        .where(and(
            eq(hostels.isActive, true),
            or(eq(hostels.type, student.gender === 'male' ? 'male' : 'female'), eq(hostels.type, 'mixed'))
        ));

    // Fetch hostel settings to get paymentMode and hostelFee
    let settings = null;
    if (application && application.hostelId) {
        const hSettings = await db.select().from(hostelSettings).where(eq(hostelSettings.hostelId, application.hostelId)).limit(1);
        if (hSettings.length > 0) {
            settings = hSettings[0];
        }
    }

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                        <Landmark className="w-10 h-10 text-indigo-600" />
                        Hostel & Housing
                    </h2>
                    <p className="text-slate-500 font-medium tracking-tight">Apply for accommodation and manage your residential status</p>
                </div>
            </div>

            <StudentHostelPortal
                availableHostels={availableHostels}
                application={application}
                studentLevel={student.currentLevel || 100}
                hostelSettings={settings}
            />
        </div>
    );
}

// Helper imports for the page logic
import { sql, or } from "drizzle-orm";
import { hostelBlocks } from "@/db/schema";
