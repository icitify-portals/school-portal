import { getDepartmentDetails } from "@/actions/departments";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Department Curriculum | Staff Portal",
    description: "View courses for the selected department"
};

export default async function StaffDepartmentCoursesPage({ params }: { params: { id: string } }) {
    const departmentId = parseInt(params.id);
    const data = await getDepartmentDetails(departmentId);

    if (!data || !data.department) {
        return (
            <div className="container mx-auto py-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Department Not Found</h1>
                <Link href="/staff/departments">
                    <Button variant="outline"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Departments</Button>
                </Link>
            </div>
        );
    }

    const { department, courses } = data;

    // Filter and map courses
    const deptCourses = courses.map(c => {
        return {
            ...c,
            semester: c.settings?.semester,
            level: c.settings?.level,
            status: c.settings?.status
        };
    });

    // Group by Level and Semester
    const groupedCourses: Record<string, typeof deptCourses> = {};
    
    deptCourses.forEach(course => {
        const level = course.level || 'Unknown Level';
        const semester = course.semester || 'Unknown Semester';
        const key = `Level ${level} - Semester ${semester}`;
        
        if (!groupedCourses[key]) {
            groupedCourses[key] = [];
        }
        groupedCourses[key].push(course);
    });

    const sortedKeys = Object.keys(groupedCourses).sort((a, b) => {
        const levelA = parseInt(a.match(/Level (\d+)/)?.[1] || '0');
        const levelB = parseInt(b.match(/Level (\d+)/)?.[1] || '0');
        if (levelA !== levelB) return levelA - levelB;
        
        const semA = parseInt(a.match(/Semester (\d+)/)?.[1] || '0');
        const semB = parseInt(b.match(/Semester (\d+)/)?.[1] || '0');
        return semA - semB;
    });

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link href="/staff/departments">
                        <Button variant="ghost" size="sm" className="mb-2 -ml-3">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Departments
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">{department.name} Curriculum</h1>
                    <p className="text-muted-foreground mt-1">Detailed view of all courses offered</p>
                </div>
            </div>

            {deptCourses.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No courses found for this department.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {sortedKeys.map(key => (
                        <Card key={key}>
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-xl">{key}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[120px]">Code</TableHead>
                                            <TableHead>Course Title</TableHead>
                                            <TableHead className="w-[80px] text-center">Units</TableHead>
                                            <TableHead className="w-[120px]">Status</TableHead>
                                            <TableHead className="w-[200px]">Lecturers</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupedCourses[key].map(course => (
                                            <TableRow key={course.id}>
                                                <TableCell className="font-medium">{course.code}</TableCell>
                                                <TableCell>{course.name}</TableCell>
                                                <TableCell className="text-center">{course.creditUnits}</TableCell>
                                                <TableCell>
                                                    <Badge variant={course.status === 'compulsory' ? 'default' : 'secondary'}>
                                                        {course.status ? course.status.toUpperCase() : 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {course.lecturers && course.lecturers.length > 0 ? (
                                                        <div className="flex flex-col gap-1">
                                                            {course.lecturers.map((lecturer: any, idx: number) => (
                                                                <div key={idx} className="flex items-center text-sm text-muted-foreground">
                                                                    <UserCircle2 className="w-3 h-3 mr-1" />
                                                                    {lecturer.title} {lecturer.lastName} {lecturer.firstName}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
