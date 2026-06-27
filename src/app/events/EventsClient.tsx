"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Calendar, 
  MapPin, 
  User, 
  DollarSign, 
  CheckCircle, 
  Loader2, 
  Clock, 
  ArrowRight,
  Sparkles,
  CreditCard
} from "lucide-react";
import { registerForEventAction, confirmEventPaymentAction, cancelRegistrationAction } from "@/actions/student-affairs";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  capacity: number | null;
  isPaid: boolean;
  fee: string | null;
  status: string;
  createdAt: Date | null;
  creatorName: string;
  registeredCount: number;
}

interface EventsClientProps {
  initialEvents: Event[];
  session: any;
  userRegistrations: any[];
}

export default function EventsClient({ initialEvents, session, userRegistrations }: EventsClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  
  // Checkout Modal State
  const [checkoutEvent, setCheckoutEvent] = useState<Event | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<'remita' | 'paystack' | 'flutterwave'>('remita');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Map to check if user is already registered
  const registeredEventIds = new Set(
    userRegistrations
      .filter(r => r.status === 'registered')
      .map(r => r.eventId)
  );

  const filteredEvents = events.filter(e => {
    if (filter === 'free') return !e.isPaid;
    if (filter === 'paid') return e.isPaid;
    return true;
  });

  const handleRegister = async (event: Event) => {
    if (!session) {
      toast.info("Please login to register for this event");
      router.push(`/login?callbackUrl=/events`);
      return;
    }

    if (event.isPaid) {
      setCheckoutEvent(event);
      return;
    }

    setSubmittingId(event.id);
    try {
      const res = await registerForEventAction(event.id);
      if (res.success) {
        toast.success(`Successfully registered for ${event.title}!`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to register");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCancelRegistration = async (eventId: number) => {
    const reg = userRegistrations.find(r => r.eventId === eventId && r.status === 'registered');
    if (!reg) return;

    setSubmittingId(eventId);
    try {
      const res = await cancelRegistrationAction(reg.id);
      if (res.success) {
        toast.success("Registration cancelled successfully.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to cancel registration");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleProcessCheckout = async () => {
    if (!checkoutEvent) return;
    setPaymentLoading(true);

    try {
      // 1. Submit pending registration
      const regRes = await registerForEventAction(checkoutEvent.id);
      if (!regRes.success) {
        toast.error(regRes.error || "Failed to initiate registration");
        setPaymentLoading(false);
        return;
      }

      // 2. Confirm/complete payment on the portal (simulate gateway callback success)
      if (regRes.transactionId) {
        const payRes = await confirmEventPaymentAction(regRes.transactionId);
        if (payRes.success) {
          toast.success(`Payment successful! You are now registered for ${checkoutEvent.title}.`);
          setCheckoutEvent(null);
          router.refresh();
        } else {
          toast.error("Registration created, but payment confirmation failed. Please contact support.");
        }
      } else {
        toast.success(`Successfully registered for ${checkoutEvent.title}!`);
        setCheckoutEvent(null);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatEventDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 pb-20">
      {/* Premium Hero Section */}
      <div className="relative bg-slate-900 overflow-hidden py-24 px-8 text-center border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/30 to-violet-900/30 opacity-60" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-10 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500 rounded-full blur-3xl opacity-10 animate-pulse" />
        
        <div className="relative max-w-4xl mx-auto space-y-6">
          <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px] italic">
            Student Affairs Unit
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight uppercase italic leading-none">
            Campus Events & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Hub</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Discover conferences, seminars, sporting activities, and social gathers happening on campus. Register and pay seamlessly.
          </p>

          <div className="pt-8 flex flex-wrap justify-center gap-4">
            {session ? (
              <Button asChild className="bg-indigo-600 hover:bg-white hover:text-slate-900 text-white font-black uppercase tracking-widest text-xs px-8 h-12 rounded-xl shadow-2xl shadow-indigo-500/20 transition-all flex items-center gap-2">
                <Link href="/student/student-affairs">
                  Go To Student Console
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="bg-indigo-600 hover:bg-white hover:text-slate-900 text-white font-black uppercase tracking-widest text-xs px-8 h-12 rounded-xl shadow-2xl shadow-indigo-500/20 transition-all">
                <Link href="/login">Sign In To Register</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Events Feed */}
      <div className="max-w-[1400px] mx-auto px-6 mt-16 space-y-12">
        {/* Navigation & Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-md border border-slate-100">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-900'}`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter('free')}
              className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${filter === 'free' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-900'}`}
            >
              Free
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${filter === 'paid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-900'}`}
            >
              Paid
            </button>
          </div>

          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Showing {filteredEvents.length} events
          </p>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Card className="border-none shadow-xl rounded-[2.5rem] p-16 text-center bg-white space-y-6">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black uppercase italic text-slate-700">No events found</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto">
              There are no events matching your filter criteria at this moment. Please check back later.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map(event => {
              const isRegistered = registeredEventIds.has(event.id);
              const isFull = event.capacity ? event.registeredCount >= event.capacity : false;

              return (
                <Card key={event.id} className="border-none shadow-xl hover:shadow-2xl rounded-3xl bg-white overflow-hidden flex flex-col group transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-8 space-y-6 flex-1 flex flex-col">
                    {/* Header Tags */}
                    <div className="flex justify-between items-center gap-4">
                      {event.isPaid ? (
                        <Badge className="bg-amber-50 text-amber-600 border-none px-4 py-1 rounded-full font-black uppercase tracking-widest text-[9px] shadow-sm italic flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Premium Event
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1 rounded-full font-black uppercase tracking-widest text-[9px] shadow-sm italic">
                          Free Entry
                        </Badge>
                      )}
                      
                      {event.capacity && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {event.registeredCount} / {event.capacity} Filled
                        </span>
                      )}
                    </div>

                    {/* Title & Desc */}
                    <div className="space-y-3 flex-1">
                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 uppercase italic leading-tight tracking-tight transition-all">
                        {event.title}
                      </h3>
                      <p className="text-slate-500 font-medium text-sm line-clamp-3 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    {/* Metadata details */}
                    <div className="pt-6 border-t border-slate-100 space-y-3 text-slate-500 font-medium text-xs">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span>{formatEventDate(event.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-indigo-500" />
                        <span>Organized by {event.creatorName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="px-8 pb-8 pt-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="text-left">
                      {event.isPaid ? (
                        <>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">REGISTRATION FEE</p>
                          <p className="text-xl font-black text-slate-950 italic">₦{Number(event.fee).toLocaleString()}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ENTRY</p>
                          <p className="text-xl font-black text-emerald-600 italic">FREE</p>
                        </>
                      )}
                    </div>

                    {isRegistered ? (
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleCancelRegistration(event.id)}
                          disabled={submittingId === event.id}
                          variant="ghost" 
                          className="h-10 text-rose-500 hover:text-rose-700 font-black uppercase tracking-widest text-[9px] px-3"
                        >
                          Cancel
                        </Button>
                        <Badge className="bg-indigo-50 text-indigo-600 border-none font-black uppercase px-4 py-2 rounded-xl text-[9px]">
                          Registered
                        </Badge>
                      </div>
                    ) : isFull ? (
                      <Button disabled className="bg-slate-200 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[9px] h-10 px-6">
                        Fully Booked
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleRegister(event)}
                        disabled={submittingId === event.id}
                        className="bg-indigo-600 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest text-[9px] h-10 px-6 shadow-md shadow-indigo-100 hover:shadow-none transition-all flex items-center gap-2"
                      >
                        {submittingId === event.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Register"
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Premium Sim Checkout Modal */}
      <Dialog open={!!checkoutEvent} onOpenChange={(open) => !open && setCheckoutEvent(null)}>
        <DialogContent className="border-none shadow-2xl rounded-[2.5rem] bg-white max-w-md p-8">
          <DialogHeader className="text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-slate-900">
              Confirm Payment
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-xs">
              Complete your registration checkout by paying the ticket fee.
            </DialogDescription>
          </DialogHeader>

          {checkoutEvent && (
            <div className="space-y-6 py-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3 text-sm">
                <div className="flex justify-between items-start gap-4">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">EVENT</span>
                  <span className="font-black text-slate-900 text-right uppercase italic">{checkoutEvent.title}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">SUBTOTAL</span>
                  <span className="font-black text-slate-900 text-lg italic">₦{Number(checkoutEvent.fee).toLocaleString()}</span>
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
              onClick={handleProcessCheckout}
              disabled={paymentLoading}
              className="w-full bg-indigo-600 hover:bg-black text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
            >
              {paymentLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Pay ₦{checkoutEvent && Number(checkoutEvent.fee).toLocaleString()}
                </>
              )}
            </Button>
            <Button
              onClick={() => setCheckoutEvent(null)}
              variant="ghost"
              className="w-full font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
