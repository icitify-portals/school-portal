"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Trash2, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import Papa from "papaparse";
import { getStudents } from "@/actions/students";
import { getResultTemplateStudents, deleteStudentRm, createStudentRm, updateStudentRm } from "@/actions/result-module";

export default function ResultModuleStudentsPage() {
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: "",
        matricNumber: "",
    });
    const [downloadingList, setDownloadingList] = useState(false);

    const handleDownloadList = async () => {
        setDownloadingList(true);
        const res = await getResultTemplateStudents({});
        setDownloadingList(false);
        if (!res.success) return alert("Error: " + res.error);
        const rows = (res.data || []) as any[];
        if (!rows.length) return alert("No students found in the system.");
        const csv = Papa.unparse({
            fields: ["matric_number", "name", "programme"],
            data: rows.map(s => ({ matric_number: s.matricNumber, name: s.name, programme: s.programme })),
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "student_list.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        const data = await getStudents({ pageSize: 50 }); // Fetch first 50 or so, realistically this would be paginated or searched
        if (data.data) {
            setStudentsList(data.data);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingStudent) {
            const res = await updateStudentRm(editingStudent.id, formData);
            if (res.success) {
                setEditingStudent(null);
                fetchStudents();
            } else alert(res.error);
        } else {
            const res = await createStudentRm(formData);
            if (res.success) {
                setIsAdding(false);
                fetchStudents();
            } else alert(res.error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this student from the system?")) return;
        const res = await deleteStudentRm(id);
        if (res.success) fetchStudents();
        else alert(res.error);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-6xl w-full mx-auto space-y-6">
                <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                            <Users className="text-indigo-400" /> Result Module Students
                        </h1>
                        <p className="text-slate-400 mt-2">Manage student accounts and matriculation numbers.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleDownloadList}
                            disabled={downloadingList}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                        >
                            {downloadingList ? "Downloading..." : "Download Student List"}
                        </Button>
                        <Button 
                            onClick={() => {
                                setFormData({ name: "", matricNumber: "" });
                                setIsAdding(!isAdding);
                                setEditingStudent(null);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Student</>}
                        </Button>
                    </div>
                </div>

                {(isAdding || editingStudent) && (
                    <Card className="shadow-lg border-none">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>{editingStudent ? "Edit Student" : "New Student"}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Matriculation Number</label>
                                    <Input required value={formData.matricNumber} onChange={e => setFormData({ ...formData, matricNumber: e.target.value.toUpperCase() })} placeholder="FSS/19/CS/..." />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                    <Button type="submit" className="bg-indigo-600">Save Student</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="text-center py-10">Loading students...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {studentsList.map((student: any) => (
                            <Card key={student.id} className="shadow hover:shadow-md transition-shadow">
                                <CardContent className="p-6 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-black text-lg text-slate-800">{student.matricNumber || 'No Matric'}</h3>
                                        <p className="text-sm text-slate-600">{student.user?.name || student.name || 'Unknown'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="outline" onClick={() => {
                                            setEditingStudent(student);
                                            setFormData({ name: student.user?.name || student.name || "", matricNumber: student.matricNumber || "" });
                                            setIsAdding(false);
                                        }}>
                                            <Edit className="w-4 h-4 text-slate-600" />
                                        </Button>
                                        <Button size="icon" variant="outline" onClick={() => handleDelete(student.id)}>
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
