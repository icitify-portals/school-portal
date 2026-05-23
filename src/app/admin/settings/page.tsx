import { auth } from "@/auth";
import { getSystemSettings } from "@/actions/system-settings";
import SettingsForm from "./_components/SettingsForm";
import BackupSettings from "./_components/BackupSettings";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, Database } from "lucide-react";

export default async function SettingsPage() {
    const session = await auth();

    if (!session || (session.user as any).role !== 'admin') {
        redirect("/login");
    }

    const initialSettings = await getSystemSettings();

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-indigo-600" />
                    System Settings
                </h1>
                <p className="text-sm text-slate-500 mt-1">Manage portal features, cloud integrations, and system backups.</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-slate-100 p-1 mb-4">
                    <TabsTrigger value="general" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase px-6">
                        <Shield className="w-3 h-3 mr-2" /> General
                    </TabsTrigger>
                    <TabsTrigger value="backup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase px-6">
                        <Database className="w-3 h-3 mr-2" /> Backup & Recovery
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-6">
                    <SettingsForm initialSettings={initialSettings} />
                </TabsContent>
                
                <TabsContent value="backup" className="space-y-6">
                    <BackupSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
