"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
    Trophy, 
    Users, 
    Calendar, 
    Box, 
    Image as ImageIcon, 
    Plus, 
    Search, 
    MapPin, 
    Clock, 
    Medal, 
    CheckCircle,
    UserCheck,
    Loader2,
    Settings,
    Edit3
} from "lucide-react";
import { 
    getSportsTeams, 
    getSportsFixtures, 
    getSportsInventory, 
    getSportsMedia,
    createSportsTeam,
    updateMatchResult,
    addSportsMedia
} from "@/actions/sports";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SportsCoachingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("teams");
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState<any[]>([]);
    const [fixtures, setFixtures] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [media, setMedia] = useState<any[]>([]);
    
    // Interactive Modal States
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [showRecordResult, setShowRecordResult] = useState(false);
    const [showAddMedia, setShowAddMedia] = useState(false);
    
    const [submitting, setSubmitting] = useState(false);
    const [selectedFixture, setSelectedFixture] = useState<any>(null);
    
    // Form Inputs
    const [newTeamName, setNewTeamName] = useState("");
    const [newTeamCategory, setNewTeamCategory] = useState("Soccer");
    const [newTeamImg, setNewTeamImg] = useState("");
    
    const [scoreHome, setScoreHome] = useState(0);
    const [scoreAway, setScoreAway] = useState(0);
    
    const [mediaUrl, setMediaUrl] = useState("");
    const [mediaCaption, setMediaCaption] = useState("");

    useEffect(() => {
        if (status === "loading") return;

        if (status === "unauthenticated") {
            toast.error("Please login to access the Sports Coaching suite.");
            router.push("/login?callbackUrl=/staff/sports");
            return;
        }

        const role = (session?.user as any)?.role;
        if (role !== "staff" && role !== "admin" && role !== "superadmin") {
            toast.error("Access Denied: Only coaching staff or administration can access this suite.");
            router.push("/");
            return;
        }

        fetchData();
    }, [session, status, router]);

    async function fetchData() {
        setLoading(true);
        try {
            // unitId 1 is the default seeding node for FSS
            const unitId = 1; 
            const [t, f, i, m] = await Promise.all([
                getSportsTeams(unitId),
                getSportsFixtures(unitId),
                getSportsInventory(unitId),
                getSportsMedia(unitId)
            ]);
            setTeams(t);
            setFixtures(f);
            setInventory(i);
            setMedia(m);
        } catch (error) {
            console.error("Failed to load sports data:", error);
            toast.error("Error loading sports databases.");
        } finally {
            setLoading(false);
        }
    }

    const handleCreateTeamSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;

        setSubmitting(true);
        try {
            const res = await createSportsTeam({
                name: newTeamName,
                category: newTeamCategory,
                imageUrl: newTeamImg || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600",
                unitId: 1,
                coachId: session?.user?.id ? parseInt(session.user.id) : 1
            });

            if (res.success) {
                toast.success("Sports team registered successfully!");
                setShowCreateTeam(false);
                setNewTeamName("");
                setNewTeamImg("");
                fetchData();
            } else {
                toast.error(res.error || "Failed to create team.");
            }
        } catch (e) {
            toast.error("An error occurred.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRecordResultSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFixture) return;

        setSubmitting(true);
        try {
            const res = await updateMatchResult(selectedFixture.id, {
                scoreHome: Number(scoreHome),
                scoreAway: Number(scoreAway)
            });

            if (res.success) {
                toast.success("Match result recorded successfully!");
                setShowRecordResult(false);
                setSelectedFixture(null);
                fetchData();
            } else {
                toast.error(res.error || "Failed to update scores.");
            }
        } catch (e) {
            toast.error("An error occurred.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddMediaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mediaUrl.trim() || !mediaCaption.trim()) return;

        setSubmitting(true);
        try {
            const res = await addSportsMedia({
                url: mediaUrl,
                caption: mediaCaption,
                unitId: 1
            });

            if (res.success) {
                toast.success("Highlight posted to gallery!");
                setShowAddMedia(false);
                setMediaUrl("");
                setMediaCaption("");
                fetchData();
            } else {
                toast.error(res.error || "Failed to add highlight.");
            }
        } catch (e) {
            toast.error("An error occurred.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 bg-slate-50/30 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 flex items-center gap-4 italic tracking-tighter uppercase">
                        <div className="p-3 bg-emerald-600 rounded-[2rem] text-white shadow-xl shadow-emerald-600/10">
                            <Trophy className="w-9 h-9" />
                        </div>
                        Sports Coaching
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 ml-16">
                        Coach & Athletic Directorate Command Center
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                    <Button 
                        onClick={() => setShowCreateTeam(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-6 rounded-2xl shadow-lg shadow-emerald-600/20 text-[10px] tracking-widest uppercase flex gap-2"
                    >
                        <Plus className="w-4 h-4" /> New Team
                    </Button>
                    <Button 
                        onClick={() => setShowAddMedia(true)}
                        variant="outline"
                        className="border-slate-200 hover:bg-slate-100 font-black px-6 py-6 rounded-2xl text-[10px] tracking-widest uppercase flex gap-2"
                    >
                        <ImageIcon className="w-4 h-4" /> Post Highlight
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="teams" onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-auto flex gap-1">
                    <TabsTrigger value="teams" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow font-black uppercase text-[10px] tracking-widest gap-2 text-slate-600">
                        <Users className="w-4 h-4" /> Teams & Rosters
                    </TabsTrigger>
                    <TabsTrigger value="fixtures" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow font-black uppercase text-[10px] tracking-widest gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" /> Fixtures & Results
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow font-black uppercase text-[10px] tracking-widest gap-2 text-slate-600">
                        <Box className="w-4 h-4" /> Equipment Inventory
                    </TabsTrigger>
                    <TabsTrigger value="media" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow font-black uppercase text-[10px] tracking-widest gap-2 text-slate-600">
                        <ImageIcon className="w-4 h-4" /> Gallery
                    </TabsTrigger>
                </TabsList>

                {/* Teams Content */}
                <TabsContent value="teams" className="animate-in fade-in-50 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {teams.length === 0 ? (
                            <Card className="col-span-full border-dashed border-2 bg-slate-50 rounded-[3rem] p-16 flex flex-col items-center text-center space-y-6">
                                <div className="p-4 bg-white rounded-full shadow-md">
                                    <Users className="w-10 h-10 text-slate-300" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight italic">No Athletic Teams Registered</h3>
                                    <p className="text-slate-400 text-xs max-w-xs mx-auto mt-1">Start by registering your firstMonotechnic athletic team.</p>
                                </div>
                                <Button 
                                    onClick={() => setShowCreateTeam(true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] tracking-widest uppercase py-4"
                                >
                                    Register Team
                                </Button>
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
                                                {t.team.category}
                                            </span>
                                            <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{t.team.name}</h3>
                                        </div>
                                    </div>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs">
                                                {t.coach?.name?.[0] || 'C'}
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Assigned Coach</p>
                                                <p className="text-xs font-black text-slate-900">{t.coach?.name || "Unassigned"}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 text-center">
                                            <div className="p-3 border border-slate-100 rounded-xl">
                                                <Users className="w-3.5 h-3.5 mx-auto text-slate-400 mb-1" />
                                                <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Roster</p>
                                                <span className="text-xs font-black text-slate-800">12 Athletes</span>
                                            </div>
                                            <div className="p-3 border border-slate-100 rounded-xl">
                                                <Medal className="w-3.5 h-3.5 mx-auto text-slate-400 mb-1" />
                                                <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Status</p>
                                                <span className="text-xs font-black text-slate-800">Active</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Fixtures Content */}
                <TabsContent value="fixtures" className="animate-in fade-in-50 duration-200">
                    <div className="space-y-4">
                        {fixtures.length === 0 ? (
                            <Card className="border-dashed border-2 bg-slate-50 rounded-[3rem] p-16 flex flex-col items-center text-center space-y-4">
                                <Calendar className="w-10 h-10 text-slate-300" />
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight italic">No Match Fixtures Scheduled</h3>
                                    <p className="text-slate-400 text-xs max-w-xs mx-auto mt-1">Schedule athletic match events in the administration console.</p>
                                </div>
                            </Card>
                        ) : (
                            fixtures.map((f) => (
                                <Card key={f.fixture.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white p-6 hover:shadow transition-shadow">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                        
                                        {/* Home Team */}
                                        <div className="flex-1 flex items-center justify-end gap-4 text-right">
                                            <div>
                                                <h4 className="text-md font-black italic uppercase tracking-tight">{f.team.name}</h4>
                                                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">FSS Squad</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center font-black text-lg text-slate-800 border border-slate-100">
                                                {f.fixture.scoreHome ?? 0}
                                            </div>
                                        </div>

                                        {/* Center VS Status Badge */}
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

                                        {/* Meta and Record Scores Trigger */}
                                        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                                            <div className="flex flex-col gap-1 text-slate-500 flex-1 md:flex-initial">
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

                                            {f.fixture.status !== 'completed' && (
                                                <Button 
                                                    onClick={() => {
                                                        setSelectedFixture(f.fixture);
                                                        setScoreHome(f.fixture.scoreHome || 0);
                                                        setScoreAway(f.fixture.scoreAway || 0);
                                                        setShowRecordResult(true);
                                                    }}
                                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-9 px-4 font-black uppercase text-[8px] tracking-widest"
                                                >
                                                    <Edit3 className="w-3 h-3 mr-1" /> Record Score
                                                </Button>
                                            )}
                                        </div>

                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Inventory Content */}
                <TabsContent value="inventory" className="animate-in fade-in-50 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {inventory.length === 0 ? (
                            <Card className="col-span-full border-dashed border-2 bg-slate-50 rounded-[3rem] p-16 flex flex-col items-center text-center space-y-4">
                                <Box className="w-10 h-10 text-slate-300" />
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight italic">Inventory Empty</h3>
                                    <p className="text-slate-400 text-xs max-w-xs mx-auto mt-1">Equipment listings are managed in the administrator panels.</p>
                                </div>
                            </Card>
                        ) : (
                            inventory.map((item) => (
                                <Card key={item.id} className="border-none shadow-sm rounded-3xl bg-white p-6 hover:shadow transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                            <Box className="w-5 h-5" />
                                        </div>
                                        <span className={cn(
                                            "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                            item.availableQuantity > 5 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                        )}>
                                            {item.availableQuantity > 5 ? "In Stock" : "Low Stock"}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-tight text-slate-800 italic">{item.itemName}</h4>
                                    <div className="mt-4 flex justify-between items-baseline">
                                        <span className="text-2xl font-black text-slate-900">{item.availableQuantity}</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Units Available</span>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Media Gallery Content */}
                <TabsContent value="media" className="animate-in fade-in-50 duration-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {media.map((m) => (
                            <div key={m.id} className="group relative aspect-square rounded-[2rem] overflow-hidden shadow cursor-pointer">
                                <img src={m.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={m.caption} />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                                    <p className="text-white text-[9px] font-black uppercase tracking-widest leading-relaxed">{m.caption}</p>
                                </div>
                            </div>
                        ))}
                        
                        <button 
                            onClick={() => setShowAddMedia(true)}
                            className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400 hover:bg-slate-50 hover:border-emerald-500 hover:text-emerald-600 transition-all"
                        >
                            <Plus className="w-8 h-8" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Add Highlight</span>
                        </button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* MODAL: Register New Team */}
            {showCreateTeam && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border-none shadow-2xl animate-in zoom-in-95 duration-200 bg-white rounded-[2rem] overflow-hidden">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2 text-slate-800">
                                <Trophy className="w-5 h-5 text-emerald-600" /> Register Athletic Team
                            </CardTitle>
                            <CardDescription>Launch a new monotechnic sports team entity.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Team Name</label>
                                    <Input 
                                        required 
                                        placeholder="FSS Ibadan soccer..." 
                                        className="rounded-xl border-slate-200 text-sm font-medium py-6"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Sport Category</label>
                                        <select 
                                            className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                            value={newTeamCategory}
                                            onChange={(e) => setNewTeamCategory(e.target.value)}
                                        >
                                            <option value="Soccer">Soccer</option>
                                            <option value="Basketball">Basketball</option>
                                            <option value="Volleyball">Volleyball</option>
                                            <option value="Table Tennis">Table Tennis</option>
                                            <option value="Athletics">Athletics</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Manager Role</label>
                                        <div className="p-3 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold font-mono">HEAD COACH</div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Banner / Photo Image URL (Optional)</label>
                                    <Input 
                                        placeholder="https://images.unsplash.com/..." 
                                        className="rounded-xl border-slate-200 text-sm font-medium py-6"
                                        value={newTeamImg}
                                        onChange={(e) => setNewTeamImg(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setShowCreateTeam(false)}
                                        className="rounded-xl font-bold uppercase text-[9px] tracking-widest h-12"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-[9px] tracking-widest px-6 h-12 shadow-md shadow-emerald-500/10"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Team"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* MODAL: Record Score Results */}
            {showRecordResult && selectedFixture && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border-none shadow-2xl animate-in zoom-in-95 duration-200 bg-white rounded-[2rem] overflow-hidden">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2 text-slate-800">
                                <Calendar className="w-5 h-5 text-emerald-600" /> Record Match Result
                            </CardTitle>
                            <CardDescription>Enter final scores and finalize fixture status.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleRecordResultSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6 items-center text-center">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Home Score (FSS)</label>
                                        <Input 
                                            type="number" 
                                            min={0}
                                            required 
                                            className="rounded-xl border-slate-200 text-center font-black text-xl py-6"
                                            value={scoreHome}
                                            onChange={(e) => setScoreHome(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Away Score ({selectedFixture.opponent})</label>
                                        <Input 
                                            type="number" 
                                            min={0}
                                            required 
                                            className="rounded-xl border-slate-200 text-center font-black text-xl py-6"
                                            value={scoreAway}
                                            onChange={(e) => setScoreAway(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setShowRecordResult(false)}
                                        className="rounded-xl font-bold uppercase text-[9px] tracking-widest h-12"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase text-[9px] tracking-widest px-6 h-12"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Scores"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* MODAL: Post Highlight to Gallery */}
            {showAddMedia && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md border-none shadow-2xl animate-in zoom-in-95 duration-200 bg-white rounded-[2rem] overflow-hidden">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2 text-slate-800">
                                <ImageIcon className="w-5 h-5 text-emerald-600" /> Post Sports Highlight
                            </CardTitle>
                            <CardDescription>Post an athletic event capture to the campus gallery.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleAddMediaSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Photo Image URL</label>
                                    <Input 
                                        required 
                                        placeholder="https://images.unsplash.com/..." 
                                        className="rounded-xl border-slate-200 text-sm font-medium py-6"
                                        value={mediaUrl}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Highlight Caption</label>
                                    <Input 
                                        required 
                                        placeholder="FSS Track Team securing victory..." 
                                        className="rounded-xl border-slate-200 text-sm font-medium py-6"
                                        value={mediaCaption}
                                        onChange={(e) => setMediaCaption(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setShowAddMedia(false)}
                                        className="rounded-xl font-bold uppercase text-[9px] tracking-widest h-12"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-[9px] tracking-widest px-6 h-12 shadow-md shadow-emerald-500/10"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Highlight"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
