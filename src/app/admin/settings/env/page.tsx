"use client";

import { useEffect, useState } from "react";
import { getEnvVariables, saveEnvVariables, EnvVar } from "@/actions/env";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Save, Plus, Trash2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function EnvConfigPage() {
    const [variables, setVariables] = useState<EnvVar[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadVariables();
    }, []);

    const loadVariables = async () => {
        setLoading(true);
        try {
            const res = await getEnvVariables();
            if (res.success && res.data) {
                setVariables(res.data);
            } else {
                toast.error(res.error || "Failed to load environment configuration");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Filter out empty keys
            const validVars = variables.filter(v => !!v.key.trim());
            const res = await saveEnvVariables(validVars);
            
            if (res.success) {
                toast.success("Environment configuration saved successfully!");
                // Force reload to mirror server state
                await loadVariables();
            } else {
                toast.error(res.error || "Failed to save configuration");
            }
        } catch (error) {
            toast.error("An unexpected error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddRow = () => {
        setVariables([...variables, { key: "", value: "", isSecret: false }]);
    };

    const handleRemoveRow = (index: number) => {
        const newVars = [...variables];
        newVars.splice(index, 1);
        setVariables(newVars);
    };

    const handleChange = (index: number, field: keyof EnvVar, val: string) => {
        const newVars = [...variables];
        newVars[index] = { ...newVars[index], [field]: val };
        
        // Auto-detect secret logic if changing key name
        if (field === 'key') {
             const lk = val.toLowerCase();
             newVars[index].isSecret = lk.includes('secret') || lk.includes('password') || lk.includes('key') || lk.includes('token');
        }

        setVariables(newVars);
    };

    const toggleVisibility = (index: number) => {
        setShowValues(prev => ({ ...prev, [index]: !prev[index] }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] w-full mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <KeyRound className="h-6 w-6 text-indigo-600" />
                    Environment & API Keys
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Manage system-level configuration, database connections, and external service credentials.
                </p>
            </div>

            <Alert variant="default" className="bg-amber-50 text-amber-900 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 font-bold">Important Notice</AlertTitle>
                <AlertDescription className="text-amber-700/90 text-sm mt-1">
                    Changes made here directly update the <code className="bg-amber-100 px-1 py-0.5 rounded">.env</code> file. 
                    Depending on your hosting environment (e.g., standard Node.js/Next.js), you <strong>must restart the application server</strong> for the new configuration values to be fully loaded into memory.
                </AlertDescription>
            </Alert>

            <Card className="-200 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg">Configuration Keys</CardTitle>
                            <CardDescription>Add, edit, or remove environment variables.</CardDescription>
                        </div>
                        <Button onClick={handleAddRow} size="sm" variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" /> Add Key
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                    {variables.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 border border-dashed rounded-lg">
                            No environment variables found.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-4 px-2 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b">
                                <div className="col-span-4">KEY NAME</div>
                                <div className="col-span-7">VALUE</div>
                                <div className="col-span-1 text-center">ACTION</div>
                            </div>
                            
                            {variables.map((v, i) => (
                                <div key={i} className="grid grid-cols-12 gap-4 items-center animate-in fade-in slide-in-from-bottom-2">
                                    <div className="col-span-4">
                                        <Input 
                                            placeholder="e.g. SMTP_PASSWORD" 
                                            value={v.key} 
                                            onChange={(e) => handleChange(i, 'key', e.target.value)}
                                            className="font-mono text-sm bg-slate-50"
                                        />
                                    </div>
                                    <div className="col-span-7 relative">
                                        <Input 
                                            type={v.isSecret && !showValues[i] ? "password" : "text"}
                                            placeholder="Value..." 
                                            value={v.value} 
                                            onChange={(e) => handleChange(i, 'value', e.target.value)}
                                            className="pr-10 font-mono text-sm shadow-inner"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                                            onClick={() => toggleVisibility(i)}
                                            title={showValues[i] ? "Hide value" : "Reveal value"}
                                        >
                                            {showValues[i] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-9 w-9"
                                            onClick={() => handleRemoveRow(i)}
                                            title="Remove Key"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                <div className="px-6 py-4 bg-slate-50 border-t flex justify-end rounded-b-xl">
                    <Button 
                        onClick={handleSave} 
                        disabled={saving || variables.length === 0}
                        className="gap-2 min-w-[140px]"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? "Saving..." : "Save Configuration"}
                    </Button>
                </div>
            </Card>

        </div>
    );
}

