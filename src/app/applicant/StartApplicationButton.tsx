"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
    templateId: number;
    templateName: string;
}

export function StartApplicationButton({ templateId, templateName }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleStart = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/applicant/start-application", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId })
            });
            const data = await res.json();
            
            if (data.redirectUrl) {
                router.push(data.redirectUrl);
            } else {
                toast.error("Failed to start application");
                setIsLoading(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <Button 
            onClick={handleStart} 
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-xl flex items-center justify-between px-6 group-hover:shadow-lg transition-all text-xs uppercase tracking-widest shadow-md shadow-indigo-200"
        >
            {isLoading ? (
                <>
                    <span>Starting...</span>
                    <Loader2 className="w-4 h-4 animate-spin" />
                </>
            ) : (
                <>
                    <span>Start Application</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </>
            )}
        </Button>
    );
}
