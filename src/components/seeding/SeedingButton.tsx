"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { seedLawCourses } from "@/actions/seed-law";
import { useState } from "react";
import { toast } from "sonner";

export default function SeedingButton() {
    const [loading, setLoading] = useState(false);

    const handleSeed = async () => {
        setLoading(true);
        try {
            const result = await seedLawCourses();
            if (result.success) {
                toast.success(result.message);
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
        <Button onClick={handleSeed} disabled={loading}>
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding...
                </>
            ) : (
                "Seed Law Curriculum"
            )}
        </Button>
    );
}
