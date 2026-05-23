import { auth } from "@/auth";
import { db } from "@/db/db";
import { students, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import BadgeGenerator from "@/components/attendance/BadgeGenerator";
import { redirect } from "next/navigation";

export default async function StudentBadgePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = parseInt(session.user.id);
    const [studentData] = await db.select({
        name: users.name,
        role: users.role,
        matricNo: students.matricNumber,
        barcode: students.barcode,
        imageUrl: students.imageUrl
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.userId, userId))
    .limit(1);

    if (!studentData) {
        return <div className="p-12 text-center font-black uppercase text-slate-400">Student Profile Not Found</div>;
    }

    const badgeData = {
        name: studentData.name,
        role: studentData.role || "student",
        id: studentData.matricNo || studentData.barcode || "N/A",
        barcode: studentData.barcode || studentData.matricNo || "000000",
        imageUrl: studentData.imageUrl || undefined
    };

    return (
        <div className="p-8 max-w-md mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-slate-900 italic uppercase">Your Digital ID</h1>
                <p className="text-slate-500 font-medium">Present this code at the gate for entry/exit</p>
            </div>
            <BadgeGenerator data={badgeData} />
        </div>
    );
}
