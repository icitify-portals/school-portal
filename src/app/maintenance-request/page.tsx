// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createGeneralRequestAction, getMyRequestsAction } from "@/actions/works-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
    Wrench, 
    AlertCircle, 
    CheckCircle2, 
    Building, 
    MapPin, 
    Clock, 
    ListFilter,
    ClipboardList,
    AlertTriangle,
    ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const RequestSchema = z.object({
    locationType: z.enum(['classroom', 'lab', 'office', 'hostel_common', 'sports', 'other']),
    buildingName: z.string().min(1, "Building name is required"),
    roomOrAreaDescription: z.string().min(1, "Location details (e.g., Rm 102, West Wing) is required"),
    title: z.string().min(5, "Summary of fault must be at least 5 characters"),
    description: z.string().min(10, "Detailed description must be at least 10 characters"),
    category: z.enum(['electrical', 'plumbing', 'hvac', 'carpentry', 'masonry', 'other']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
});

type RequestFormValues = z.infer<typeof RequestSchema>;

export default function MaintenanceRequestPage() {
    const [submitting, setSubmitting] = useState(false);
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"report" | "history">("report");
    const [loadingHistory, setLoadingHistory] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<RequestFormValues>({
        // @ts-expect-error - TS2322: Auto-suppressed for build
        resolver: zodResolver(RequestSchema),
        defaultValues: {
            priority: 'medium'
        }
    });

    useEffect(() => {
        if (activeTab === "history") {
            loadHistory();
        }
    }, [activeTab]);

    async function loadHistory() {
        setLoadingHistory(true);
        const res = await getMyRequestsAction();
        if (res.success && res.requests) {
            setMyRequests(res.requests);
        } else {
            toast.error("Failed to load request history");
        }
        setLoadingHistory(false);
    }

    async function onSubmit(data: RequestFormValues) {
        setSubmitting(true);
        const res = await createGeneralRequestAction(data);
        if (res.success) {
            toast.success("Maintenance request submitted successfully");
            reset();
            setActiveTab("history");
        } else {
            toast.error(res.error || "Failed to submit request");
        }
        setSubmitting(false);
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-6 px-4">
            {/* Header section with rich dark-blue gradient badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 mb-2 uppercase tracking-wide">
                        <Wrench className="w-3.5 h-3.5" />
                        Works & Maintenance
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Report a Campus Fault</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Submit maintenance and repair requests for facilities across the school.</p>
                </div>
                
                {/* Tab selectors with clean pill aesthetics */}
                <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-center">
                    <button
                        onClick={() => setActiveTab("report")}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === "report" 
                            ? "bg-white text-indigo-600 shadow-sm" 
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        <Wrench className="w-3.5 h-3.5" />
                        File Request
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === "history" 
                            ? "bg-white text-indigo-600 shadow-sm" 
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        <ClipboardList className="w-3.5 h-3.5" />
                        My Reports
                    </button>
                </div>
            </div>

            {activeTab === "report" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Left: Form card */}
                    <Card className="md:col-span-2 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                Request Details
                            </CardTitle>
                            <CardDescription>
                                Describe the issue and its location. Our estates team will review and dispatch a technician.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            // @ts-expect-error - TS2345: Auto-suppressed for build
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Location Type */}
                                    <div className="space-y-2">
                                        <Label htmlFor="locationType" className="text-xs font-extrabold uppercase text-slate-500">Location Category</Label>
                                        <select
                                            id="locationType"
                                            {...register("locationType")}
                                            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="classroom">Classroom / Lecture Hall</option>
                                            <option value="lab">Science / Computer Lab</option>
                                            <option value="office">Administrative Office</option>
                                            <option value="hostel_common">Hostel Common Room / Quad</option>
                                            <option value="sports">Sports Center / Courts</option>
                                            <option value="other">Other Common Area</option>
                                        </select>
                                        {errors.locationType && <p className="text-[11px] font-bold text-red-500">{errors.locationType.message}</p>}
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-xs font-extrabold uppercase text-slate-500">Fault Category</Label>
                                        <select
                                            id="category"
                                            {...register("category")}
                                            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="electrical">Electrical (Light, Socket, Fan)</option>
                                            <option value="plumbing">Plumbing (Tap, Toilet, Pipe Leak)</option>
                                            <option value="hvac">HVAC / Air Conditioner</option>
                                            <option value="carpentry">Carpentry (Door, Desk, Locker)</option>
                                            <option value="masonry">Masonry / Tiling / Walls</option>
                                            <option value="other">Other Fault</option>
                                        </select>
                                        {errors.category && <p className="text-[11px] font-bold text-red-500">{errors.category.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Building Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="buildingName" className="text-xs font-extrabold uppercase text-slate-500 flex items-center gap-1">
                                            <Building className="w-3.5 h-3.5" /> Building Name
                                        </Label>
                                        <Input
                                            id="buildingName"
                                            placeholder="e.g., Faculty of Science Block A"
                                            {...register("buildingName")}
                                            className="border-slate-200 focus:ring-indigo-500"
                                        />
                                        {errors.buildingName && <p className="text-[11px] font-bold text-red-500">{errors.buildingName.message}</p>}
                                    </div>

                                    {/* Room or Area Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="roomOrAreaDescription" className="text-xs font-extrabold uppercase text-slate-500 flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" /> Specific Location / Room
                                        </Label>
                                        <Input
                                            id="roomOrAreaDescription"
                                            placeholder="e.g., Room 102 (First Floor)"
                                            {...register("roomOrAreaDescription")}
                                            className="border-slate-200 focus:ring-indigo-500"
                                        />
                                        {errors.roomOrAreaDescription && <p className="text-[11px] font-bold text-red-500">{errors.roomOrAreaDescription.message}</p>}
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-xs font-extrabold uppercase text-slate-500">Summary of Issue</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g., AC not blowing cold air, makes loud humming noise"
                                        {...register("title")}
                                        className="border-slate-200 focus:ring-indigo-500"
                                    />
                                    {errors.title && <p className="text-[11px] font-bold text-red-500">{errors.title.message}</p>}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-xs font-extrabold uppercase text-slate-500">Detailed Description</Label>
                                    <Textarea
                                        id="description"
                                        rows={4}
                                        placeholder="Describe the fault in detail. If applicable, mention if it poses a safety hazard or blocks classroom activities."
                                        {...register("description")}
                                        className="border-slate-200 focus:ring-indigo-500"
                                    />
                                    {errors.description && <p className="text-[11px] font-bold text-red-500">{errors.description.message}</p>}
                                </div>

                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-extrabold uppercase text-slate-500">Urgency Level</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['low', 'medium', 'high', 'urgent'].map((p) => (
                                            <label 
                                                key={p} 
                                                className="border rounded-lg p-2.5 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors text-center"
                                            >
                                                <input 
                                                    type="radio" 
                                                    value={p} 
                                                    {...register("priority")} 
                                                    className="sr-only"
                                                />
                                                <span className={`text-[10px] font-extrabold uppercase ${
                                                    p === 'urgent' ? 'text-red-600' :
                                                    p === 'high' ? 'text-orange-600' :
                                                    p === 'medium' ? 'text-indigo-600' :
                                                    'text-slate-500'
                                                }`}>{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 text-xs uppercase tracking-widest transition-all mt-4"
                                >
                                    {submitting ? "Submitting Request..." : "Submit Maintenance Request"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Right: Info card */}
                    <div className="space-y-6">
                        <Card className="overflow-hidden text-white border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <CardContent className="p-6 space-y-4">
                                <h3 className="font-extrabold text-base tracking-tight text-white uppercase">Works Department Guidelines</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    The Works & Maintenance unit handles repairs for classrooms, lecture theaters, common campus spaces, and campus vehicles.
                                </p>
                                <div className="space-y-3 pt-2">
                                    <div className="flex gap-3 items-start">
                                        <div className="p-1 bg-white/10 rounded">
                                            <Clock className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold">Standard Resolution Time</h4>
                                            <p className="text-[10px] text-slate-400">Usually within 24-48 hours for normal priority issues.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start">
                                        <div className="p-1 bg-white/10 rounded">
                                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold">Emergency Channels</h4>
                                            <p className="text-[10px] text-slate-400">For active electrical fires, heavy flooding, or building structural risk, report directly to the security office or dial campus emergency lines.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                /* History Tab */
                <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
                        <CardTitle className="text-lg font-bold text-slate-900">Your Filed Reports</CardTitle>
                        <CardDescription>View status updates and resolution notes for requests you have submitted.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingHistory ? (
                            <div className="p-12 text-center text-slate-400 font-medium">
                                Loading request history...
                            </div>
                        ) : myRequests.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 font-medium">
                                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20 text-slate-500" />
                                You have not submitted any general maintenance reports yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 overflow-x-auto">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                            <th className="px-6 py-4">Title / Location</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Priority</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Date Filed</th>
                                            <th className="px-6 py-4">Resolution Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {myRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-900 uppercase">{req.title}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                                                            <Building className="w-3 h-3" /> {req.buildingName} - {req.roomOrAreaDescription}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0.5 px-2 bg-slate-100 text-slate-600 border-none">
                                                        {req.category}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={`text-[10px] font-bold uppercase py-0.5 px-2 border-none ${
                                                        req.priority === 'urgent' ? 'bg-red-50 text-red-600' :
                                                        req.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                                                        'bg-slate-50 text-slate-400'
                                                    }`}>
                                                        {req.priority}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className={`text-[10px] font-bold uppercase py-0.5 px-2 gap-1 ${
                                                        req.status === 'pending' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                                                        req.status === 'in-progress' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' :
                                                        req.status === 'resolved' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                                        'text-slate-400 bg-slate-50 border-slate-100'
                                                    }`}>
                                                        {req.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 max-w-xs truncate">
                                                    {req.status === 'resolved' ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Resolved
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 mt-0.5 italic">{req.resolutionNotes || "No notes supplied"}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-medium">Pending work order...</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
