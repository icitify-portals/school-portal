import Link from "next/link";
import { GraduationCap, Calendar, BookOpen, Layers, Settings, ListChecks, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AcademicsGuidePage() {
    return (
        <div className="min-h-screen bg-slate-50 pt-12 pb-20 selection:bg-indigo-500/30">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="bg-slate-950 p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <GraduationCap className="w-48 h-48 text-indigo-300" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 relative z-10">
                            Academic Module Guide
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-2xl relative z-10">
                            A comprehensive manual for managing faculties, departments, courses, curriculums, timetables, and academic calendars.
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* Notice */}
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 flex gap-4">
                            <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                            <div>
                                <h3 className="font-bold text-amber-900 mb-1">Hierarchy & Dependencies</h3>
                                <p className="text-amber-800/80 font-medium text-sm leading-relaxed">
                                    The academic structure relies on a strict hierarchy: Faculties contain Departments, Departments contain Programmes, and Programmes map directly to Curriculums. Ensure you create higher-level structures before attempting to map curriculums.
                                </p>
                            </div>
                        </div>

                        {/* Step 1 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">1</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Creating the Institutional Structure</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Define the core academic hierarchy of your institution. This must be done at the very beginning of the setup phase.
                                </p>
                                <div className="grid md:grid-cols-2 gap-4 mt-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <BookOpen className="w-6 h-6 text-indigo-500 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 mb-1">Faculties & Departments</h4>
                                        <p className="text-xs text-slate-500">Navigate to <strong>Faculties</strong> to create parent containers, then to <strong>Departments</strong> to assign child departments to those faculties.</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <Layers className="w-6 h-6 text-emerald-500 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 mb-1">Programmes</h4>
                                        <p className="text-xs text-slate-500">Navigate to <strong>Programmes</strong> to create specific degree offerings (e.g. B.Sc. Computer Science) and map them to their parent department.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">2</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Courses & Curriculum Mapping</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    After establishing the programmes, you must define the courses that students will take and assign them to specific levels and semesters.
                                </p>
                                <ul className="list-disc list-inside text-sm font-medium text-slate-600 mb-6 space-y-2">
                                    <li>Navigate to <strong>Create Course</strong> to add global courses to the institutional repository (e.g. CSC101, MTH101).</li>
                                    <li>Navigate to <strong>Curriculum Mapping</strong>.</li>
                                    <li>Select a Programme, Level (e.g. 100 Level), and Semester.</li>
                                    <li>Add courses from the repository and designate them as either <strong>Core (Mandatory)</strong> or <strong>Elective</strong>.</li>
                                </ul>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                    <ListChecks className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-slate-600">This mapping dictates exactly what courses a student sees when they attempt to register for courses in their portal.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">3</div>
                                <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                            </div>
                            <div className="pb-8">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Academic Calendar & Scheduling</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Manage the overarching timelines that govern the entire institution.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-slate-600"><strong>Academic Calendar:</strong> Set the active Academic Session (e.g., 2026/2027) and Semester (First/Second). This globally switches the portal context for all students and staff.</p>
                                    </div>
                                    <div className="flex items-start gap-3 mt-2">
                                        <Calendar className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-slate-600"><strong>Timetable:</strong> Use the timetable module to schedule lectures and exams, ensuring there are no clashes in physical venues or lecturer availability.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">4</div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Registration & Institutional Controls</h2>
                                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                    Set access boundaries and operational rules for the academic session.
                                </p>
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                                    <Settings className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-emerald-800">
                                        Navigate to <strong>Registration Controls</strong> to toggle when students are allowed to register for courses, apply for late registration, or add/drop courses. You can also define the maximum and minimum credit load allowable per semester.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
