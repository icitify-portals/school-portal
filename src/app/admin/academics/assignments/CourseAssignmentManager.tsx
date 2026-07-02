"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    assignCourseToLecturer,
    getCourseAssignments,
    getDepartmentStaff,
    removeLecturerFromCourse,
    getDepartmentCourses
} from "@/actions/timetable";
import { AssignmentForm } from "../timetable/AssignmentForm"; // Reuse the form
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function CourseAssignmentManager({
    session,
    departments,
    allCourses: initialCourses, // Rename to avoid confusion, though we'll fetch specific ones
    initialDeptId,
    initialStaff,
    initialAssignments,
    userRole,
    isHOD
}: any) {
    const isEditor = userRole === 'admin' || isHOD;

    const [deptId, setDeptId] = useState(initialDeptId?.toString() || "");
    const [staff, setStaff] = useState(initialStaff);
    const [assignments, setAssignments] = useState(initialAssignments);
    const [deptCourses, setDeptCourses] = useState<any[]>([]); // Store department-specific courses
    const [isLoading, setIsLoading] = useState(false);

    // --- Search & Filter State ---
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned' | 'co_lecturer'>('all');
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [filterSemester, setFilterSemester] = useState<string>("all");

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        if (deptId) {
            loadDeptData();
        }
    }, [deptId]);

    async function loadDeptData() {
        setIsLoading(true);
        try {
            const [staffData, assignmentData, courseData] = await Promise.all([
                getDepartmentStaff(parseInt(deptId)),
                getCourseAssignments(parseInt(deptId), session.id, session.currentSemester === '1' ? '1' : '2'),
                getDepartmentCourses(parseInt(deptId))
            ]);
            setStaff(staffData);
            setAssignments(assignmentData);
            setDeptCourses(courseData);
        } catch (error) {
            toast.error("Failed to load department data");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAssignment(courseId: number, staffId: string, role: 'main' | 'co_lecturer') {
        if (!staffId) return;
        const res = await assignCourseToLecturer({
            sessionId: session.id,
            courseId,
            staffId: parseInt(staffId),
            deptId: parseInt(deptId),
            semester: session.currentSemester === '1' ? '1' : '2',
            role
        });

        if (res.success) {
            toast.success("Lecturer assigned successfully");
            loadDeptData(); // Refresh to update assignments
        } else {
            toast.error(res.error || "Failed to assign lecturer");
        }
    }

    async function handleRemoveAssignment(assignmentId: number) {
        if (!confirm("Are you sure you want to remove this lecturer?")) return;
        const res = await removeLecturerFromCourse(assignmentId);
        if (res.success) {
            toast.success("Lecturer removed");
            loadDeptData();
        } else {
            toast.error(res.error || "Failed to remove lecturer");
        }
    }

    // --- Filter Logic ---
    // Use deptCourses if available (filtered by department), otherwise fallback to empty or initial (though logic dictates we wait for selection)
    const coursesToDisplay = deptId ? deptCourses : [];

    const filteredCourses = coursesToDisplay.filter((course: any) => {
        const matchesSearch = course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.name.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        // Level Filter (check settings)
        if (filterLevel !== 'all' && course.settings?.level.toString() !== filterLevel) return false;

        // Semester Filter (check settings)
        if (filterSemester !== 'all' && course.settings?.semester !== filterSemester) return false;

        const courseAssignments = assignments.filter((a: any) => a.courseId === course.id);

        if (filterStatus === 'assigned') return courseAssignments.length > 0;
        if (filterStatus === 'unassigned') return courseAssignments.length === 0;
        if (filterStatus === 'co_lecturer') return courseAssignments.some((a: any) => a.role === 'co_lecturer');

        return true;
    });

    // --- Pagination Logic ---
    const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
    const paginatedCourses = filteredCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-8 pb-20">
            <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50 border-b">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Configuration</CardTitle>
                        <Badge variant="outline" className="bg-white">{session.name} - Semester {session.currentSemester}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</label>
                            <Select
                                value={deptId}
                                onValueChange={setDeptId}
                                disabled={userRole === 'staff'}
                            >
                                <SelectTrigger className="rounded-xl border-slate-200 h-11">
                                    <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {departments.map((d: any) => (
                                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {deptId && (
                <Card className="h-full flex flex-col border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="space-y-4 bg-slate-50/50 border-b border-slate-100 p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg">Course Assignments</CardTitle>
                                <p className="text-xs text-slate-500">Manage course lecturers and roles</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <Input
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="h-9 text-xs bg-slate-50 border-slate-200"
                            />
                            <Select
                                value={filterLevel}
                                onValueChange={(val: any) => { setFilterLevel(val); setCurrentPage(1); }}
                            >
                                <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="All Levels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Levels</SelectItem>
                                    <SelectItem value="100">100 Level</SelectItem>
                                    <SelectItem value="200">200 Level</SelectItem>
                                    <SelectItem value="300">300 Level</SelectItem>
                                    <SelectItem value="400">400 Level</SelectItem>
                                    <SelectItem value="500">500 Level</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filterSemester}
                                onValueChange={(val: any) => { setFilterSemester(val); setCurrentPage(1); }}
                            >
                                <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="All Semesters" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Semesters</SelectItem>
                                    <SelectItem value="1">1st Semester</SelectItem>
                                    <SelectItem value="2">2nd Semester</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filterStatus}
                                onValueChange={(val: any) => { setFilterStatus(val); setCurrentPage(1); }}
                            >
                                <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="assigned">Assigned</SelectItem>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    <SelectItem value="co_lecturer">Has Co-Lecturer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 overflow-y-auto pr-2 min-h-[400px] p-6">
                        {paginatedCourses.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs italic">
                                No courses found
                            </div>
                        ) : (
                            paginatedCourses.map((course: any) => {
                                // Filter assignments for this course
                                const courseAssignments = assignments.filter((a: any) => a.courseId === course.id);

                                return (
                                    <div key={course.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{course.code}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{course.name}</p>
                                                <Badge variant="secondary" className="mt-1 text-[10px] h-5 px-2 bg-slate-200 text-slate-600 border-none">{course.creditUnits} Units</Badge>
                                            </div>
                                            {isEditor && (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-indigo-600 hover:text-indigo-700 bg-indigo-50"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="bg-white rounded-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Assign Lecturer</DialogTitle>
                                                            <DialogDescription>Add a lecturer to {course.code}</DialogDescription>
                                                        </DialogHeader>
                                                        <AssignmentForm
                                                            course={course}
                                                            staff={staff}
                                                            deptId={deptId}
                                                            session={session}
                                                            onAssign={handleAssignment}
                                                        />
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            {courseAssignments.length === 0 ? (
                                                <div className="text-[10px] text-slate-400 italic text-center py-2">No lecturers assigned</div>
                                            ) : (
                                                courseAssignments.map((assignment: any) => (
                                                    <div key={assignment.id} className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                                {assignment.staff?.user?.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-bold text-slate-700 leading-none">{assignment.staff?.user?.name}</p>
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <Badge className={cn(
                                                                        "text-[8px] h-3 px-1 border-none",
                                                                        assignment.role === 'main' ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                                                                    )}>
                                                                        {assignment.role === 'main' ? 'MAIN' : 'CO'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isEditor && (
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                                    onClick={() => handleRemoveAssignment(assignment.id)}
                                                                    title="Remove Lecturer"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 text-xs"
                            >
                                Prev
                            </Button>
                            <span className="text-[10px] font-bold text-slate-400">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 text-xs"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
