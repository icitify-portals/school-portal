import { getDepartments } from "@/actions/departments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";

export const metadata = {
    title: "Departments | Student Portal",
    description: "List of all departments and their courses"
};

export default async function StudentDepartmentsPage() {
    const departments = await getDepartments();

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
                <p className="text-muted-foreground mt-2">
                    Browse all academic departments and view their course offerings.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                    <Link key={dept.id} href={`/student/departments/${dept.id}`}>
                        <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-primary">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xl font-semibold">{dept.name}</CardTitle>
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="flex items-center mt-2">
                                    <span className="font-medium mr-2">Code:</span> {dept.code}
                                </CardDescription>
                                {dept.faculty && (
                                    <CardDescription className="flex items-center mt-1">
                                        <span className="font-medium mr-2">Faculty:</span> {dept.faculty.name}
                                    </CardDescription>
                                )}
                                <div className="mt-4 flex items-center text-sm text-primary font-medium">
                                    View Courses <ChevronRight className="ml-1 h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {departments.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No departments found.
                    </div>
                )}
            </div>
        </div>
    );
}
