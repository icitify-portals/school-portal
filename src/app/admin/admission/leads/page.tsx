import { getLeads } from "@/actions/admission_extended";
import { LeadsBoard } from "./leads-board";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
    const leads = await getLeads();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Users className="h-8 w-8 text-blue-600" />
                        Prospective Student Leads
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Track inquiries and manage prospective student pipelines.
                    </p>
                </div>
                {/* Normally we'd have a dialog to add a lead here, omitted for brevity but can be added */}
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Lead
                </Button>
            </div>

            <LeadsBoard initialLeads={leads} />
        </div>
    );
}
