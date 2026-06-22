import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BookOpen, AlertCircle } from "lucide-react";

// Mock data for the courses
const availableCourses = [
    { id: "COS101", name: "Introduction to Computer Science", unit: 3, type: "Core" },
    { id: "COS102", name: "Programming in Python", unit: 3, type: "Core" },
    { id: "GST101", name: "Communication in English", unit: 2, type: "Compulsory" },
    { id: "MAT101", name: "General Mathematics I", unit: 3, type: "Core" },
    { id: "PHY101", name: "General Physics I", unit: 3, type: "Elective" },
];

export default function CourseRegistrationPage() {
    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Course Registration</h2>
                    <p className="text-slate-500 mt-2">Harmattan Semester 2025/2026 Academic Session</p>
                </div>
                <div className="text-right">
                    <Badge variant="outline" className="mb-2">Total Units Selected: 0 / 24</Badge>
                    <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 w-0 transition-all"></div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="border-blue-100 bg-blue-50/30">
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                            <div>
                                <p className="font-medium text-blue-900">Registration Instructions</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    You are expected to select a minimum of 18 units and a maximum of 24 units.
                                    Ensure all core courses are selected before submission.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-lg">Available Courses</CardTitle>
                        <CardDescription>Select the courses you wish to register for this semester.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-3 font-semibold">Select</th>
                                    <th className="px-6 py-3 font-semibold">Code</th>
                                    <th className="px-6 py-3 font-semibold">Course Title</th>
                                    <th className="px-6 py-3 font-semibold">Units</th>
                                    <th className="px-6 py-3 font-semibold">Type</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {availableCourses.map((course) => (
                                    <tr key={course.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <Checkbox id={course.id} />
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-blue-600 font-medium">{course.id}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{course.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{course.unit}</td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant={course.type === "Core" ? "default" : "secondary"}
                                                className="font-normal"
                                            >
                                                {course.type}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline">Save as Draft</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 px-8">Complete Registration</Button>
                </div>
            </div>
        </div>
    );
}
