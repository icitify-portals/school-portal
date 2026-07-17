"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardModal from "./OnboardModal";

export default function OnboardSection() {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-6 rounded-2xl shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95 flex gap-3 uppercase text-[10px] tracking-widest">
                <Plus className="w-5 h-5" /> Onboard New School
            </Button>
            <OnboardModal open={open} onClose={() => setOpen(false)} onSuccess={() => { setOpen(false); router.refresh(); }} />
        </>
    );
}
