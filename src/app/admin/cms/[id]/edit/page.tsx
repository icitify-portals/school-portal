"use client";

import { useState, useEffect, use } from "react";
import { getPageById } from "@/actions/cms";
import PageEditorForm from "../../editor-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [page, setPage] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const res = await getPageById(parseInt(id));
            if (res.success) {
                setPage(res.data);
            } else {
                toast.error(res.error || "Failed to fetch page");
            }
            setLoading(false);
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Page Data...</p>
            </div>
        );
    }

    if (!page) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4 text-center p-6">
                <div className="text-slate-900 text-2xl font-black">Page Not Found</div>
                <p className="text-slate-500">The page you are trying to edit does not exist or has been removed.</p>
            </div>
        );
    }

    return <PageEditorForm initialData={page} />;
}
