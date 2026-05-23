import { getLeadDetails, addLeadInteraction, updateLeadStatus } from "@/actions/crm";
import { 
    ArrowLeft, 
    Mail, 
    Phone, 
    Calendar, 
    MessageSquare, 
    User, 
    GraduationCap, 
    MapPin,
    Clock,
    Send,
    Plus
} from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function LeadDetailsPage({ params }: { params: { id: string } }) {
    const leadId = parseInt(params.id);
    const { lead, error } = await getLeadDetails(leadId) as any;

    if (error || !lead) {
        return <div className="p-8 text-center text-red-600 font-bold">{error || "Lead not found"}</div>;
    }

    async function handleAddNote(formData: FormData) {
        "use server";
        const summary = formData.get("summary") as string;
        const type = formData.get("type") as any;
        await addLeadInteraction(leadId, { type, summary });
    }

    async function handleStatusChange(formData: FormData) {
        "use server";
        const status = formData.get("status") as string;
        await updateLeadStatus(leadId, status);
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link 
                    href="/admin/crm"
                    className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">
                        <Link href="/admin/crm" className="hover:text-indigo-600 transition-colors">CRM</Link>
                        <span>/</span>
                        <span className="text-slate-900">{lead.name}</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Lead <span className="text-indigo-600">Details</span>
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Lead Profile */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 space-y-8 relative overflow-hidden">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 text-4xl font-black">
                                {lead.name[0]}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{lead.name}</h2>
                                <p className="text-indigo-600 font-bold">Source: {lead.source}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-8 border-t border-slate-50">
                            <div className="flex items-center gap-4 text-slate-600">
                                <Mail className="w-5 h-5 text-indigo-400" />
                                <span className="font-bold">{lead.email}</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-600">
                                <Phone className="w-5 h-5 text-indigo-400" />
                                <span className="font-bold">{lead.phone || "No phone provided"}</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-600">
                                <GraduationCap className="w-5 h-5 text-indigo-400" />
                                <span className="font-bold">{lead.programme?.name || "No Programme Selected"}</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-600">
                                <MapPin className="w-5 h-5 text-indigo-400" />
                                <span className="font-bold">{lead.unit?.name || "General Inquiry"}</span>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50">
                            <form action={handleStatusChange} className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Status</label>
                                <div className="flex gap-2">
                                    <select 
                                        name="status"
                                        defaultValue={lead.status}
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    >
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="interested">Interested</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="converted">Converted</option>
                                        <option value="closed">Closed</option>
                                        <option value="junk">Junk</option>
                                    </select>
                                    <button type="submit" className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                                        <CheckCircle2Icon className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Right Column: Interactions Timeline */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Add Interaction Form */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                            <Plus className="w-6 h-6 text-indigo-600" />
                            Log New Interaction
                        </h3>
                        <form action={handleAddNote} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <select 
                                    name="type"
                                    className="px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none"
                                >
                                    <option value="note">Internal Note</option>
                                    <option value="call">Phone Call</option>
                                    <option value="email">Email Sent</option>
                                    <option value="whatsapp">WhatsApp Message</option>
                                    <option value="meeting">Physical Meeting</option>
                                </select>
                                <div className="md:col-span-2">
                                    <input 
                                        required
                                        name="summary"
                                        placeholder="Summarize the interaction..."
                                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl">
                                <Send className="w-5 h-5" />
                                Log Interaction
                            </button>
                        </form>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Clock className="w-6 h-6 text-indigo-600" />
                            Activity Timeline
                        </h3>
                        <div className="space-y-6 relative before:absolute before:left-[1.85rem] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                            {lead.interactions?.map((interaction: any) => (
                                <div key={interaction.id} className="relative pl-16 group">
                                    <div className="absolute left-4 top-2 w-8 h-8 bg-white border-4 border-slate-50 rounded-full flex items-center justify-center z-10 group-hover:border-indigo-100 transition-colors">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full group-hover:bg-indigo-600 transition-colors" />
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-full">
                                                    {interaction.type}
                                                </span>
                                                <span className="text-sm font-bold text-slate-400">
                                                    by {interaction.staff?.name}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">
                                                {new Date(interaction.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-700 font-bold leading-relaxed">
                                            {interaction.summary}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {lead.interactions?.length === 0 && (
                                <div className="text-center py-12 text-slate-400 font-bold">
                                    No interactions logged yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckCircle2Icon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
    );
}
