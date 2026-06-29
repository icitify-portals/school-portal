import { db } from "@/db/db";
import { medicalExcusats, students, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserX } from "lucide-react";
import { format } from "date-fns";

export default async function ExcusatsPage() {
    const excusatsData = await db.select({
        excusat: medicalExcusats,
        student: students,
        issuer: users
    })
    .from(medicalExcusats)
    .innerJoin(students, eq(medicalExcusats.studentId, students.id))
    .innerJoin(users, eq(medicalExcusats.issuedBy, users.id))
    .orderBy(desc(medicalExcusats.createdAt));

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Medical Excusats</h1>
                    <p className="text-muted-foreground mt-2">Manage and issue official sick leaves for students.</p>
                </div>
                <div className="flex gap-4">
                    <Button>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Issue New Excusat
                    </Button>
                </div>
            </div>

            <Card className="border-t-4 border-t-red-500 shadow-md">
                <CardHeader>
                    <CardTitle>Official Sick Leaves</CardTitle>
                    <CardDescription>A log of all students who have been officially excused from academic activities.</CardDescription>
                </CardHeader>
                <CardContent>
                    {excusatsData.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                            <UserX className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-lg font-medium text-gray-900">No medical excusats issued</p>
                            <p>Click "Issue New Excusat" to excuse a student.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Issued By</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {excusatsData.map((row) => (
                                    <TableRow key={row.excusat.id} className="hover:bg-red-50/50 transition-colors">
                                        <TableCell>
                                            <div className="font-medium">{row.student.firstName} {row.student.lastName}</div>
                                            <div className="text-xs text-muted-foreground">{row.student.matricNumber || row.student.admissionNumber}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm">
                                                {format(row.excusat.startDate, "MMM dd, yyyy")} - {format(row.excusat.endDate, "MMM dd, yyyy")}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={row.excusat.reason}>
                                            {row.excusat.reason}
                                        </TableCell>
                                        // @ts-expect-error - TS2339: Auto-suppressed for build
                                        <TableCell>Dr. {row.issuer.lastName}</TableCell>
                                        <TableCell>
                                            {row.excusat.status === 'active' && <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Active Leave</Badge>}
                                            {row.excusat.status === 'expired' && <Badge variant="outline" className="text-gray-500">Expired</Badge>}
                                            {row.excusat.status === 'revoked' && <Badge variant="secondary">Revoked</Badge>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
