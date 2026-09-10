"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Trash2, Edit, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getCourses, createCourse, updateCourse, deleteCourse } from "@/actions/courses";
import { getDepartmentsList, getProgrammesList } from "@/actions/result-module";

export default function ResultModuleCoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingCourse, setEditingCourse] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("");
    const [programmeFilter, setProgrammeFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(12);
    const [departments, setDepartments] = useState<any[]>([]);
    const [programmes, setProgrammes] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        creditUnits: 2,
    });

    useEffect(() => {
        fetchCourses();
        getDepartmentsList().then((r:any) => r.success && setDepartments(r.data||[]));
        getProgrammesList().then((r:any) => r.success && setProgrammes(r.data||[]));
    }, []);

    useEffect(() => {
        let f = [...courses];
        if (search) {
            const q = search.toLowerCase();
            f = f.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
        }
        if (deptFilter) {
            f = f.filter(c => c.departmentSettings?.some((s:any) => String(s.deptId) === String(deptFilter)));
        }
        if (programmeFilter) {
            // programme filter not directly on course, show all for now
        }
        setFiltered(f);
        setCurrentPage(1);
    }, [courses, search, deptFilter, programmeFilter]);

    const fetchCourses = async () => {
        setLoading(true);
        const data = await getCourses();
        setCourses(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCourse) {
            const res = await updateCourse(editingCourse.id, formData);
            if (res.success) { setEditingCourse(null); fetchCourses(); } else alert(res.error);
        } else {
            const res = await createCourse(formData);
            if (res.success) { setIsAdding(false); fetchCourses(); } else alert(res.error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this course?")) return;
        const res = await deleteCourse(id);
        if (res.success) fetchCourses(); else alert(res.error);
    };

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((currentPage-1)*pageSize, currentPage*pageSize);

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
                    <Button onClick={() => { setFormData({ name: "", code: "", creditUnits: 2 }); setIsAdding(!isAdding); setEditingCourse(null); }} className="bg-indigo-600 hover:bg-indigo-700">
                        {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Course</>}
                    </Button>
                </div>

                <Card className="border-slate-200">
                    <CardContent className="p-4 flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="Search code or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                        </div>
                        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white">
                            <option value="">All Departments</option>
                            {departments.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select value={programmeFilter} onChange={(e) => setProgrammeFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white">
                            <option value="">All Programmes</option>
                            {programmes.map((p:any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <span className="text-xs font-bold text-slate-500 flex items-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">{filtered.length} courses</span>
                    </CardContent>
                </Card>

                {(isAdding || editingCourse) && (
                    <Card className="shadow-lg border-none">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>{editingCourse ? "Edit Course" : "New Course"}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Course Code</label><Input required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="MAT101" /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Course Name</label><Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Mathematics" /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Credit Units</label><Input required type="number" value={formData.creditUnits} onChange={e => setFormData({ ...formData, creditUnits: parseInt(e.target.value) })} /></div>
                                <div className="md:col-span-3 flex justify-end"><Button type="submit" className="bg-indigo-600">Save Course</Button></div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="text-center py-10">Loading courses...</div>
                ) : (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginated.map(course => (
                            <Card key={course.id} className="shadow hover:shadow-md transition-shadow">
                                <CardContent className="p-6 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-black text-lg text-slate-800">{course.code}</h3>
                                        <p className="text-sm text-slate-600">{course.name}</p>
                                        <span className="text-xs font-bold text-indigo-500">{course.creditUnits} Units</span>
                                        {course.departmentSettings?.length > 0 && <p className="text-xs text-slate-400 mt-1">{course.departmentSettings.map((s:any)=>s.department?.code).join(", ")}</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="outline" onClick={() => { setEditingCourse(course); setFormData({ name: course.name, code: course.code, creditUnits: course.creditUnits }); setIsAdding(false); }}>
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
                    <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-2xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-600">Page {currentPage} of {totalPages} — {filtered.length} total</span>
                        <div className="flex gap-2">
                            <Button variant="outline" disabled={currentPage===1} onClick={() => setCurrentPage(p=>Math.max(1,p-1))}>Prev</Button>
                            <Button variant="outline" disabled={currentPage===totalPages} onClick={() => setCurrentPage(p=>Math.min(totalPages,p+1))}>Next</Button>
                        </div>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}
