
import { getApplicants } from "@/actions/admin-admission";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Search, Filter, Edit2, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function AdminScreeningPage() {
    const { success, applications, error } = await getApplicants();

    if (!success || !applications) {
        return <div className="p-6">Error: {error}</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Post-UTME Screening</h1>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search candidates..."
                            className="bg-background pl-8 w-[250px]"
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Applicants List ({applications.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Candidate</TableHead>
                                <TableHead>JAMB Reg No</TableHead>
                                <TableHead>Programme</TableHead>
                                <TableHead>JAMB Score</TableHead>
                                <TableHead>Screening Score</TableHead>
                                <TableHead>Aggregate</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.map((app) => (
                                <TableRow key={app.id}>
                                    <TableCell className="font-medium">
                                        {app.candidate?.surname}, {app.candidate?.firstname}
                                    </TableCell>
                                    <TableCell>{app.jambRegNo}</TableCell>
                                    <TableCell>{app.programme?.name}</TableCell>
                                    <TableCell>{app.candidate?.score}</TableCell>
                                    <TableCell>{app.screeningScore || "—"}</TableCell>
                                    <TableCell>
                                        <span className="font-bold text-indigo-600">
                                            {app.aggregateScore ? `${app.aggregateScore}%` : "—"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            app.status === 'admitted' ? 'outline' :
                                                app.status === 'rejected' ? 'destructive' : 'secondary'
                                        } className={app.status === 'admitted' ? 'border-emerald-500 text-emerald-600' : ''}>
                                            {(app.status || 'pending').toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/admin/admission/screening/${app.id}`}>
                                            <Button size="sm" variant="ghost">
                                                <Edit2 className="h-4 w-4 mr-1" /> Score
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
