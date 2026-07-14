"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plug, Video, CreditCard, BarChart3, CheckCircle, XCircle,
    ExternalLink, Loader2, Globe, Zap, ShieldCheck
} from "lucide-react";
import { getConferencingStatus } from "@/actions/video-conferencing";
import { getPortalSettings, updateSystemSetting } from "@/actions/settings";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function IntegrationsPage() {
    const [vcStatus, setVcStatus] = useState<any>(null);
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isNinConfigOpen, setIsNinConfigOpen] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // Form states for settings
    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");
    const [prefix, setPrefix] = useState("");
    const [ninMode, setNinMode] = useState("simulator");
    const [ninProvider, setNinProvider] = useState("dojah");

    useEffect(() => {
        const fetchAll = async () => {
            const [vc, sysSettings] = await Promise.all([
                getConferencingStatus(),
                getPortalSettings()
            ]);
            if (vc?.providers) setVcStatus(vc.providers);
            setSettings(sysSettings);
            setLoading(false);
        };
        fetchAll();
    }, []);

    const findSetting = (key: string) => settings.find(s => s.key === key)?.value || "";

    const handleSaveAcademic = async () => {
        setSaving(true);
        if (selectedIntegration.name === "Crossref") {
            await Promise.all([
                updateSystemSetting("crossref_login_id", loginId, "academic"),
                updateSystemSetting("crossref_password", password, "academic", true),
                updateSystemSetting("crossref_prefix", prefix, "academic")
            ]);
        } else if (selectedIntegration.name === "ORCID") {
            await updateSystemSetting("orcid_client_id", loginId, "academic");
            await updateSystemSetting("orcid_client_secret", password, "academic", true);
        }
        const newSettings = await getPortalSettings();
        setSettings(newSettings);
        setSaving(false);
        setIsConfigOpen(false);
        toast.success(`${selectedIntegration.name} configuration saved!`);
    };

    const handleSaveNin = async () => {
        setSaving(true);
        await updateSystemSetting("NIN_VERIFICATION_MODE", ninMode, "identity");
        await updateSystemSetting("NIN_LIVE_PROVIDER", ninProvider, "identity");
        const newSettings = await getPortalSettings();
        setSettings(newSettings);
        setSaving(false);
        setIsNinConfigOpen(false);
        toast.success("NIN Verification settings saved!");
    };

    const StatusBadge = ({ configured }: { configured: boolean }) => (
        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${configured ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {configured ? <><CheckCircle className="w-3 h-3" /> Connected</> : <><XCircle className="w-3 h-3" /> Not configured</>}
        </span>
    );

    const integrations = [
        {
            category: "Academic Publishing",
            icon: BookOpen,
            color: "text-indigo-600",
            items: [
                {
                    name: "Crossref",
                    desc: "Automated DOI registration for journal articles",
                    envVars: ["CROSSREF_LOGIN_ID", "CROSSREF_PASSWORD", "CROSSREF_PREFIX"],
                    configured: !!findSetting("crossref_login_id"),
                    onConfigure: () => {
                        setSelectedIntegration({ name: "Crossref", fields: ["Login ID", "Password", "DOI Prefix"] });
                        setLoginId(findSetting("crossref_login_id"));
                        setPassword(""); // Don't show encrypted password
                        setPrefix(findSetting("crossref_prefix"));
                        setIsConfigOpen(true);
                    }
                },
                {
                    name: "ORCID",
                    desc: "Persistent digital identifier for researchers",
                    envVars: ["ORCID_CLIENT_ID", "ORCID_CLIENT_SECRET"],
                    configured: !!findSetting("orcid_client_id"),
                    onConfigure: () => {
                        setSelectedIntegration({ name: "ORCID", fields: ["Client ID", "Client Secret"] });
                        setLoginId(findSetting("orcid_client_id"));
                        setPassword("");
                        setIsConfigOpen(true);
                    }
                }
            ]
        },
        {
            category: "Identity Verification (KYC)",
            icon: ShieldCheck,
            color: "text-rose-600",
            items: [
                {
                    name: "NIN Verification",
                    desc: "Configure National Identity lookup mode and provider",
                    envVars: ["DOJAH_API_KEY", "VERIFYME_API_KEY"],
                    configured: true,
                    onConfigure: () => {
                        setNinMode(findSetting('NIN_VERIFICATION_MODE') || 'simulator');
                        setNinProvider(findSetting('NIN_LIVE_PROVIDER') || 'dojah');
                        setIsNinConfigOpen(true);
                    }
                }
            ]
        },
        {
            category: "Video Conferencing",
            icon: Video,
            color: "text-blue-600",
            items: [
                {
                    name: "Zoom",
                    desc: "Schedule and host video meetings for courses",
                    envVars: ["ZOOM_API_KEY", "ZOOM_API_SECRET", "ZOOM_ACCOUNT_ID"],
                    configured: vcStatus?.zoom?.configured || false,
                    docsUrl: "https://marketplace.zoom.us/docs/guides",
                },
                {
                    name: "BigBlueButton",
                    desc: "Open-source web conferencing for education",
                    envVars: ["BBB_SERVER_URL", "BBB_SECRET"],
                    configured: vcStatus?.bbb?.configured || false,
                    docsUrl: "https://docs.bigbluebutton.org/",
                },
            ],
        },
        {
            category: "Payment Gateways",
            icon: CreditCard,
            color: "text-green-600",
            items: [
                { name: "Paystack", envVars: ["PAYSTACK_PUBLIC_KEY", "PAYSTACK_SECRET_KEY"], configured: !!process.env.NEXT_PUBLIC_PAYSTACK_KEY, desc: "Accept payments via cards, bank transfer, USSD" },
                { name: "Flutterwave", envVars: ["FLW_PUBLIC_KEY", "FLW_SECRET_KEY"], configured: false, desc: "Multi-currency payment processing" },
                { name: "Remita", envVars: ["REMITA_PUBLIC_KEY", "REMITA_SECRET_KEY"], configured: false, desc: "Government-approved payment gateway" },
                { name: "OPay", envVars: ["OPAY_PUBLIC_KEY", "OPAY_SECRET_KEY"], configured: false, desc: "Mobile money and digital payments" },
            ],
        },
        {
            category: "Analytics",
            icon: BarChart3,
            color: "text-purple-600",
            items: [
                { name: "Google Analytics", envVars: ["NEXT_PUBLIC_GA_ID"], configured: !!process.env.NEXT_PUBLIC_GA_ID, desc: "Track page views, user behavior, and conversions" },
            ],
        },
    ];

    if (loading) return (
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Plug className="w-6 h-6 text-indigo-600" />
                    Integrations
                </h1>
                <p className="text-sm text-slate-500 mt-1">Configure external service connections and API integrations</p>
            </div>

            {integrations.map(group => (
                <div key={group.category} className="space-y-3">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <group.icon className={`w-4 h-4 ${group.color}`} />
                        {group.category}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.items.map(item => (
                            <Card key={item.name} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-black text-slate-800">{item.name}</h3>
                                        <StatusBadge configured={item.configured} />
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3">{item.desc}</p>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Required Parameters:</p>
                                        {item.envVars.map(v => (
                                            <code key={v} className="block text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">{v}</code>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        {(item as any).onConfigure && (
                                            <Button size="sm" className="h-8 bg-indigo-600 font-bold px-4" onClick={(item as any).onConfigure}>
                                                Configure
                                            </Button>
                                        )}
                                        {(item as any).docsUrl && (
                                            <a href={(item as any).docsUrl} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
                                                <ExternalLink className="w-3 h-3" /> Docs
                                            </a>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}

            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
                        <DialogDescription>
                            Enter your credentials for {selectedIntegration?.name}. Sensitive fields like passwords will be encrypted before storage.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{selectedIntegration?.fields[0]}</Label>
                            <Input value={loginId} onChange={e => setLoginId(e.target.value)} placeholder={`Enter ${selectedIntegration?.fields[0]}`} />
                        </div>
                        <div className="space-y-2">
                            <Label>{selectedIntegration?.fields[1]}</Label>
                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={`Enter ${selectedIntegration?.fields[1]}`} />
                        </div>
                        {selectedIntegration?.name === "Crossref" && (
                            <div className="space-y-2">
                                <Label>DOI Prefix</Label>
                                <Input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="e.g. 10.1234" />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Cancel</Button>
                        <Button className="bg-indigo-600" onClick={handleSaveAcademic} disabled={saving}>
                            {saving ? "Saving..." : "Save Configuration"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isNinConfigOpen} onOpenChange={setIsNinConfigOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configure NIN Verification</DialogTitle>
                        <DialogDescription>
                            Select the verification mode and active API provider for applicant NIN resolution.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Verification Mode</Label>
                            <select 
                                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 font-medium"
                                value={ninMode} 
                                onChange={e => setNinMode(e.target.value)}
                            >
                                <option value="disabled">Disabled (Manual Name Entry)</option>
                                <option value="simulator">Simulator (Free Mock Data)</option>
                                <option value="live">Live API (NIMC Production)</option>
                            </select>
                        </div>
                        {ninMode === 'live' && (
                            <div className="space-y-2">
                                <Label>Live Provider</Label>
                                <select 
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 font-medium"
                                    value={ninProvider} 
                                    onChange={e => setNinProvider(e.target.value)}
                                >
                                    <option value="dojah">Dojah</option>
                                    <option value="verifyme">VerifyMe Nigeria</option>
                                    <option value="smileid">SmileID</option>
                                    <option value="monnify">Monnify</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-2">
                                    Make sure {ninProvider.toUpperCase()}_API_KEY is configured in your environment variables.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNinConfigOpen(false)}>Cancel</Button>
                        <Button className="bg-indigo-600" onClick={handleSaveNin} disabled={saving}>
                            {saving ? "Saving..." : "Save Configuration"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quick Setup Guide */}
            <Card className="-to-br from-indigo-50 to-blue-50 -100 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-5">
                    <h3 className="font-black text-indigo-900 flex items-center gap-2 mb-3">
                        <Zap className="w-5 h-5" /> Quick Setup Guide
                    </h3>
                    <p className="text-sm text-slate-600 mb-2">
                        For academic integrations (Crossref, ORCID), use the **Configure** buttons above to save credentials directly to the portal database. 
                        Other integrations still require manual setup in your <code className="bg-white/50 px-1 rounded text-indigo-700">.env</code> file.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
