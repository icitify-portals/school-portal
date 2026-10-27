"use client";

import React, { useState } from "react";
import MedicalFormClient from "./MedicalFormClient";
import { MedicalFormPrintable } from "@/components/documents/MedicalFormPrintable";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";

interface MedicalFormContainerProps {
    data: any;
    initialData: any;
    hasSubmitted: boolean;
}

export default function MedicalFormContainer({ data, initialData, hasSubmitted }: MedicalFormContainerProps) {
    const router = useRouter();
    const [mode, setMode] = useState<"view" | "edit">(hasSubmitted ? "view" : "edit");

    if (mode === "view" && hasSubmitted) {
        return (
            <MedicalFormPrintable 
                data={data} 
                isStaffView={false} 
                onEdit={() => setMode("edit")} 
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                {/* Header matching the green theme of the uploaded forms */}
                <div className="bg-emerald-800 px-6 py-8 sm:px-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <div className="relative flex justify-between items-center mb-2">
                        {hasSubmitted ? (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setMode("view")}
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" /> View Printable Form
                            </Button>
                        ) : <div />}
                    </div>
                    <h1 className="relative text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
                        Student Medical & Health Form
                    </h1>
                    <p className="relative text-emerald-100 mt-1 font-medium text-sm">
                        Federal School of Statistics, Ibadan • Health Services Directorate
                    </p>
                </div>

                <div className="p-6 sm:p-10 bg-slate-50">
                    <MedicalFormClient 
                        initialData={initialData} 
                        onSuccess={() => {
                            setMode("view");
                            router.refresh();
                        }} 
                    />
                </div>
            </div>
        </div>
    );
}
