"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { seedDemoData } from "@/actions/seed-demo";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SeedDemoButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSeed = async () => {
        setLoading(true);
        try {
            const result = await seedDemoData();
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-10 h-14 font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-600/40"
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding Demo...
                </>
            ) : (
                <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Setup Home Slider & Demo Accounts
                </>
            )}
        </Button>
    );
}
