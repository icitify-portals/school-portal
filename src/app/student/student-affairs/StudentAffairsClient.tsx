"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Calendar, 
  Users, 
  Megaphone, 
  Plus, 
  CheckCircle, 
  Clock, 
  MapPin, 
  UserCheck, 
  AlertCircle,
  FileText,
  Loader2,
  Settings,
  CreditCard,
  XCircle,
  Activity,
  QrCode
} from "lucide-react";
import { 
  createClubAction, 
  joinClubRequestAction, 
  approveClubMemberAction, 
  cancelRegistrationAction,
  confirmEventPaymentAction,
  generateEventTicketQRAction
} from "@/actions/student-affairs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface StudentAffairsClientProps {
  session: any;
  registeredEvents: any[];
  bulletins: any[];
  allClubs: any[];
  userClubs: any[];
  pendingMembersToApprove: any[]; // Combined pending requests for clubs where this user is president
}

export default function StudentAffairsClient({
  session,
  registeredEvents,
  bulletins,
  allClubs,
  userClubs,
  pendingMembersToApprove
}: StudentAffairsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'events' | 'clubs' | 'bulletins'>('events');
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Club Registration Dialog State
  const [isRegisterClubOpen, setIsRegisterClubOpen] = useState(false);
  const [clubName, setClubName] = useState("");
  const [clubDesc, setClubDesc] = useState("");
  const [clubCategory, setClubCategory] = useState("Academic");
  const [registerLoading, setRegisterLoading] = useState(false);

  // Checkout Dialog State
  const [checkoutReg, setCheckoutReg] = useState<any | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<'remita' | 'paystack' | 'flutterwave'>('remita');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Ticket QR Dialog State
  const [ticketReg, setTicketReg] = useState<any | null>(null);
  const [ticketQrUrl, setTicketQrUrl] = useState<string | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  // Filter out clubs that student is already a member/pending of
  const userClubIds = new Set(userClubs.map(c => c.clubId));
  const joinableClubs = allClubs.filter(c => !userClubIds.has(c.id) && c.status === 'approved');

  // Handle Cancel registration
  const handleCancel = async (regId: number) => {
    setLoadingId(regId);
    try {
      const res = await cancelRegistrationAction(regId);
      if (res.success) {
        toast.success("Registration cancelled successfully.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to cancel registration");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoadingId(null);
    }
  };

  // Handle Join club request
  const handleJoinClub = async (clubId: number) => {
    setLoadingId(clubId);
    try {
      const res = await joinClubRequestAction(clubId);
      if (res.success) {
        toast.success("Membership request submitted. Pending president/officer approval.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to request membership");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoadingId(null);
    }
  };

  // Handle Club member approval/rejection (as president)
  const handleMemberApproval = async (memberId: number, approve: boolean) => {
    setLoadingId(memberId);
    try {
      const res = await approveClubMemberAction(memberId, approve);
      if (res.success) {
        toast.success(approve ? "Member approved successfully!" : "Request rejected.");
        router.refresh();
      } else {
        toast.error((res as any).error || "Action failed");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoadingId(null);
    }
  };

  // Handle registering a new club
  const handleRegisterClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName || !clubDesc) {
      toast.error("Please fill in all fields.");
      return;
    }
    setRegisterLoading(true);

    try {
      const res = await createClubAction({
        name: clubName,
        description: clubDesc,
        category: clubCategory
      });

      if (res.success) {
        toast.success("Club registration submitted successfully! Pending admin approval.");
        setClubName("");
        setClubDesc("");
        setIsRegisterClubOpen(false);
        router.refresh();
      } else {
        toast.error((res as any).error || "Failed to register club");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setRegisterLoading(false);
    }
  };

  // Process checkout/payment for registered event
  const handleProcessPayment = async () => {
    if (!checkoutReg) return;
    setPaymentLoading(true);

    try {
      const payRes = await confirmEventPaymentAction(checkoutReg.transactionId);
      if (payRes.success) {
        toast.success(`Payment successful! You are now fully registered.`);
        setCheckoutReg(null);
        router.refresh();
      } else {
        toast.error("Payment confirmation failed. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleOpenTicket = async (reg: any) => {
    setTicketReg(reg);
    setTicketLoading(true);
    try {
      const res = await generateEventTicketQRAction(reg.id);
      if (res.success && res.qrDataUrl) {
        setTicketQrUrl(res.qrDataUrl);
      } else {
        toast.error((res as any).error || "Failed to generate ticket QR Code");
        setTicketReg(null);
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
      setTicketReg(null);
    } finally {
      setTicketLoading(false);
    }
  };

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
            <Activity className="w-10 h-10 text-indigo-600 animate-pulse" />
            Student Affairs Center
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your event checkouts, join organizations, and stay informed</p>
        </div>

        <Button 
          onClick={() => setIsRegisterClubOpen(true)}
          className="bg-indigo-600 hover:bg-black text-white px-6 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Register New Club
        </Button>
      </div>

      {/* Navigation tabs & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-4">
          <button
            onClick={() => setActiveTab('events')}
            className={cn(
              "w-full p-6 rounded-2xl text-left transition-all flex items-center gap-4 group",
              activeTab === 'events' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100/50"
            )}
          >
            <Calendar className={cn("w-6 h-6", activeTab === 'events' ? "text-white" : "text-slate-300 group-hover:text-indigo-400")} />
            <div className="text-left">
              <span className="font-black uppercase italic tracking-tight text-sm block">My Events</span>
              <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest">{registeredEvents.length} registrations</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('clubs')}
            className={cn(
              "w-full p-6 rounded-2xl text-left transition-all flex items-center gap-4 group",
              activeTab === 'clubs' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100/50"
            )}
          >
            <Users className={cn("w-6 h-6", activeTab === 'clubs' ? "text-white" : "text-slate-300 group-hover:text-indigo-400")} />
            <div className="text-left">
              <span className="font-black uppercase italic tracking-tight text-sm block">Clubs & Societies</span>
              <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest">{userClubs.length} joined</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('bulletins')}
            className={cn(
              "w-full p-6 rounded-2xl text-left transition-all flex items-center gap-4 group",
              activeTab === 'bulletins' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100/50"
            )}
          >
            <Megaphone className={cn("w-6 h-6", activeTab === 'bulletins' ? "text-white" : "text-slate-300 group-hover:text-indigo-400")} />
            <div className="text-left">
              <span className="font-black uppercase italic tracking-tight text-sm block">School Bulletins</span>
              <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest">{bulletins.length} announcements</span>
            </div>
          </button>
        </div>

        {/* Tab contents */}
        <div className="lg:col-span-3 space-y-8">
          {/* EVENTS TAB */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black uppercase italic tracking-tight text-slate-900">Registered Events</CardTitle>
                  <CardDescription className="font-medium text-slate-400 text-xs">Events you have signed up for on the portal.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {registeredEvents.length === 0 ? (
                    <div className="p-16 text-center space-y-4">
                      <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">You have not registered for any events yet.</p>
                      <Button asChild className="rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[9px] h-9">
                        <a href="/events">Browse Events</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                            <th className="px-8 py-5">Event Title</th>
                            <th className="px-6 py-5">Date & Time</th>
                            <th className="px-6 py-5">Location</th>
                            <th className="px-6 py-5">Payment Status</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registeredEvents.map((reg) => (
                            <tr key={reg.id} className="border-b border-slate-50 text-slate-600 text-sm hover:bg-slate-50/30 transition-all">
                              <td className="px-8 py-6 font-black text-slate-900 uppercase italic max-w-xs truncate">{reg.title}</td>
                              <td className="px-6 py-6 font-medium text-slate-400">{formatEventDate(reg.startDate)}</td>
                              <td className="px-6 py-6 font-medium">{reg.location}</td>
                              <td className="px-6 py-6">
                                {reg.paymentStatus === 'paid' && (
                                  <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 rounded-full font-black uppercase text-[8px] italic">
                                    Paid
                                  </Badge>
                                )}
                                {reg.paymentStatus === 'pending' && (
                                  <Badge className="bg-amber-50 text-amber-600 border-none px-3 py-1 rounded-full font-black uppercase text-[8px] italic">
                                    Pending Checkout
                                  </Badge>
                                )}
                                {reg.paymentStatus === 'no_payment_required' && (
                                  <Badge className="bg-slate-100 text-slate-500 border-none px-3 py-1 rounded-full font-black uppercase text-[8px]">
                                    Free
                                  </Badge>
                                )}
                              </td>
                              <td className="px-8 py-6 text-right space-x-2 flex items-center justify-end">
                                {reg.paymentStatus === 'pending' && (
                                  <Button 
                                    onClick={() => setCheckoutReg(reg)}
                                    className="bg-indigo-600 hover:bg-black text-white h-8 rounded-xl font-black uppercase tracking-widest text-[8px] px-3 shadow-md shadow-indigo-100"
                                  >
                                    Pay Ticket
                                  </Button>
                                )}
                                {(reg.paymentStatus === 'paid' || reg.paymentStatus === 'no_payment_required') && (
                                  <Button 
                                    onClick={() => handleOpenTicket(reg)}
                                    className="bg-indigo-600 hover:bg-black text-white h-8 rounded-xl font-black uppercase tracking-widest text-[8px] px-3 shadow-md shadow-indigo-100 flex items-center gap-1"
                                  >
                                    <QrCode className="w-3 h-3" />
                                    View Ticket
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleCancel(reg.id)}
                                  disabled={loadingId === reg.id}
                                  variant="ghost"
                                  className="h-8 text-rose-500 hover:text-rose-700 font-black uppercase tracking-widest text-[8px] px-3"
                                >
                                  {loadingId === reg.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    "Cancel"
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* CLUBS TAB */}
          {activeTab === 'clubs' && (
            <div className="space-y-8">
              {/* President Approval Panel */}
              {pendingMembersToApprove.length > 0 && (
                <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-indigo-50 border border-indigo-100/50">
                  <CardHeader className="p-8 pb-4">
                    <Badge className="bg-indigo-600 text-white border-none px-3 py-1 rounded-full font-black uppercase text-[8px] tracking-widest italic mb-2 w-fit">
                      President Controls
                    </Badge>
                    <CardTitle className="text-xl font-black uppercase italic tracking-tight text-indigo-900">
                      Pending Club Registrations
                    </CardTitle>
                    <CardDescription className="font-medium text-indigo-700/70 text-xs">
                      Approve or deny membership requests for your student clubs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-indigo-100 bg-indigo-100/30 text-indigo-900/60 font-bold uppercase tracking-widest text-[9px]">
                            <th className="px-8 py-5">Student Name</th>
                            <th className="px-6 py-5">Matric Number</th>
                            <th className="px-6 py-5">Role Requested</th>
                            <th className="px-8 py-5 text-right">Approval Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingMembersToApprove.map((req) => (
                            <tr key={req.id} className="border-b border-indigo-100/30 text-slate-700 text-sm hover:bg-indigo-100/10">
                              <td className="px-8 py-6 font-black text-indigo-950 uppercase italic">{req.name}</td>
                              <td className="px-6 py-6 font-medium text-indigo-900/80">{req.matricNumber}</td>
                              <td className="px-6 py-6">
                                <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold uppercase text-[8px]">
                                  {req.role}
                                </Badge>
                              </td>
                              <td className="px-8 py-6 text-right space-x-2">
                                <Button
                                  onClick={() => handleMemberApproval(req.id, true)}
                                  disabled={loadingId === req.id}
                                  className="bg-indigo-600 hover:bg-indigo-950 text-white h-8 rounded-xl font-black uppercase tracking-widest text-[8px] px-3 shadow-md shadow-indigo-100"
                                >
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleMemberApproval(req.id, false)}
                                  disabled={loadingId === req.id}
                                  variant="ghost"
                                  className="h-8 text-rose-600 hover:text-rose-800 font-black uppercase tracking-widest text-[8px] px-3"
                                >
                                  Reject
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* My Clubs */}
              <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black uppercase italic tracking-tight text-slate-900">My Memberships</CardTitle>
                  <CardDescription className="font-medium text-slate-400 text-xs">Clubs and societies you are registered in.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {userClubs.length === 0 ? (
                    <p className="text-slate-400 text-sm font-medium text-center py-6">You are not a member of any student organizations yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userClubs.map((uc) => (
                        <div key={uc.membershipId} className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-100 flex items-center justify-between gap-4 transition-all">
                          <div className="space-y-2">
                            <h4 className="font-black text-slate-900 uppercase italic text-base">{uc.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{uc.category}</p>
                          </div>
                          
                          <div className="text-right space-y-1">
                            <Badge className={cn(
                              "border-none px-3 py-1 rounded-full font-black uppercase text-[8px] italic",
                              uc.role === 'president' ? 'bg-amber-50 text-amber-600' : 
                              uc.role === 'pending' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-600'
                            )}>
                              {uc.role}
                            </Badge>
                            {uc.status === 'pending' && (
                              <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest block">Awaiting Admin approval</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Catalog to Join */}
              <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black uppercase italic tracking-tight text-slate-900">Explore Organizations</CardTitle>
                  <CardDescription className="font-medium text-slate-400 text-xs">Join active clubs and interest networks on campus.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {joinableClubs.length === 0 ? (
                    <p className="text-slate-400 text-sm font-medium text-center py-6">No new organizations currently available to join.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {joinableClubs.map((club) => (
                        <div key={club.id} className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-100 flex flex-col justify-between gap-6 transition-all group bg-slate-50/30 hover:bg-white">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-black text-slate-900 group-hover:text-indigo-600 uppercase italic text-base transition-all">{club.name}</h4>
                              <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold uppercase text-[8px] tracking-tight">{club.category}</Badge>
                            </div>
                            <p className="text-slate-400 text-xs font-medium line-clamp-3 leading-relaxed">{club.description}</p>
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-slate-100/50 pt-4 text-xs font-medium text-slate-400">
                            <span>Advisor: {club.advisorName || 'None'}</span>
                            <Button
                              onClick={() => handleJoinClub(club.id)}
                              disabled={loadingId === club.id}
                              className="bg-indigo-600 hover:bg-black text-white h-8 rounded-xl font-black uppercase tracking-widest text-[8px] px-4 shadow-md shadow-indigo-100"
                            >
                              {loadingId === club.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Request to Join"
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* BULLETINS TAB */}
          {activeTab === 'bulletins' && (
            <div className="space-y-6">
              {bulletins.length === 0 ? (
                <Card className="border-none shadow-2xl rounded-[3rem] p-16 text-center bg-white space-y-4">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">No announcements published at this time.</p>
                </Card>
              ) : (
                bulletins.map((blt) => (
                  <Card key={blt.id} className="border-none shadow-xl rounded-3xl bg-white p-8 space-y-4 hover:shadow-2xl transition-all duration-300">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <Badge className={cn(
                          "border-none px-3 py-1 rounded-full font-black uppercase text-[8px] tracking-widest italic mb-2",
                          blt.category === 'academic' ? 'bg-blue-50 text-blue-600' :
                          blt.category === 'sports' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        )}>
                          {blt.category}
                        </Badge>
                        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight leading-none">{blt.title}</h3>
                      </div>
                      
                      <div className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>{new Date(blt.publishedAt || blt.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-500 font-medium text-sm leading-relaxed whitespace-pre-wrap">{blt.content}</p>
                    
                    <div className="pt-4 border-t border-slate-100/50 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>Author: {blt.authorName}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Register Club Modal */}
      <Dialog open={isRegisterClubOpen} onOpenChange={setIsRegisterClubOpen}>
        <DialogContent className="border-none shadow-2xl rounded-[2.5rem] bg-white max-w-md p-8">
          <DialogHeader className="text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-slate-900">
              Register Club
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-xs">
              Apply to register a new student organization or club.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterClubSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Organization Name</label>
              <Input 
                value={clubName} 
                onChange={(e) => setClubName(e.target.value)} 
                placeholder="e.g. Science & Tech Club" 
                className="rounded-xl border-slate-200 h-11 text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Category</label>
              <select 
                value={clubCategory} 
                onChange={(e) => setClubCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white h-11 text-sm px-3 font-medium outline-none focus:border-indigo-600"
              >
                <option value="Academic">Academic</option>
                <option value="Social">Social</option>
                <option value="Sports">Sports</option>
                <option value="Arts & Culture">Arts & Culture</option>
                <option value="Religious">Religious</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Description / Mandate</label>
              <Textarea 
                value={clubDesc} 
                onChange={(e) => setClubDesc(e.target.value)} 
                placeholder="Briefly state the goal, core activities and purpose of the organization..."
                className="rounded-xl border-slate-200 min-h-24 text-sm font-medium leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-4 flex sm:flex-col gap-2">
              <Button
                type="submit"
                disabled={registerLoading}
                className="w-full bg-indigo-600 hover:bg-black text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
              >
                {registerLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Submit Proposal"
                )}
              </Button>
              <Button
                type="button"
                onClick={() => setIsRegisterClubOpen(false)}
                variant="ghost"
                className="w-full font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket Payment Confirmation Dialog */}
      <Dialog open={!!checkoutReg} onOpenChange={(open) => !open && setCheckoutReg(null)}>
        <DialogContent className="border-none shadow-2xl rounded-[2.5rem] bg-white max-w-md p-8">
          <DialogHeader className="text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-slate-900">
              Complete Payment
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-xs">
              Confirm checkout to complete registration.
            </DialogDescription>
          </DialogHeader>

          {checkoutReg && (
            <div className="space-y-6 py-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3 text-sm">
                <div className="flex justify-between items-start gap-4">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">EVENT</span>
                  <span className="font-black text-slate-900 text-right uppercase italic">{checkoutReg.title}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">SUBTOTAL</span>
                  <span className="font-black text-slate-900 text-lg italic">₦{Number(checkoutReg.fee).toLocaleString()}</span>
                </div>
              </div>

              {/* Gateway Selection */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Gateway</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['remita', 'paystack', 'flutterwave'] as const).map(gw => (
                    <button
                      key={gw}
                      onClick={() => setPaymentGateway(gw)}
                      className={`p-3 rounded-xl border font-bold text-xs uppercase tracking-tight text-center transition-all ${paymentGateway === gw ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 font-black' : 'border-slate-200 text-slate-400 hover:border-slate-400'}`}
                    >
                      {gw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 flex sm:flex-col gap-2">
            <Button
              onClick={handleProcessPayment}
              disabled={paymentLoading}
              className="w-full bg-indigo-600 hover:bg-black text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
            >
              {paymentLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Pay ₦{checkoutReg && Number(checkoutReg.fee).toLocaleString()}
                </>
              )}
            </Button>
            <Button
              onClick={() => setCheckoutReg(null)}
              variant="ghost"
              className="w-full font-black uppercase tracking-widest text-[10px] text-slate-400"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Ticket QR Modal */}
      <Dialog open={!!ticketReg} onOpenChange={(open) => {
        if (!open) {
          setTicketReg(null);
          setTicketQrUrl(null);
        }
      }}>
        <DialogContent className="border-none shadow-2xl rounded-[2.5rem] bg-white max-w-sm p-8">
          <DialogHeader className="text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6 animate-pulse" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-slate-900">
              Event Pass QR
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-xs">
              Present this code at the event check-in gate.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {ticketLoading ? (
              <div className="flex flex-col items-center justify-center space-y-2 h-48">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generating ticket...</span>
              </div>
            ) : ticketQrUrl ? (
              <>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ticketQrUrl} alt="Event Registration QR Ticket" className="w-48 h-48 mix-blend-multiply" />
                </div>
                {ticketReg && (
                  <div className="text-center space-y-1">
                    <p className="font-black text-slate-900 uppercase italic text-sm">{ticketReg.title}</p>
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{ticketReg.location}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{formatEventDate(ticketReg.startDate)}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-rose-500 py-6 text-sm font-bold flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8" />
                Failed to load QR code.
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              onClick={() => {
                setTicketReg(null);
                setTicketQrUrl(null);
              }}
              className="w-full bg-slate-900 hover:bg-black text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-slate-100"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
