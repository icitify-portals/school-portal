"use client";

import { useState } from "react";
import { downloadTemplate, exportData, importData, ImportExportEntity } from "@/actions/import-export";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloudDownload, CloudUpload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EXPORT_MODULES: { id: ImportExportEntity; title: string; description: string; icon: any; color: string }[] = [
    {
        id: "faculties", title: "Faculties",
        description: "Bulk manage top-level academic units",
        icon: FileSpreadsheet, color: "text-blue-600 bg-blue-50"
    },
    {
        id: "departments", title: "Departments",
        description: "Bulk manage departments under faculties",
        icon: FileSpreadsheet, color: "text-indigo-600 bg-indigo-50"
    },
    {
        id: "programmes", title: "Programmes",
        description: "Upload new degree programmes and durations",
        icon: FileSpreadsheet, color: "text-purple-600 bg-purple-50"
    },
    {
        id: "courses", title: "Courses",
        description: "Course catalogue data with credit units",
        icon: FileSpreadsheet, color: "text-amber-600 bg-amber-50"
    },
    {
        id: "staff", title: "Staff Profiles",
        description: "Mass create staff user accounts and profiles",
        icon: FileSpreadsheet, color: "text-emerald-600 bg-emerald-50"
    }
];

export default function DataExportHubPage() {
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [importFiles, setImportFiles] = useState<Record<string, File | null>>({});

    const handleDownloadTemplate = async (entity: ImportExportEntity) => {
        setLoading(prev => ({ ...prev, [`${entity}_template`]: true }));
        try {
            const res = await downloadTemplate(entity);
            if (res.success && res.data) downloadBase64Xlsx(res.data, `${entity}_template.xlsx`);
            else toast.error(res.error || "Failed to generate template");
        } finally {
            setLoading(prev => ({ ...prev, [`${entity}_template`]: false }));
        }
    };

    const handleExport = async (entity: ImportExportEntity) => {
        setLoading(prev => ({ ...prev, [`${entity}_export`]: true }));
        try {
            const res = await exportData(entity);
            if (res.success && res.data) downloadBase64Xlsx(res.data, `${entity}_export.xlsx`);
            else toast.error(res.error || "Failed to export data");
        } finally {
            setLoading(prev => ({ ...prev, [`${entity}_export`]: false }));
        }
    };

    const handleFileChange = (entity: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImportFiles(prev => ({ ...prev, [entity]: e.target.files![0] }));
        }
    };

    const handleImport = async (entity: ImportExportEntity) => {
        const file = importFiles[entity];
        if (!file) return toast.error("Please select a file to import");

        setLoading(prev => ({ ...prev, [`${entity}_import`]: true }));
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = (e.target?.result as string).split(',')[1];
                if (!base64) return toast.error("Failed to read file processing");

                const res = await importData(entity, base64);
                if (res.success) {
                    toast.success(`Successfully imported ${res.inserted || 0} records.`);
                    if (res.errors && res.errors.length > 0) {
                        toast.warning(`Completed with ${res.errors.length} skipped rows. Check console for details.`);
                        console.warn("Import skips:", res.errors);
                    }
                    setImportFiles(prev => ({ ...prev, [entity]: null })); // Clear file
                } else {
                    toast.error(res.errors?.[0] || "Import completely failed.");
                }
                setLoading(prev => ({ ...prev, [`${entity}_import`]: false }));
            };
            reader.readAsDataURL(file);
        } catch (err) {
            toast.error("An unexpected error occurred reading the file.");
            setLoading(prev => ({ ...prev, [`${entity}_import`]: false }));
        }
    };

    const downloadBase64Xlsx = (base64: string, filename: string) => {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 max-w-[1600px] w-full mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900">Data Import & Export Hub</h1>
                <p className="text-sm text-slate-500 mt-1">Bulk manage system records using standardized Excel templates</p>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="all">All Modules</TabsTrigger>
                    <TabsTrigger value="academic">Academic Setup</TabsTrigger>
                    <TabsTrigger value="users">Users & Roles</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {EXPORT_MODULES.map(module => (
                        <EntityCard
                            key={module.id}
                            module={module}
                            loading={loading}
                            file={importFiles[module.id]}
                            onDownloadTemplate={() => handleDownloadTemplate(module.id)}
                            onExport={() => handleExport(module.id)}
                            onFileChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(module.id, e)}
                            onImport={() => handleImport(module.id)}
                        />
                    ))}
                </TabsContent>

                <TabsContent value="academic" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {EXPORT_MODULES.filter(m => ['faculties', 'departments', 'programmes', 'courses'].includes(m.id)).map(module => (
                        <EntityCard key={module.id} module={module} loading={loading} file={importFiles[module.id]}
                            onDownloadTemplate={() => handleDownloadTemplate(module.id)} onExport={() => handleExport(module.id)} onFileChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(module.id, e)} onImport={() => handleImport(module.id)}
                        />
                    ))}
                </TabsContent>

                <TabsContent value="users" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {EXPORT_MODULES.filter(m => m.id === 'staff').map(module => (
                        <EntityCard key={module.id} module={module} loading={loading} file={importFiles[module.id]}
                            onDownloadTemplate={() => handleDownloadTemplate(module.id)} onExport={() => handleExport(module.id)} onFileChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(module.id, e)} onImport={() => handleImport(module.id)}
                        />
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function EntityCard({ module, loading, file, onDownloadTemplate, onExport, onFileChange, onImport }: any) {
    const Icon = module.icon;
    const isTemplateLoading = loading[`${module.id}_template`];
    const isExportLoading = loading[`${module.id}_export`];
    const isImportLoading = loading[`${module.id}_import`];

    return (
        <Card className="flex flex-col h-full -200 hover: transition-all border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        <CardDescription className="mt-1">{module.description}</CardDescription>
                    </div>
                    <div className={`p-2 rounded-lg ${module.color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 pt-0 p-6">
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 text-xs h-9 gap-2" onClick={onDownloadTemplate} disabled={isTemplateLoading}>
                        {isTemplateLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />}
                        Template
                    </Button>
                    <Button variant="outline" className="flex-1 text-xs h-9 gap-2" onClick={onExport} disabled={isExportLoading}>
                        {isExportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudDownload className="w-3.5 h-3.5 text-slate-500" />}
                        Export existing
                    </Button>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Import Data</p>
                    <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={onFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isImportLoading}
                        />
                        {file ? (
                            <div className="flex flex-col items-center justify-center gap-1">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-xs font-medium text-slate-700 truncate w-full px-2">{file.name}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-1 cursor-pointer">
                                <CloudUpload className="w-5 h-5 text-slate-400" />
                                <span className="text-xs text-slate-500 font-medium">Select .xlsx file</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
            <div className="pt-0 border-t border-slate-50 mt-auto bg-slate-50/50 rounded-b-xl py-3 px-6">
                <Button
                    className="w-full text-sm font-medium gap-2 shadow-none"
                    onClick={onImport}
                    disabled={!file || isImportLoading}
                >
                    {isImportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                    {isImportLoading ? 'Processing Import...' : 'Upload & Process'}
                </Button>
            </div>
        </Card>
    );
}
