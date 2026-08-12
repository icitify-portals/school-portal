"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Brain, Database, FileEdit, Settings2, BarChart3, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CBTAdminGuide() {
    return (
        <div className="p-8 max-w-[1200px] w-full mx-auto space-y-8 pb-32">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Brain className="w-8 h-8 text-indigo-600" />
                    CBT Admin Guide
                </h1>
                <p className="text-slate-500 font-medium mt-2">Comprehensive workflow for setting up and managing Computer-Based Tests (CBT)</p>
            </div>

            <div className="grid gap-6">
                <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                    <div className="h-2 bg-indigo-600 w-full"></div>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                <Database className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Step 1: Question Banks (Recommended)</h2>
                                <p className="text-sm text-slate-500 font-medium">Create reusable repositories of questions.</p>
                            </div>
                        </div>
                        <div className="space-y-4 text-sm text-slate-600">
                            <p>Question banks allow you to store questions linked to specific courses, so you don't have to rewrite them for future exams.</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Navigate to <strong>Question Banks</strong></li>
                                <li>Click <strong>New Bank</strong> and fill in the details.</li>
                                <li>You can manually add questions or use the <strong>Bulk Import</strong> feature to upload a CSV/Excel file. Download the template first for the correct format.</li>
                            </ul>
                            <Link href="/admin/cbt/banks">
                                <Button className="mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700">Go to Question Banks</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                    <div className="h-2 bg-emerald-500 w-full"></div>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                <FileEdit className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Step 2: Create an Assessment</h2>
                                <p className="text-sm text-slate-500 font-medium">Build your quiz or exam.</p>
                            </div>
                        </div>
                        <div className="space-y-4 text-sm text-slate-600">
                            <p>The CBT Editor has 3 main panels:</p>
                            
                            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                <div>
                                    <strong className="text-slate-900">1. Setup Quiz:</strong> 
                                    <p>Define the title, description, and total duration (default: 60 minutes).</p>
                                </div>
                                <div>
                                    <strong className="text-slate-900">2. Add Questions:</strong> 
                                    <p>Type your question and provide 4 options (A-D). Select the correct answer. A live preview will show exactly what the student sees.</p>
                                    <div className="mt-2 flex items-center gap-2 text-xs bg-blue-50 text-blue-700 p-2 rounded-lg">
                                        <AlertCircle className="w-4 h-4" />
                                        <span><strong>LaTeX is supported:</strong> Use <code>$...$</code> for inline math (e.g. <code>$x^2$</code>) and <code>$$...$$</code> for block math. Ensure the "Enable LaTeX" checkbox is ticked.</span>
                                    </div>
                                </div>
                                <div>
                                    <strong className="text-slate-900">3. Assign Students (Access Control):</strong> 
                                    <p>If "Require Assignment" is enabled, only students added to the roster can take the exam. If disabled, anyone with the link can take it.</p>
                                </div>
                            </div>

                            <Link href="/admin/cbt/editor">
                                <Button className="mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700">Go to Assessment Editor</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
                    <div className="h-2 bg-amber-500 w-full"></div>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Step 3: Monitor & Grade Results</h2>
                                <p className="text-sm text-slate-500 font-medium">Review submissions and grade manual questions.</p>
                            </div>
                        </div>
                        <div className="space-y-4 text-sm text-slate-600">
                            <p>Once students start submitting, you can review their performance:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Navigate to <strong>Results</strong> for a specific quiz.</li>
                                <li>View overall scores, time taken, and per-question breakdowns.</li>
                                <li>For subjective (essay) questions, you will need to enter a score manually for each student.</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
