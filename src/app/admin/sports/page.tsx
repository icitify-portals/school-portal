"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
    Trophy, 
    Users, 
    Calendar, 
    Box, 
    Image as ImageIcon, 
    Plus, 
    Search, 
    ExternalLink,
    MapPin,
    Clock,
    Medal,
    Activity,
    Settings,
    MoreVertical
} from "lucide-react";
import { 
    getSportsTeams, 
    getSportsFixtures, 
    getSportsInventory, 
    getSportsMedia 
} from "@/actions/sports";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SportsAdminPage() {
    const [activeTab, setActiveTab] = useState("teams");
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState<any[]>([]);
    const [fixtures, setFixtures] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [media, setMedia] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        // Using unitId 1 as default for now, would typically come from context
        const [t, f, i, m] = await Promise.all([
            getSportsTeams(1),
            getSportsFixtures(1),
            getSportsInventory(1),
            getSportsMedia(1)
        ]);
        setTeams(t);
        setFixtures(f);
        setInventory(i);
        setMedia(m);
        setLoading(false);
    }

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1600px] w-full mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600/30 to-rose-600/30 opacity-50 mix-blend-overlay" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Trophy className="w-12 h-12 text-orange-400" />
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter drop-shadow-md italic uppercase">
                                    Sports & Recreation
                                </h1>
                            </div>
                            <p className="text-slate-300 font-medium tracking-tight max-w-2xl text-lg opacity-90">
                                Global governance of athletic teams, fixtures, and sports media
                            </p>
                        </div>
                        <Button className="bg-white text-slate-900 hover:bg-slate-100 font-black px-8 py-6 rounded-2xl shadow-xl transition-all hover:-translate-y-1 flex gap-3 uppercase text-[10px] tracking-widest group">
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500 text-orange-600" /> New Entity
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="teams" onValueChange={setActiveTab} className="space-y-8">
                    <TabsList className="flex bg-white/60 p-2 rounded-2xl backdrop-blur-3xl border border-white/40 overflow-x-auto max-w-fit shadow-xl shadow-slate-200/50">
                        <TabsTrigger value="teams" className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest gap-2 transition-all">
                            <Users className="w-4 h-4" /> Teams
                        </TabsTrigger>
                        <TabsTrigger value="fixtures" className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest gap-2 transition-all">
                            <Calendar className="w-4 h-4" /> Fixtures
                        </TabsTrigger>
                        <TabsTrigger value="inventory" className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest gap-2 transition-all">
                            <Box className="w-4 h-4" /> Inventory
                        </TabsTrigger>
                        <TabsTrigger value="media" className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest gap-2 transition-all">
                            <ImageIcon className="w-4 h-4" /> Gallery
                        </TabsTrigger>
                    </TabsList>

                    {/* Teams Content */}
                <TabsContent value="teams" className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {teams.length === 0 ? (
                            <Card className="col-span-full border-dashed border-2 bg-slate-50 rounded-[3rem] p-20 flex flex-col items-center text-center space-y-6">
                                <div className="p-6 bg-white rounded-full shadow-xl">
                                    <Users className="w-12 h-12 text-slate-300" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight italic">No Teams Found</h3>
                                    <p className="text-slate-400 text-sm max-w-xs mx-auto">Start by registering your first athletic team or sports club.</p>
                                </div>
                                <Button variant="outline" className="rounded-full font-black uppercase text-[10px] tracking-widest">Create Team</Button>
                            </Card>
                        ) : (
                            teams.map((t) => (
                                <Card key={t.team.id} className="group border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden hover:-translate-y-2 transition-all duration-500">
                                    <div className="h-48 bg-slate-900 relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                                        {t.team.imageUrl ? (
                                            <img src={t.team.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={t.team.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Trophy className="w-20 h-20 text-white/5" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-6 left-6 right-6">
                                            <span className="px-3 py-1 bg-orange-500/90 backdrop-blur-sm rounded-full text-[9px] font-black uppercase tracking-widest text-white mb-2 inline-block shadow-lg border border-white/20">
                                                {t.team.category}
                                            </span>
                                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight drop-shadow-md">{t.team.name}</h3>
                                        </div>
                                    </div>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="flex items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40">
                                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black shadow-inner">
                                                {t.coach?.name?.[0] || 'C'}
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Head Coach</p>
                                                <p className="text-sm font-black text-slate-900">{t.coach?.name || "Unassigned"}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl flex flex-col items-center gap-1 shadow-sm hover:bg-white/80 transition-colors">
                                                <Users className="w-4 h-4 text-orange-400" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Roster</span>
                                                <span className="text-sm font-black text-slate-900">12 Players</span>
                                            </div>
                                            <div className="p-4 bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl flex flex-col items-center gap-1 shadow-sm hover:bg-white/80 transition-colors">
                                                <Medal className="w-4 h-4 text-orange-400" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rank</span>
                                                <span className="text-sm font-black text-slate-900">#3 In League</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Fixtures Content */}
                <TabsContent value="fixtures" className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="space-y-6">
                        {fixtures.map((f) => (
                                <Card key={f.fixture.id} className="border border-white/40 bg-white/60 backdrop-blur-3xl shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                                <div className="flex flex-col md:flex-row items-center p-8 gap-8">
                                    <div className="flex-1 flex items-center justify-end gap-6 text-right">
                                        <div>
                                            <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{f.team.name}</h4>
                                            <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Home Team</p>
                                        </div>
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center font-black text-2xl text-slate-900">
                                            {f.fixture.scoreHome}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-2 px-8 py-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner shadow-black/20">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">VS</span>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10",
                                            f.fixture.status === 'completed' ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"
                                        )}>
                                            {f.fixture.status}
                                        </div>
                                    </div>

                                    <div className="flex-1 flex items-center justify-start gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center font-black text-2xl text-slate-900">
                                            {f.fixture.scoreAway}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{f.fixture.opponent}</h4>
                                            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Away / Opponent</p>
                                        </div>
                                    </div>

                                    <div className="md:w-px h-12 bg-slate-200" />

                                    <div className="flex flex-col items-start gap-3 pl-4">
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <MapPin className="w-4 h-4 text-orange-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{f.fixture.venue}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <Clock className="w-4 h-4 text-orange-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                                                {new Date(f.fixture.scheduledAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Media Gallery */}
                <TabsContent value="media" className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {media.map((m) => (
                            <div key={m.id} className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg cursor-pointer">
                                <img src={m.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={m.caption} />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                                    <p className="text-white text-[10px] font-black uppercase tracking-widest">{m.caption}</p>
                                </div>
                            </div>
                        ))}
                        <button className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400 hover:bg-slate-50 hover:border-indigo-300 transition-all">
                            <Plus className="w-8 h-8" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Add Media</span>
                        </button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        </div>
    );
}
