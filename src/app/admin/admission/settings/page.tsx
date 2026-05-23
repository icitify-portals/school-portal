"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { syncJambDataFromApi, getProgrammesWithPolicy, updateAdmissionPolicy } from "@/actions/admission";
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Save } from "lucide-react";

export default function AdmissionSettingsPage() {
    const [apiKey, setApiKey] = useState("MOCK_JAMB_KEY_12345");
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSync = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await syncJambDataFromApi(year, apiKey);
            if (res.success) {
                setMessage({ type: 'success', text: res.message || "Sync successful" });
            } else {
                setMessage({ type: 'error', text: res.error || "Sync failed" });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "An unexpected error occurred" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Admission Settings</h1>
                <p className="text-slate-500">Manage external integrations and admission configurations.</p>
            </div>

            <AdmissionPolicyEditor />

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <RefreshCw className="w-6 h-6 text-green-700" />
                        </div>
                        <div>
                            <CardTitle>JAMB CAPS Integration</CardTitle>
                            <CardDescription>Sync candidate data directly from the Joint Admissions and Matriculation Board.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input
                                id="apiKey"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter JAMB API Key"
                            />
                            <p className="text-xs text-slate-500">Use 'MOCK_KEY' for testing simulation.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="year">Exam Year</Label>
                            <Input
                                id="year"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                placeholder="YYYY"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {message.text}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleSync} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Sync Candidates Now
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function AdmissionPolicyEditor() {
    const [programmes, setProgrammes] = useState<any[]>([]);
    const [selectedProgId, setSelectedProgId] = useState<string>("");
    const [policy, setPolicy] = useState({ cutOffMark: 180, meritQuota: 45, catchmentAreas: "" });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        loadProgrammes();
    }, []);

    const loadProgrammes = async () => {
        const data = await getProgrammesWithPolicy();
        setProgrammes(data);
    };

    const handleProgChange = (id: string) => {
        setSelectedProgId(id);
        const prog = programmes.find(p => p.id.toString() === id);
        if (prog) {
            setPolicy({
                cutOffMark: prog.cutOffMark || 180,
                meritQuota: prog.meritQuota || 45,
                catchmentAreas: prog.catchmentAreas ? JSON.parse(prog.catchmentAreas).join(", ") : ""
            });
        }
    };

    const handleSave = async () => {
        if (!selectedProgId) return;
        setLoading(true);
        setMsg("");
        try {
            const areas = policy.catchmentAreas.split(",").map(s => s.trim()).filter(Boolean);
            const res = await updateAdmissionPolicy(parseInt(selectedProgId), {
                cutOffMark: policy.cutOffMark,
                meritQuota: policy.meritQuota,
                catchmentAreas: areas
            });

            if (res.success) {
                setMsg("Policy saved successfully.");
                loadProgrammes(); // Refresh
            } else {
                setMsg("Failed to save policy.");
            }
        } catch (e) {
            setMsg("Error saving policy.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Admission Policy Configuration</CardTitle>
                <CardDescription>Set cut-off marks and catchment areas per programme.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Select Programme</Label>
                    <Select value={selectedProgId} onValueChange={handleProgChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose a programme..." />
                        </SelectTrigger>
                        <SelectContent>
                            {programmes.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {selectedProgId && (
                    <div className="animate-in fade-in slide-in-from-top-2 space-y-4 border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Cut-Off Mark</Label>
                                <Input
                                    type="number"
                                    value={policy.cutOffMark}
                                    onChange={(e) => setPolicy({ ...policy, cutOffMark: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Merit Quota (%)</Label>
                                <Input
                                    type="number"
                                    value={policy.meritQuota}
                                    onChange={(e) => setPolicy({ ...policy, meritQuota: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Catchment Areas (comma separated)</Label>
                            <Input
                                value={policy.catchmentAreas}
                                onChange={(e) => setPolicy({ ...policy, catchmentAreas: e.target.value })}
                                placeholder="e.g. Lagos, Ogun, Oyo"
                            />
                            <p className="text-xs text-slate-500">Candidates from these states will be considered under catchment policy.</p>
                        </div>

                        {msg && (
                            <div className="text-sm p-2 bg-slate-100 rounded text-slate-700">
                                {msg}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button onClick={handleSave} disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Save Policy
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
