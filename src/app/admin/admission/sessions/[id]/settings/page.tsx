
import { getAdmissionSession } from "@/actions/admission-session";
import AdmissionSessionForm from "./session-form";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SessionSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const isNew = id === 'new';
    let session = null;

    if (!isNew) {
        const idNum = parseInt(id);
        const res = await getAdmissionSession(idNum);
        if (!res.success || !res.session) {
            notFound();
        }
        session = res.session;
    }

    return (
        <div className="p-6 max-w-[1600px] w-full mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/admission/sessions">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {isNew ? 'New Admission Session' : `Configure: ${session?.name}`}
                    </h1>
                    <p className="text-slate-500">
                        Set timelines, fees, and application requirements.
                    </p>
                </div>
            </div>

            <AdmissionSessionForm session={session as any} isNew={isNew} />
        </div>
    );
}
