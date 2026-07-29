"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Trash2, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getCourses, createCourse, updateCourse, deleteCourse } from "@/actions/courses";

export default function ResultModuleCoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingCourse, setEditingCourse] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        creditUnits: 2,
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        const data = await getCourses();
        setCourses(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Audit log logic could be wrapped in the action or handled here
        if (editingCourse) {
            const res = await updateCourse(editingCourse.id, formData);
            if (res.success) {
                setEditingCourse(null);
                fetchCourses();
            } else alert(res.error);
        } else {
            const res = await createCourse(formData);
            if (res.success) {
                setIsAdding(false);
                fetchCourses();
            } else alert(res.error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this course?")) return;
        const res = await deleteCourse(id);
        if (res.success) fetchCourses();
        else alert(res.error);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-6xl w-full mx-auto space-y-6">
                <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                            <BookOpen className="text-indigo-400" /> Result Module Courses
                        </h1>
                        <p className="text-slate-400 mt-2">Manage courses standalone for the result module.</p>
                    </div>
                    <Button 
                        onClick={() => {
                            setFormData({ name: "", code: "", creditUnits: 2 });
                            setIsAdding(!isAdding);
                            setEditingCourse(null);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Course</>}
                    </Button>
                </div>

                {(isAdding || editingCourse) && (
                    <Card className="shadow-lg border-none">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>{editingCourse ? "Edit Course" : "New Course"}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Course Code</label>
                                    <Input required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="MAT101" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Course Name</label>
                                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Mathematics" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Credit Units</label>
                                    <Input required type="number" value={formData.creditUnits} onChange={e => setFormData({ ...formData, creditUnits: parseInt(e.target.value) })} />
                                </div>
                                <div className="md:col-span-3 flex justify-end">
                                    <Button type="submit" className="bg-indigo-600">Save Course</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="text-center py-10">Loading courses...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.map(course => (
                            <Card key={course.id} className="shadow hover:shadow-md transition-shadow">
                                <CardContent className="p-6 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-black text-lg text-slate-800">{course.code}</h3>
                                        <p className="text-sm text-slate-600">{course.name}</p>
                                        <span className="text-xs font-bold text-indigo-500">{course.creditUnits} Units</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="outline" onClick={() => {
                                            setEditingCourse(course);
                                            setFormData({ name: course.name, code: course.code, creditUnits: course.creditUnits });
                                            setIsAdding(false);
                                        }}>
                                            <Edit className="w-4 h-4 text-slate-600" />
                                        </Button>
                                        <Button size="icon" variant="outline" onClick={() => handleDelete(course.id)}>
                                            <Trash2 className="w-4 h-4 text-rose-500" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
