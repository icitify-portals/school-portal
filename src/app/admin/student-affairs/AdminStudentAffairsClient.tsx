"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Users, 
  Megaphone, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  DollarSign, 
  Download, 
  Filter, 
  User, 
  Clock, 
  MapPin, 
  Sparkles,
  Search,
  BookOpen,
  QrCode,
  AlertCircle
} from "lucide-react";
import { 
  createEventAction, 
  approveClubAction, 
  createBulletinAction, 
  publishBulletinAction, 
  getAttendeeRosterAction,
  verifyTicketAndCheckInAction
} from "@/actions/student-affairs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { cn } from "@/lib/utils";

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity: number | null;
  isPaid: boolean;
  fee: string | null;
  status: string;
  createdAt: string | null;
  creatorName: string;
  registeredCount: number;
}

interface Club {
  id: number;
  name: string;
  description: string;
  category: string;
  logoUrl: string | null;
  status: string;
  createdAt: string | null;
  presidentId: number;
  presidentName: string;
  advisorId: number | null;
  advisorName: string | null;
}

interface Bulletin {
  id: number;
  title: string;
  content: string;
  category: string;
  status: string;
  publishedAt: string | null;
  createdAt: string | null;
  authorName: string;
}

interface AdminStudentAffairsClientProps {
  stats: {
    totalOrganizations: number;
    activeMembers: number;
    scheduledEvents: number;
    totalRevenue: number;
  };
  events: Event[];
  clubs: Club[];
  bulletins: Bulletin[];
}

