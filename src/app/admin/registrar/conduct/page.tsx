import { db } from "@/db/db";
import { conductLogs, students, staffProfiles, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus, FileText, UserCog, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConductPage() {
    // SECURITY FIX: Server-side auth guard — defense-in-depth beyond middleware
    const session = await auth();
    const role = (session?.user as any)?.role?.toLowerCase();
    const allowed = ["admin", "superadmin", "registrar", "dvc"];
    if (!session?.user || !allowed.includes(role)) {
        redirect("/");
    }

    // Fetch logs with left joins because it can be student or staff
    const logs = await db.select({
        id: conductLogs.id,
        targetType: conductLogs.targetType,
        infraction: conductLogs.infraction,
        dateOfIncident: conductLogs.dateOfIncident,
        senateSanction: conductLogs.senateSanction,
        status: conductLogs.status,
        studentMatricNo: students.matricNumber,
        staffId: staffProfiles.staffId,
        studentUserId: students.userId,
        staffUserId: staffProfiles.userId,
    })
    .from(conductLogs)
    .leftJoin(students, eq(conductLogs.studentId, students.id))
    .leftJoin(staffProfiles, eq(conductLogs.staffId, staffProfiles.id))
    .orderBy(desc(conductLogs.createdAt));

    // Resolve names manually or via an additional query, or just join the users table twice via aliases
    // For simplicity, we can fetch all users and map them here, or use aliased joins
    const allUsers = await db.select({ id: users.id, name: users.name, matricNo: users.schoolPortalId }).from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    const formattedLogs = logs.map(log => {
        let name = "Unknown";
        let identifier = "";

        if (log.targetType === 'student' && log.studentUserId) {
            const u = userMap.get(log.studentUserId);
            name = u?.name || "Unknown";
            identifier = log.studentMatricNo || u?.matricNo || "N/A";
        } else if (log.targetType === 'staff' && log.staffUserId) {
            const u = userMap.get(log.staffUserId);
            name = u?.name || "Unknown";
            identifier = log.staffId || "N/A";
        }

        return {
            ...log,
            name,
            identifier,
        };
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                        Senate & Conduct Affairs
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Log disciplinary infractions and manage sanctions for staff and students.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/registrar/conduct/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Log Infraction
                    </Link>
                </Button>
            </div>

            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle>Disciplinary Logs</CardTitle>
                </CardHeader>
                <CardContent className=" p-6">
                    {formattedLogs.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <p>No disciplinary logs found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 uppercase font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Offender</th>
                                        <th className="px-4 py-3">Infraction</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Sanction</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {formattedLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                {log.targetType === 'staff' ? (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        <UserCog className="w-3 h-3 mr-1" />
                                                        Staff
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                        <GraduationCap className="w-3 h-3 mr-1" />
                                                        Student
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">{log.name}</div>
                                                <div className="text-slate-500 text-xs">{log.identifier}</div>
                                            </td>
                                            <td className="px-4 py-3">{log.infraction}</td>
                                            <td className="px-4 py-3">{new Date(log.dateOfIncident).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={log.senateSanction === 'none' ? 'outline' : 'destructive'}>
                                                    {log.senateSanction}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={log.status === 'active' ? 'default' : 'secondary'}>
                                                    {log.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
