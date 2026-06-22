"use client";

import React from "react";
import K12SettingsEntry from "@/components/lms/K12SettingsEntry";
import TraitManagement from "@/components/lms/TraitManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    CalendarRange, 
    Binary, 
    Settings2 
} from "lucide-react";

export default function K12SettingsPage() {
    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 min-h-screen bg-[#F8FAFC]">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Settings2 className="text-white w-6 h-6" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">K-12 Educational Hub</h1>
                </div>
                <p className="text-slate-500 font-medium ml-1">Configure global parameters for primary and secondary school academic workflows.</p>
            </div>

            <Tabs defaultValue="schedule" className="space-y-8">
                <TabsList className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 h-auto gap-2">
                    <TabsTrigger 
                        value="schedule" 
                        className="rounded-xl px-8 py-3 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-100 font-bold transition-all flex gap-2"
                    >
                        <CalendarRange className="w-4 h-4" />
                        Term Schedule
                    </TabsTrigger>
                    <TabsTrigger 
                        value="traits" 
                        className="rounded-xl px-8 py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-100 font-bold transition-all flex gap-2"
                    >
                        <Binary className="w-4 h-4" />
                        Evaluation Domains
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="schedule" className="mt-0 ring-offset-transparent focus-visible:outline-none">
                    <K12SettingsEntry />
                </TabsContent>

                <TabsContent value="traits" className="mt-0 ring-offset-transparent focus-visible:outline-none">
                    <TraitManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}