export default function AdminStudentAffairsClient({
  stats,
  events,
  clubs,
  bulletins
}: AdminStudentAffairsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'events' | 'clubs' | 'bulletins'>('events');
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Scanner Dialog State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "manual">("manual");
  const [manualCode, setManualCode] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    error?: string;
    attendee?: { name: string; email: string; title: string };
    alreadyCheckedIn?: boolean;
  } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Webcam scanner useEffect
  useEffect(() => {
    if (isScannerOpen && scanMode === "camera") {
      const timer = setTimeout(() => {
        try {
          const html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;

          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              handleCheckIn(decodedText);
            },
            () => {
              // noise
            }
          ).catch(err => {
            console.error("Scanner start error:", err);
            toast.error("Camera access failed or not supported.");
          });
        } catch (e) {
          console.error("Failed to initialize scanner:", e);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          const scanner = scannerRef.current;
          if (scanner.isScanning) {
            scanner.stop()
              .then(() => {
                scanner.clear();
                scannerRef.current = null;
              })
              .catch(e => console.error("Error stopping scanner:", e));
          } else {
            scannerRef.current = null;
          }
        }
      };
    }
  }, [isScannerOpen, scanMode]);

  const handleCheckIn = async (code: string) => {
    if (!code || scanLoading) return;
    setScanLoading(true);
    setScanResult(null);
    try {
      const res = await verifyTicketAndCheckInAction(code);
      if (res.success) {
        setScanResult({
          success: true,
          attendee: res.attendee
        });
        toast.success(`Checked in successfully: ${res.attendee?.name}`);
        setManualCode("");
        router.refresh();
      } else {
        setScanResult({
          success: false,
          error: res.error,
          alreadyCheckedIn: (res as any).alreadyCheckedIn,
          attendee: (res as any).attendee
        });
        toast.error(res.error || "Verification failed");
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        error: err.message || "An unexpected error occurred"
      });
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setScanLoading(false);
    }
  };

  const handleManualCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheckIn(manualCode);
  };

  // Form States
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventCapacity, setEventCapacity] = useState("");
  const [eventIsPaid, setEventIsPaid] = useState(false);
  const [eventFee, setEventFee] = useState("");
  const [eventLoading, setEventLoading] = useState(false);

  const [isNewBulletinOpen, setIsNewBulletinOpen] = useState(false);
  const [bulletinTitle, setBulletinTitle] = useState("");
  const [bulletinContent, setBulletinContent] = useState("");
  const [bulletinCategory, setBulletinCategory] = useState<'academic' | 'social' | 'sports' | 'announcement'>('announcement');
  const [bulletinStatus, setBulletinStatus] = useState<'draft' | 'published'>('published');
  const [bulletinLoading, setBulletinLoading] = useState(false);

  // Roster States
  const [rosterEvent, setRosterEvent] = useState<Event | null>(null);
  const [rosterAttendees, setRosterAttendees] = useState<any[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterSearch, setRosterSearch] = useState("");

  const pendingClubs = clubs.filter(c => c.status === 'pending');
  const approvedClubs = clubs.filter(c => c.status === 'approved');

  // Handle Event Creation
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDesc || !eventLocation || !eventStart || !eventEnd) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setEventLoading(true);

    try {
      const res = await createEventAction({
        title: eventTitle,
        description: eventDesc,
        location: eventLocation,
        startDate: eventStart,
        endDate: eventEnd,
        capacity: eventCapacity ? parseInt(eventCapacity) : undefined,
        isPaid: eventIsPaid,
        fee: eventIsPaid && eventFee ? parseFloat(eventFee) : undefined
      });

      if (res.success) {
        toast.success("Event scheduled successfully!");
        setEventTitle("");
        setEventDesc("");
        setEventLocation("");
        setEventStart("");
        setEventEnd("");
        setEventCapacity("");
        setEventIsPaid(false);
        setEventFee("");
        setIsNewEventOpen(false);
        router.refresh();
      } else {
        toast.error((res as any).error || "Failed to create event");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setEventLoading(false);
    }
  };

  // Handle Club Approvals
  const handleClubApproval = async (clubId: number, approve: boolean) => {
    setLoadingId(clubId);
    try {
      const res = await approveClubAction(clubId, approve);
      if (res.success) {
        toast.success(approve ? "Club approved successfully!" : "Club proposal rejected.");
        router.refresh();
      } else {
        toast.error((res as any).error || "Failed to update club proposal status");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoadingId(null);
    }
  };

  // Handle Bulletin Creation
  const handleCreateBulletin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulletinTitle || !bulletinContent) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setBulletinLoading(true);

    try {
      const res = await createBulletinAction({
        title: bulletinTitle,
        content: bulletinContent,
        category: bulletinCategory,
        status: bulletinStatus
      });

      if (res.success) {
        toast.success(bulletinStatus === 'published' ? "Announcement published!" : "Draft saved successfully.");
        setBulletinTitle("");
        setBulletinContent("");
        setBulletinCategory('announcement');
        setBulletinStatus('published');
        setIsNewBulletinOpen(false);
        router.refresh();
      } else {
        toast.error((res as any).error || "Failed to save announcement");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setBulletinLoading(false);
    }
  };

  // Handle Publishing a Draft Bulletin
  const handlePublishBulletin = async (bulletinId: number) => {
    setLoadingId(bulletinId);
    try {
      const res = await publishBulletinAction(bulletinId);
      if (res.success) {
        toast.success("Draft published successfully!");
        router.refresh();
      } else {
        toast.error((res as any).error || "Failed to publish bulletin");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoadingId(null);
    }
  };

  // Open Attendee Manifest Roster
  const handleOpenRoster = async (event: Event) => {
    setRosterEvent(event);
    setRosterLoading(true);
    try {
      const res = await getAttendeeRosterAction(event.id);
      if (res.success && res.roster) {
        setRosterAttendees(res.roster);
      } else {
        toast.error(res.error || "Failed to retrieve attendee roster");
        setRosterEvent(null);
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred fetching rosters");
      setRosterEvent(null);
    } finally {
      setRosterLoading(false);
    }
  };

  // Export attendee roster to CSV
  const handleExportCSV = () => {
    if (!rosterEvent || rosterAttendees.length === 0) return;

    const headers = ["Name", "Email", "Phone", "Matric/Staff ID", "Academic Programme", "Registration Date", "Payment Status"];
    const rows = rosterAttendees.map(r => [
      r.name,
      r.email,
      r.phone || "",
      r.matricNumber || r.admissionNumber || "Staff",
      r.programmeName || "Staff/Officer",
      new Date(r.registeredAt).toLocaleDateString(),
      r.paymentStatus
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${rosterEvent.title.toLowerCase().replace(/\s+/g, '_')}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Roster exported successfully!");
  };

  // Group Roster by Academic Programme
  const filteredRoster = rosterAttendees.filter(r => 
    r.name.toLowerCase().includes(rosterSearch.toLowerCase()) || 
    (r.programmeName && r.programmeName.toLowerCase().includes(rosterSearch.toLowerCase())) ||
    (r.matricNumber && r.matricNumber.toLowerCase().includes(rosterSearch.toLowerCase()))
  );

  const groupedRoster = filteredRoster.reduce((acc: Record<string, any[]>, attendee) => {
    const prog = attendee.programmeName || "Staff / General Users";
    if (!acc[prog]) acc[prog] = [];
    acc[prog].push(attendee);
    return acc;
  }, {} as Record<string, any[]>);

  const formatEventDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(dateStr));
  };

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic">
            <Users className="w-10 h-10 text-indigo-600" />
            Student Affairs Administration
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Configure events, approve organization applications, and issue school bulletins</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button 
            onClick={() => setIsScannerOpen(true)}
            className="bg-indigo-600 hover:bg-black text-white px-6 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 transition-all flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Check-In Scanner
          </Button>

          <Button 
            onClick={() => setIsNewEventOpen(true)}
            className="bg-slate-900 hover:bg-indigo-600 text-white px-6 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Event
          </Button>

          <Button 
            onClick={() => setIsNewBulletinOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Bulletin
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl rounded-2xl bg-indigo-600 text-white p-8 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Scheduled Events</p>
          <h3 className="text-4xl font-black italic">{stats.scheduledEvents}</h3>
          <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest italic">Upcoming checkouts open</p>
        </Card>

        <Card className="border-none shadow-xl rounded-2xl bg-white p-8 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Organizations</p>
          <h3 className="text-4xl font-black italic text-slate-900">{stats.totalOrganizations}</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{pendingClubs.length} proposals pending</p>
        </Card>

        <Card className="border-none shadow-xl rounded-2xl bg-white p-8 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Club Members</p>
          <h3 className="text-4xl font-black italic text-emerald-600">{stats.activeMembers}</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Student rosters synced</p>
        </Card>

        <Card className="border-none shadow-xl rounded-2xl bg-white p-8 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Event Revenues</p>
          <h3 className="text-4xl font-black italic text-amber-600">₦{stats.totalRevenue.toLocaleString()}</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Settled registrations outlay</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events" className="space-y-6" onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className="bg-white p-1 rounded-2xl shadow-lg border-none h-14 w-full md:w-auto">
          <TabsTrigger value="events" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Events & Rosters</TabsTrigger>
          <TabsTrigger value="clubs" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            Organizations Proposal
            {pendingClubs.length > 0 && (
              <Badge className="ml-2 bg-rose-500 text-white border-none text-[8px] font-black px-1.5 py-0.5 rounded-full">
                {pendingClubs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bulletins" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Bulletins Log</TabsTrigger>
        </TabsList>

        {/* EVENTS TAB CONTENT */}
        <TabsContent value="events">
          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                    <th className="px-8 py-5">Event</th>
                    <th className="px-6 py-5">Location</th>
                    <th className="px-6 py-5">Schedule</th>
                    <th className="px-6 py-5">Type / Price</th>
                    <th className="px-6 py-5">Attendees</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-16 text-center text-slate-400 font-medium text-sm">No events scheduled. Create one above to begin.</td>
                    </tr>
                  ) : (
                    events.map((event) => (
                      <tr key={event.id} className="border-b border-slate-50 text-slate-600 text-sm hover:bg-slate-50/30 transition-all">
                        <td className="px-8 py-6 font-black text-slate-900 uppercase italic max-w-xs truncate">{event.title}</td>
                        <td className="px-6 py-6 font-medium">{event.location}</td>
                        <td className="px-6 py-6 font-medium text-slate-400">{formatEventDate(event.startDate)}</td>
                        <td className="px-6 py-6">
                          {event.isPaid ? (
                            <Badge className="bg-amber-50 text-amber-600 border-none font-black px-3 py-1 rounded-full text-[8px] italic">
                              ₦{Number(event.fee).toLocaleString()}
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-black px-3 py-1 rounded-full text-[8px]">
                              Free
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-6 font-black text-indigo-600">
                          {event.registeredCount} {event.capacity ? `/ ${event.capacity}` : ""} Registered
                        </td>
                        <td className="px-8 py-6 text-right">
                          <Button
                            onClick={() => handleOpenRoster(event)}
                            className="bg-indigo-600 hover:bg-black text-white h-8 rounded-xl font-black uppercase tracking-widest text-[8px] px-3 shadow-md shadow-indigo-100"
                          >
                            View Roster
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ORGANIZATIONS TAB CONTENT */}
        <TabsContent value="clubs" className="space-y-8">
          {/* Pending Proposals Queue */}
          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black uppercase italic tracking-tight text-slate-900">Pending Organization Requests</CardTitle>
              <CardDescription className="font-medium text-slate-400 text-xs">New club proposals requiring administrative clearance.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                      <th className="px-8 py-5">Proposed Name</th>
                      <th className="px-6 py-5">Category</th>
                      <th className="px-6 py-5">Proposed President</th>
                      <th className="px-6 py-5">Mandate Description</th>
                      <th className="px-8 py-5 text-right">Clearance Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingClubs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 font-medium text-sm">No pending organization proposals.</td>
                      </tr>
                    ) : (
                      pendingClubs.map((club) => (
                        <tr key={club.id} className="border-b border-slate-50 text-slate-600 text-sm hover:bg-slate-50/30">
                          <td className="px-8 py-6 font-black text-slate-900 uppercase italic">{club.name}</td>
                          <td className="px-6 py-6"><Badge className="bg-indigo-50 text-indigo-600 border-none font-bold uppercase text-[8px]">{club.category}</Badge></td>
                          <td className="px-6 py-6 font-medium text-slate-400">{club.presidentName}</td>
                          <td className="px-6 py-6 max-w-sm font-medium line-clamp-2 truncate">{club.description}</td>
                          <td className="px-8 py-6 text-right space-x-2">
                            <Button
                              onClick={() => handleClubApproval(club.id, true)}
                              disabled={loadingId === club.id}
                              className="bg-indigo-600 hover:bg-black text-white h-8 rounded-xl font-black uppercase tracking-widest text-[8px] px-3 shadow-md shadow-indigo-100"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleClubApproval(club.id, false)}
                              disabled={loadingId === club.id}
                              variant="ghost"
                              className="h-8 text-rose-500 hover:text-rose-700 font-black uppercase tracking-widest text-[8px] px-3"
                            >
                              Reject
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Approved Clubs List */}
          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black uppercase italic tracking-tight text-slate-900">Approved Campus Organizations</CardTitle>
              <CardDescription className="font-medium text-slate-400 text-xs">Clubs currently registered and operational on campus.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                      <th className="px-8 py-5">Name</th>
                      <th className="px-6 py-5">Category</th>
                      <th className="px-6 py-5">President</th>
                      <th className="px-6 py-5">Advisor</th>
                      <th className="px-8 py-5 text-right">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedClubs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 font-medium text-sm">No approved organizations found.</td>
                      </tr>
                    ) : (
                      approvedClubs.map((club) => (
                        <tr key={club.id} className="border-b border-slate-50 text-slate-600 text-sm hover:bg-slate-50/30">
                          <td className="px-8 py-6 font-black text-slate-900 uppercase italic">{club.name}</td>
                          <td className="px-6 py-6"><Badge className="bg-indigo-50 text-indigo-600 border-none font-bold uppercase text-[8px]">{club.category}</Badge></td>
                          <td className="px-6 py-6 font-medium text-slate-400">{club.presidentName}</td>
                          <td className="px-6 py-6 font-medium">{club.advisorName || "None Assigned"}</td>
                          <td className="px-8 py-6 text-right font-medium text-slate-400">
                            {club.createdAt ? new Date(club.createdAt).toLocaleDateString() : ""}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BULLETINS TAB CONTENT */}
        <TabsContent value="bulletins">
          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                    <th className="px-8 py-5">Title</th>
                    <th className="px-6 py-5">Category</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Author</th>
                    <th className="px-6 py-5">Published Date</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bulletins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-16 text-center text-slate-400 font-medium text-sm">No bulletins recorded. Create one above to publish.</td>
                    </tr>
                  ) : (
                    bulletins.map((blt) => (
                      <tr key={blt.id} className="border-b border-slate-50 text-slate-600 text-sm hover:bg-slate-50/30">
                        <td className="px-8 py-6 font-black text-slate-900 uppercase italic max-w-sm truncate">{blt.title}</td>
                        <td className="px-6 py-6">
                          <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold uppercase text-[8px]">
                            {blt.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-6">
                          {blt.status === 'published' ? (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-black uppercase text-[8px] italic">Published</Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-400 border-none font-black uppercase text-[8px]">Draft</Badge>
                          )}
                        </td>
                        <td className="px-6 py-6 font-medium text-slate-400">{blt.authorName}</td>
                        <td className="px-6 py-6 font-medium">
                          {blt.publishedAt ? new Date(blt.publishedAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-8 py-6 text-right">
                          {blt.status === 'draft' && (
                            <Button
                              onClick={() => handlePublishBulletin(blt.id)}
                              disabled={loadingId === blt.id}
                              className="bg-indigo-600 hover:bg-black text-white h-8 rounded-xl font-black uppercase tracking-widest text-[8px] px-3 shadow-md shadow-indigo-100"
                            >
                              {loadingId === blt.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Publish"
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Event Proposal Modal */}
      <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
        <DialogContent className="border-none shadow-2xl rounded-[2.5rem] bg-white max-w-md p-8">
          <DialogHeader className="text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-slate-900">
              Schedule Event
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-xs">
              Configure a new campus event or seminar program.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvent} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Event Title</label>
              <Input 
                value={eventTitle} 
                onChange={(e) => setEventTitle(e.target.value)} 
                placeholder="e.g. Annual Tech Symposium" 
                className="rounded-xl border-slate-200 h-11 text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Venue Location</label>
              <Input 
                value={eventLocation} 
                onChange={(e) => setEventLocation(e.target.value)} 
                placeholder="e.g. Main Auditorium" 
                className="rounded-xl border-slate-200 h-11 text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Start Date/Time</label>
                <Input 
                  type="datetime-local"
                  value={eventStart} 
                  onChange={(e) => setEventStart(e.target.value)} 
                  className="rounded-xl border-slate-200 h-11 text-sm font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">End Date/Time</label>
                <Input 
                  type="datetime-local"
                  value={eventEnd} 
                  onChange={(e) => setEventEnd(e.target.value)} 
                  className="rounded-xl border-slate-200 h-11 text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Capacity Limit</label>
                <Input 
                  type="number"
                  value={eventCapacity} 
                  onChange={(e) => setEventCapacity(e.target.value)} 
                  placeholder="No Limit"
                  className="rounded-xl border-slate-200 h-11 text-sm font-medium"
                />
              </div>
              <div className="space-y-1 flex flex-col justify-end pb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPaid"
                    checked={eventIsPaid}
                    onChange={(e) => setEventIsPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-200 focus:ring-indigo-500"
                  />
                  <label htmlFor="isPaid" className="text-xs font-black uppercase tracking-widest text-slate-600 select-none">Paid Ticket</label>
                </div>
              </div>
            </div>

            {eventIsPaid && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Ticket Price (₦)</label>
                <Input 
                  type="number"
                  value={eventFee} 
                  onChange={(e) => setEventFee(e.target.value)} 
                  placeholder="Amount in Naira" 
                  className="rounded-xl border-slate-200 h-11 text-sm font-medium"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Event Description</label>
              <Textarea 
                value={eventDesc} 
                onChange={(e) => setEventDesc(e.target.value)} 
                placeholder="Give details about key speakers, topic tracks..."
                className="rounded-xl border-slate-200 min-h-20 text-sm font-medium leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-4 flex sm:flex-col gap-2">
              <Button
                type="submit"
                disabled={eventLoading}
                className="w-full bg-indigo-600 hover:bg-black text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
              >
                {eventLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Schedule Event"
                )}
              </Button>
              <Button
                type="button"
                onClick={() => setIsNewEventOpen(false)}
                variant="ghost"
                className="w-full font-black uppercase tracking-widest text-[10px] text-slate-400"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Bulletin Modal */}
      <Dialog open={isNewBulletinOpen} onOpenChange={setIsNewBulletinOpen}>
        <DialogContent className="border-none shadow-2xl rounded-[2.5rem] bg-white max-w-md p-8">
          <DialogHeader className="text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <Megaphone className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-slate-900">
              Create Bulletin
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-xs">
              Draft or publish a school announcement to the community.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBulletin} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Title</label>
              <Input 
                value={bulletinTitle} 
                onChange={(e) => setBulletinTitle(e.target.value)} 
                placeholder="e.g. Matriculation Ceremony Updates" 
                className="rounded-xl border-slate-200 h-11 text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Category</label>
                <select 
                  value={bulletinCategory} 
                  onChange={(e) => setBulletinCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white h-11 text-sm px-3 font-medium outline-none focus:border-indigo-600"
                >
                  <option value="announcement">Announcement</option>
                  <option value="academic">Academic</option>
                  <option value="social">Social</option>
                  <option value="sports">Sports</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Status</label>
                <select 
                  value={bulletinStatus} 
                  onChange={(e) => setBulletinStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white h-11 text-sm px-3 font-medium outline-none focus:border-indigo-600"
                >
                  <option value="published">Publish Now</option>
                  <option value="draft">Save as Draft</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Content</label>
              <Textarea 
                value={bulletinContent} 
                onChange={(e) => setBulletinContent(e.target.value)} 
                placeholder="Write the full announcement detail..."
                className="rounded-xl border-slate-200 min-h-28 text-sm font-medium leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-4 flex sm:flex-col gap-2">
              <Button
                type="submit"
                disabled={bulletinLoading}
                className="w-full bg-indigo-600 hover:bg-black text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
              >
                {bulletinLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  bulletinStatus === 'published' ? "Publish Announcement" : "Save Draft"
                )}
              </Button>
              <Button
                type="button"
                onClick={() => setIsNewBulletinOpen(false)}
                variant="ghost"
                className="w-full font-black uppercase tracking-widest text-[10px] text-slate-400"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attendee Manifest Roster Dialog (Grouped by Programme) */}
      <Dialog open={!!rosterEvent} onOpenChange={(open) => !open && setRosterEvent(null)}>
        <DialogContent className="border-none shadow-2xl rounded-[3rem] bg-white max-w-4xl p-8 max-h-[85vh] flex flex-col">
          <DialogHeader className="space-y-3 shrink-0">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1 text-left">
                <Badge className="bg-indigo-50 text-indigo-600 border-none font-black uppercase text-[8px] tracking-widest italic mb-1">
                  Attendee Manifest
                </Badge>
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-slate-900">
                  {rosterEvent && rosterEvent.title}
                </DialogTitle>
                <DialogDescription className="text-slate-400 font-medium text-xs">
                  Review registrations grouped by academic programmes.
                </DialogDescription>
              </div>
              
              {rosterAttendees.length > 0 && (
                <Button
                  onClick={handleExportCSV}
                  className="bg-indigo-600 hover:bg-black text-white h-10 rounded-xl font-black uppercase tracking-widest text-[9px] px-4 shadow-md shadow-indigo-100 transition-all flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </Button>
              )}
            </div>

            {/* Filter Search */}
            <div className="relative pt-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-5" />
              <Input
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Filter by attendee name, matric number, or programme..."
                className="pl-10 rounded-xl border-slate-200 h-10 text-xs font-medium"
              />
            </div>
          </DialogHeader>

          {/* Roster Listing Container */}
          <div className="flex-1 overflow-y-auto min-h-64 py-4 space-y-6">
            {rosterLoading ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading registration roster...</p>
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="text-center p-16 space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-black uppercase italic text-slate-500">No attendees match filters</p>
                <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">There are no registrations corresponding to the search parameter.</p>
              </div>
            ) : (
              Object.entries(groupedRoster).map(([programmeName, list]) => (
                <div key={programmeName} className="space-y-3">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 italic">
                      {programmeName} <span className="text-[10px] font-bold text-slate-400 lowercase italic ml-1">({list.length} registered)</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {list.map((attendee) => (
                      <div key={attendee.registrationId} className="p-4 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs bg-slate-50/20 hover:bg-slate-50 transition-all">
                        <div className="space-y-1">
                          <p className="font-black text-slate-950 uppercase italic">{attendee.name}</p>
                          <p className="font-bold text-slate-400 uppercase tracking-tight text-[10px]">
                            {attendee.matricNumber || attendee.admissionNumber || "Staff Member"}
                          </p>
                          <p className="text-[9px] font-medium text-slate-400">{attendee.email}</p>
                        </div>
                        <div className="text-right space-y-1">
                          {attendee.paymentStatus === 'paid' && (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-black uppercase text-[8px] italic">Paid</Badge>
                          )}
                          {attendee.paymentStatus === 'pending' && (
                            <Badge className="bg-amber-50 text-amber-600 border-none font-black uppercase text-[8px] italic">Pending</Badge>
                          )}
                          {attendee.paymentStatus === 'no_payment_required' && (
                            <Badge className="bg-slate-100 text-slate-500 border-none font-black uppercase text-[8px]">Free</Badge>
                          )}
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                            {new Date(attendee.registeredAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 shrink-0">
            <Button
              onClick={() => setRosterEvent(null)}
              variant="ghost"
              className="w-full font-black uppercase tracking-widest text-[10px] text-indigo-600 hover:text-slate-950"
            >
              Close Manifest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-In Scan Dialog */}
      <Dialog open={isScannerOpen} onOpenChange={(open) => {
        setIsScannerOpen(open);
        if (!open) {
          setScanResult(null);
          setManualCode("");
        }
      }}>
        <DialogContent className="border-none shadow-2xl rounded-[3rem] bg-white max-w-lg p-8 max-h-[90vh] flex flex-col">
          <DialogHeader className="text-center space-y-3 shrink-0">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-slate-900">
              Check-In Scanner
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-xs">
              Scan event ticket QR codes or type ticket codes manually for verification.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
              <Button
                onClick={() => setScanMode("camera")}
                type="button"
                className={cn(
                  "flex-1 gap-2 font-black uppercase text-[10px] tracking-widest h-11 rounded-xl transition-all",
                  scanMode === "camera" ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "bg-transparent text-slate-500 hover:bg-slate-200 shadow-none border-none"
                )}
              >
                Camera Scanner
              </Button>
              <Button
                onClick={() => setScanMode("manual")}
                type="button"
                className={cn(
                  "flex-1 gap-2 font-black uppercase text-[10px] tracking-widest h-11 rounded-xl transition-all",
                  scanMode === "manual" ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "bg-transparent text-slate-500 hover:bg-slate-200 shadow-none border-none"
                )}
              >
                Manual Verification
              </Button>
            </div>

            {scanMode === "camera" ? (
              <div className="space-y-4">
                <div id="reader" className="overflow-hidden rounded-2xl border-4 border-slate-100 bg-slate-50 aspect-video relative" />
                <p className="text-center text-[10px] font-bold text-slate-400 uppercase italic">
                  Align candidate ticket QR Code inside the camera frame
                </p>
              </div>
            ) : (
              <form onSubmit={handleManualCheckInSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Ticket verification code</label>
                  <div className="relative">
                    <Input 
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="e.g. ev_tkt:12:3"
                      className="rounded-xl border-slate-200 h-11 text-sm font-medium pr-10"
                      autoFocus
                    />
                    {scanLoading && (
                      <div className="absolute right-3 top-3">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={scanLoading || !manualCode}
                  className="w-full bg-indigo-600 hover:bg-black text-white h-11 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-100"
                >
                  Verify Ticket
                </Button>
              </form>
            )}

            {scanResult && (
              <div className={cn(
                "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                scanResult.success ? "bg-emerald-50/50 border-emerald-100 text-emerald-900" : "bg-rose-50/50 border-rose-100 text-rose-950"
              )}>
                {scanResult.success ? (
                  <>
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                    <div className="text-center space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Verification Success</p>
                      <p className="text-lg font-black uppercase italic leading-tight">{scanResult.attendee?.name}</p>
                      <p className="text-[10px] font-bold text-slate-500">{scanResult.attendee?.email}</p>
                      <div className="pt-2 border-t border-slate-200 mt-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">REGISTERED FOR</p>
                        <p className="text-xs font-bold text-indigo-600 uppercase italic">{scanResult.attendee?.title}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-10 h-10 text-rose-600" />
                    <div className="text-center space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-rose-600">Verification Failure</p>
                      <p className="text-sm font-bold text-rose-900 leading-tight">{scanResult.error}</p>
                      {scanResult.alreadyCheckedIn && scanResult.attendee && (
                        <div className="pt-2 border-t border-slate-200 mt-2">
                          <p className="text-xs font-black uppercase italic text-slate-900 leading-tight">{scanResult.attendee.name}</p>
                          <p className="text-[10px] font-bold text-slate-500">{scanResult.attendee.email}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">EVENT</p>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase italic">{scanResult.attendee.title}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 shrink-0">
            <Button
              onClick={() => {
                setIsScannerOpen(false);
                setScanResult(null);
                setManualCode("");
              }}
              variant="ghost"
              className="w-full font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900"
            >
              Done Scanning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
