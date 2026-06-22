"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
    Trophy, 
    Users, 
    Calendar, 
    ImageIcon, 
    MapPin, 
    Clock, 
    Medal, 
    CheckCircle,
    Loader2,
    Volume2,
    CalendarCheck,
    User
} from "lucide-react";
import { 
    getSportsTeams, 
    getSportsFixtures, 
    getSportsMedia
} from "@/actions/sports";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function StudentSportsHub() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("teams");
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState<any[]>([]);
    const [fixtures, setFixtures] = useState<any[]>([]);
    const [media, setMedia] = useState<any[]>([]);

    useEffect(() => {
        if (status === "loading") return;

        if (status === "unauthenticated") {
            toast.error("Please login to access the Student Sports & Athletics portal.");
            router.push("/login?callbackUrl=/student/sports");
            return;
        }

        fetchData();
    }, [session, status, router]);

    async function fetchData() {
        setLoading(true);
        try {
            const unitId = 1; // FSS Ibadan default node
            const [t, f, m] = await Promise.all([
                getSportsTeams(unitId),
                getSportsFixtures(unitId),
                getSportsMedia(unitId)
            ]);
            setTeams(t);
            setFixtures(f);
            setMedia(m);
        } catch (error) {
            console.error("Failed to load sports data:", error);
            toast.error("Error loading sports databases.");
        } finally {
            setLoading(false);
        }
    }

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
        </div>
    );

    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-10 bg-slate-50/30 min-h-screen">
            {/* Header banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-8 md:p-12 shadow-2xl text-white">
                <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10 max-w-2xl space-y-4">
                    <span className="px-3.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase tracking-widest">
                        FSS Athletics Directorate
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                        FSS FALCONS ARENA
                    </h1>
                    <p className="text-slate-300 text-sm leading-relaxed font-medium">
                        Explore your campus sports teams, cheer on squads during live fixtures, watch recent championship captures, and keep up with campus glory.
                    </p>
                </div>
            </div>

            {/* Dashboard Tabs */}
            <Tabs defaultValue="teams" onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-auto flex gap-1 justify-start">
                    <TabsTrigger value="teams" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow font-black uppercase text-[10px] tracking-widest gap-2 text-slate-600">
                        <Users className="w-4 h-4" /> Squad Roster
                    </TabsTrigger>
                    <TabsTrigger value="fixtures" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow font-black uppercase text-[10px] tracking-widest gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" /> Live Fixtures
                    </TabsTrigger>
                    <TabsTrigger value="media" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow font-black uppercase text-[10px] tracking-widest gap-2 text-slate-600">
                        <ImageIcon className="w-4 h-4" /> Media Highlights
                    </TabsTrigger>
                </TabsList>

                {/* Teams Grid */}
                <TabsContent value="teams" className="animate-in fade-in-50 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {teams.length === 0 ? (
                            <Card className="col-span-full border-dashed border-2 bg-slate-50 rounded-[3rem] p-16 flex flex-col items-center text-center space-y-4">
                                <Users className="w-12 h-12 text-slate-300" />
                                <h3 className="text-lg font-black uppercase tracking-tight italic">No Teams Seeded</h3>
                                <p className="text-slate-400 text-xs">Athletic squads are being formed for this session.</p>
                            </Card>
                        ) : (
                            teams.map((t) => (
                                <Card key={t.team.id} className="group border-none shadow-md rounded-[2.5rem] overflow-hidden bg-white hover:-translate-y-1 transition-all duration-300">
                                    <div className="h-44 bg-slate-900 relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                                        {t.team.imageUrl ? (
                                            <img src={t.team.imageUrl} className="w-full h-full object-cover" alt={t.team.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Trophy className="w-16 h-16 text-white/5" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-4 left-6">
                                            <span className="px-2.5 py-0.5 bg-emerald-500 rounded-full text-[8px] font-black uppercase tracking-widest text-white mb-2 inline-block">
                                                {t.team.category} • {t.team.gender}
                                            </span>
                                            <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{t.team.name}</h3>
                                        </div>
                                    </div>
                                    <CardContent className="p-6 space-y-4">
                                        <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                                            {t.team.description || "The proud athletic representative group representing Federal School of Statistics."}
                                        </p>
                                        
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Directing Coach</p>
                                                <p className="text-xs font-black text-slate-900">{t.coach?.name || "Dr. Alan Turing"}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 text-center">
                                            <div className="p-3 border border-slate-100 rounded-xl">
                                                <Users className="w-3.5 h-3.5 mx-auto text-slate-400 mb-1" />
                                                <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Roster Capacity</p>
                                                <span className="text-xs font-black text-slate-800">12 Athletes</span>
                                            </div>
                                            <div className="p-3 border border-slate-100 rounded-xl">
                                                <Medal className="w-3.5 h-3.5 mx-auto text-slate-400 mb-1" />
                                                <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Squad Status</p>
                                                <span className="text-xs font-black text-slate-800">Active</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Fixtures Timeline */}
                <TabsContent value="fixtures" className="animate-in fade-in-50 duration-200">
                    <div className="space-y-4">
                        {fixtures.length === 0 ? (
                            <Card className="border-dashed border-2 bg-slate-50 rounded-[3rem] p-16 flex flex-col items-center text-center space-y-4">
                                <Calendar className="w-12 h-12 text-slate-300" />
                                <h3 className="text-lg font-black uppercase tracking-tight italic">No Fixtures Programmed</h3>
                                <p className="text-slate-400 text-xs">Rivalries and tournament dates will be scheduled soon.</p>
                            </Card>
                        ) : (
                            fixtures.map((f) => (
                                <Card key={f.fixture.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white p-6 hover:shadow transition-shadow">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                        
                                        {/* Home Team (FSS) */}
                                        <div className="flex-1 flex items-center justify-end gap-4 text-right">
                                            <div>
                                                <h4 className="text-md font-black italic uppercase tracking-tight">{f.team.name}</h4>
                                                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">FSS Squad</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center font-black text-lg text-slate-800 border border-slate-100">
                                                {f.fixture.scoreHome ?? 0}
                                            </div>
                                        </div>

                                        {/* VS Badge */}
                                        <div className="flex flex-col items-center gap-1.5 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">VS</span>
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                f.fixture.status === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                                            )}>
                                                {f.fixture.status}
                                            </div>
                                        </div>

                                        {/* Away Team */}
                                        <div className="flex-1 flex items-center justify-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center font-black text-lg text-slate-800 border border-slate-100">
                                                {f.fixture.scoreAway ?? 0}
                                            </div>
                                            <div>
                                                <h4 className="text-md font-black italic uppercase tracking-tight">{f.fixture.opponent}</h4>
                                                <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Away / Opponent</p>
                                            </div>
                                        </div>

                                        {/* Venue and Time */}
                                        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                                            <div className="flex flex-col gap-1 text-slate-500">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">{f.fixture.venue}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">
                                                        {new Date(f.fixture.scheduledAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {f.fixture.resultNote && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 text-slate-500 text-[11px] leading-relaxed font-semibold italic">
                                            "{f.fixture.resultNote}"
                                        </div>
                                    )}
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Gallery Content */}
                <TabsContent value="media" className="animate-in fade-in-50 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {media.length === 0 ? (
                            <Card className="col-span-full border-dashed border-2 bg-slate-50 rounded-[3rem] p-16 flex flex-col items-center text-center space-y-4">
                                <ImageIcon className="w-12 h-12 text-slate-300" />
                                <h3 className="text-lg font-black uppercase tracking-tight italic">Gallery Empty</h3>
                                <p className="text-slate-400 text-xs">High-definition highlight captures will be uploaded after scheduled games.</p>
                            </Card>
                        ) : (
                            media.map((m) => (
                                <div key={m.id} className="group relative aspect-square rounded-2xl overflow-hidden shadow cursor-pointer bg-slate-900 border border-slate-100">
                                    <img src={m.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={m.caption} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-90 p-6 flex flex-col justify-end">
                                        <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[7px] font-black uppercase tracking-widest self-start mb-2">
                                            HIGHLIGHT
                                        </span>
                                        <p className="text-white text-[10px] font-black uppercase tracking-widest leading-relaxed">{m.caption}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
