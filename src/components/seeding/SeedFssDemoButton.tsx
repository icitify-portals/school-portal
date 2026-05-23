"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, GraduationCap } from "lucide-react";
import { seedFssDemoData } from "@/actions/seed-fss-demo";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SeedFssDemoButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSeed = async () => {
        setLoading(true);
        try {
            const result = await seedFssDemoData();
            if (result.success) {
                toast.success(result.message);
                router.refresh(); // Refresh to see the new homepage sections
            } else {
                toast.error(`Seeding Failed: ${result.error}`);
            }
        } catch (error) {
            toast.error("An unexpected error occurred during seeding.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button 
            onClick={handleSeed} 
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-10 h-14 font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-600/40"
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Launching FSS Main Portal...
                </>
            ) : (
                <>
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Deploy FSS Ibadan Main Portal Content
                </>
            )}
        </Button>
    );
}
