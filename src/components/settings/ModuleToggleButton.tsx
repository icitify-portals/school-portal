"use client";

import { toggleModule } from "@/actions/modules";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ModuleToggleButton({ 
    moduleKey, 
    isEnabled 
}: { 
    moduleKey: string; 
    isEnabled: boolean 
}) {
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        setLoading(true);
        try {
            const res = await toggleModule(moduleKey, !isEnabled);
            if (res.success) {
                toast.success(`${moduleKey} status updated`);
            } else {
                toast.error("Failed to update module status");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button 
            onClick={handleToggle}
            disabled={loading}
            variant="ghost" 
            className={cn(
                "h-12 w-12 rounded-xl p-0 flex items-center justify-center transition-all",
                isEnabled ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
            )}
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : isEnabled ? (
                <Eye className="w-5 h-5" />
            ) : (
                <EyeOff className="w-5 h-5" />
            )}
        </Button>
    );
}
