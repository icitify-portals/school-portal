import { auth } from "@/auth";
import { getSystemSettings, getEnabledModules } from "@/actions/system-settings";
import SettingsHubClient from "./_components/SettingsHubClient";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
    const session = await auth();

    if (!session || (session.user as any).role !== 'admin') {
        redirect("/login");
    }

    const initialSettings = await getSystemSettings();
    const enabledModules = await getEnabledModules();
    const modulesCount = Object.values(enabledModules).filter(val => val === true).length;

    return (
        <SettingsHubClient 
            initialSettings={initialSettings} 
            modulesCount={modulesCount} 
        />
    );
}
