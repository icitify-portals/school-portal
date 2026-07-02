"use client";

import { useState } from "react";
import { SystemSetting, updateSystemSetting } from "@/actions/system-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SettingsFormProps {
    initialSettings: SystemSetting[];
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [settings, setSettings] = useState<SystemSetting[]>(initialSettings);
    const [loadingKey, setLoadingKey] = useState<string | null>(null);

    const handleToggle = async (key: string, currentValue: string) => {
        const newValue = currentValue === 'true' ? 'false' : 'true';
        setLoadingKey(key);

        try {
            // Optimistic update
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));

            await updateSystemSetting(key, newValue);
            toast.success("Setting updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update setting");
            // Revert
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value: currentValue } : s));
        } finally {
            setLoadingKey(null);
        }
    };

    const handleTextUpdate = async (key: string, currentValue: string) => {
        setLoadingKey(key);

        try {
            await updateSystemSetting(key, currentValue);
            toast.success("Setting updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update setting");
        } finally {
            setLoadingKey(null);
        }
    };

    const modules = settings.filter(s => s.key.startsWith('module.'));
    const system = settings.filter(s => s.key.startsWith('system.'));
    const livekit = settings.filter(s => s.key.startsWith('livekit.'));

    return (
        <div className="space-y-6">
            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle>Feature Modules</CardTitle>
                    <CardDescription>Enable or disable specific features of the portal. Disabling a module will hide it from the navigation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    {modules.map((setting) => (
                        <div key={setting.key} className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor={setting.key} className="capitalize font-medium">
                                    {setting.key.replace('module.', '').replace('_', ' ')}
                                </Label>
                                {setting.description && (
                                    <span className="text-xs text-muted-foreground">{setting.description}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {loadingKey === setting.key && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                <Switch
                                    id={setting.key}
                                    checked={setting.value === 'true'}
                                    onCheckedChange={() => handleToggle(setting.key, setting.value)}
                                    disabled={loadingKey === setting.key}
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle>System Configuration</CardTitle>
                    <CardDescription>Global system settings and preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    {system.map((setting) => (
                        <div key={setting.key} className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor={setting.key} className="capitalize font-medium">
                                    {setting.key.replace('system.', '').replace('_', ' ')}
                                </Label>
                            </div>

                            {/* logic for non-boolean settings could go here later */}
                            <div className="flex items-center gap-2">
                                {['true', 'false'].includes(setting.value) ? (
                                    <>
                                        {loadingKey === setting.key && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                        <Switch
                                            id={setting.key}
                                            checked={setting.value === 'true'}
                                            onCheckedChange={() => handleToggle(setting.key, setting.value)}
                                            disabled={loadingKey === setting.key}
                                        />
                                    </>
                                ) : (
                                    <span className="text-sm text-muted-foreground">{setting.value}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle>LiveKit Integrations</CardTitle>
                    <CardDescription>Configure your connection to the LiveKit signaling server for the live classroom features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    {livekit.map((setting) => (
                        <div key={setting.key} className="flex items-center space-x-4">
                            <Label htmlFor={setting.key} className="w-1/4 capitalize font-medium">
                                {setting.key.replace('livekit.', '').replace('_', ' ')}
                            </Label>
                            <div className="flex-1 flex items-center gap-2">
                                <Input
                                    id={setting.key}
                                    value={setting.value}
                                    onChange={(e) => setSettings(prev => prev.map(s => s.key === setting.key ? { ...s, value: e.target.value } : s))}
                                    disabled={loadingKey === setting.key}
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => handleTextUpdate(setting.key, setting.value)}
                                    disabled={loadingKey === setting.key}
                                >
                                    {loadingKey === setting.key ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
