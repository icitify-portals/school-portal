"use client";

import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap } from "lucide-react";
import { seedResultsDemo } from "@/actions/seed-results-demo";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SeedResultsDemoButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSeed = async () => {
        setLoading(true);
        try {
            const result = await seedResultsDemo();
            if (result.success) {
                toast.success("Results Demo Seeded Successfully! Login as any of the new students to verify.");
                router.refresh(); 
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
            variant="outline"
            className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 rounded-2xl px-10 h-14 font-black uppercase text-xs tracking-widest shadow-2xl transition-all duration-300"
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding Results...
                </>
            ) : (
                <>
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Test Result Engine (K-12 & Tertiary)
                </>
            )}
        </Button>
    );
}
