import { getCourses } from "@/actions/courses";
import { getDepartments } from "@/actions/departments";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Department Courses | Student Portal",
    description: "View courses for the selected department"
};

export default async function StudentDepartmentCoursesPage({ params }: { params: { id: string } }) {
    const departmentId = parseInt(params.id);
    
    const [allCourses, allDepartments] = await Promise.all([
        getCourses(),
        getDepartments()
    ]);

    const department = allDepartments.find(d => d.id === departmentId);

    if (!department) {
        return (
            <div className="container mx-auto py-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Department Not Found</h1>
                <Link href="/student/departments">
                    <Button variant="outline"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Departments</Button>
                </Link>
            </div>
        );
    }

    // Filter courses that belong to this department
    const deptCourses = allCourses.filter(c => 
        c.departmentSettings?.some((s: any) => s.deptId === departmentId)
    ).map(c => {
        const setting = c.departmentSettings?.find((s: any) => s.deptId === departmentId);
        return {
            ...c,
            semester: setting?.semester,
            level: setting?.level,
            status: setting?.status
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
        // Basic sort by level then semester based on string matching
        const levelA = parseInt(a.match(/Level (\d+)/)?.[1] || '0');
        const levelB = parseInt(b.match(/Level (\d+)/)?.[1] || '0');
        if (levelA !== levelB) return levelA - levelB;
        
        const semA = parseInt(a.match(/Semester (\d+)/)?.[1] || '0');
        const semB = parseInt(b.match(/Semester (\d+)/)?.[1] || '0');
        return semA - semB;
    });

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Link href="/student/departments">
                    <Button variant="ghost" size="sm" className="mb-2 -ml-3">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Departments
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">{department.name}</h1>
                <p className="text-muted-foreground mt-1">Courses and curriculum</p>
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
                                            <TableHead className="w-[150px]">Code</TableHead>
                                            <TableHead>Course Title</TableHead>
                                            <TableHead className="w-[100px] text-center">Units</TableHead>
                                            <TableHead className="w-[150px]">Status</TableHead>
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
