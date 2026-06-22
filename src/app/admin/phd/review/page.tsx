import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Search, UserPlus, CheckCircle, Shield, Award, Users } from "lucide-react";
import { getPhdApplicationsListAction } from "@/actions/phd-actions";

export const dynamic = "force-dynamic";

export default async function AdminPhdReviewDashboard() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const userRole = (session.user as any).role;
    if (userRole !== 'super_admin' && userRole !== 'admin' && userRole !== 'staff') {
        redirect("/");
    }

    const response = await getPhdApplicationsListAction();
    const applications = response.success ? response.data : [];

    const stats = {
        total: applications?.length || 0,
        underReview: applications?.filter(a => a.status === 'under_review').length || 0,
        pendingSupervisors: applications?.filter(a => a.status === 'applied').length || 0,
        completed: applications?.filter(a => a.status === 'completed').length || 0,
    };

    return (
        <div className="p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen text-slate-800">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 rounded-xl text-indigo-600">
                        <Award className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Postgraduate School</h1>
                        <p className="text-sm font-medium text-slate-500">Manage PhD applications, theses, and defenses</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Applications", value: stats.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Pending Supervisors", value: stats.pendingSupervisors, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Theses Under Review", value: stats.underReview, icon: Search, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Graduated", value: stats.completed, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map((stat, i) => (
                    <Card key={i} className="border border-slate-100 shadow-sm">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className={`p-4 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Applications List */}
            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Candidate Registry</CardTitle>
                        <Button variant="outline" size="sm" className="bg-white">Filter</Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Candidate</th>
                                    <th className="px-6 py-4 font-bold">Research Title</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold">Submitted Date</th>
                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {applications && applications.length > 0 ? (
                                    applications.map((app: any) => (
                                        <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{app.studentName}</div>
                                                <div className="text-xs text-slate-500">ID: #{app.studentId}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs truncate font-medium text-slate-700" title={app.researchTitle}>
                                                    {app.researchTitle}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="capitalize">
                                                    {app.status?.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="sm" variant="ghost" className="text-indigo-600 font-semibold hover:text-indigo-800 hover:bg-indigo-50">
                                                    Manage
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            <Shield className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                            <p className="font-medium">No PhD applications found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
