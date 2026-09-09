import { Card, CardContent } from "@/components/ui/card";
import { Calendar, GraduationCap, Info, CheckCircle2, Clock, Star, Archive, Megaphone } from "lucide-react";
import Link from "next/link";
import { getUpcomingNotices, getArchivedNotices, autoArchivePastNotices } from "@/actions/communication";

export const dynamic = 'force-dynamic';

function formatDate(d: any) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return ''; }
}

function ResumptionFallback() {
  return (
    <Card className="overflow-hidden border-0 shadow-xl rounded-3xl">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white text-center">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          <Calendar className="w-4 h-4" /> Official Notice
        </div>
        <h1 className="text-2xl md:text-3xl font-black uppercase italic leading-tight">
          Notice of Resumption for<br />2026/2027 Academic Session
        </h1>
        <p className="mt-3 text-indigo-100 font-medium">Monday, 28th September, 2026 — All Staff & Students</p>
      </div>
      <CardContent className="p-8 space-y-8">
        <p className="text-slate-700 leading-relaxed">This is to inform all Staff and Students that the resumption date for the <strong>2026/2027 Academic Session</strong> is on <strong>Monday, 28th September, 2026</strong>.</p>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-indigo-600" /> Key Dates</h3>
          <div className="grid gap-3">
            <div className="flex gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl"><GraduationCap className="w-5 h-5 text-indigo-600 mt-0.5" /><div><p className="text-sm font-black text-slate-900">New Intakes — ND1 & HND1 Registration</p><p className="text-xs font-bold text-slate-600">28th September to 13th October, 2026</p></div></div>
            <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl"><CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /><div><p className="text-sm font-black text-slate-900">HND2 Returning Students — Resumption</p><p className="text-xs font-bold text-slate-600">13th October, 2026</p></div></div>
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl"><Info className="w-5 h-5 text-amber-600 mt-0.5" /><div><p className="text-sm font-black text-slate-900">Lectures Commence</p><p className="text-xs font-bold text-slate-600">13th October, 2026</p></div></div>
            <div className="flex gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl"><Calendar className="w-5 h-5 text-slate-600 mt-0.5" /><div><p className="text-sm font-black text-slate-900">ND2 Resumption</p><p className="text-xs font-bold text-slate-600">6th November, 2026</p></div></div>
          </div>
          <p className="text-xs font-bold text-slate-500 mt-3">All students should complete their registration process within the stated dates.</p>
        </div>
        <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-amber-300">Note</h4>
          <ul className="space-y-2 text-sm leading-relaxed text-slate-200"><li>• New students/intake are required to check the portal or email for their admission notification and are required to commence the process of making payment of all fees as soon as notification of admission notice is received.</li><li>• Applicants yet to receive admission should check their portal for updates or visit the school for further instruction.</li></ul>
        </div>
        <div className="text-center pt-2"><p className="text-sm font-black uppercase tracking-widest text-slate-700">Signed.</p><p className="text-sm font-bold text-slate-600">The Management</p><p className="text-xs text-slate-400 mt-1">Federal School of Statistics, Ibadan</p></div>
      </CardContent>
    </Card>
  );
}

function NoticeCard({ n, featured }: { n: any; featured?: boolean }) {
  return (
    <Card className={`overflow-hidden border shadow-sm rounded-2xl ${featured ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-white'}`}>
      <CardContent className="p-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${n.priority==='high' ? 'bg-rose-100 text-rose-700' : n.priority==='low' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-700'}`}>{n.priority}</span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border">{n.category || 'general'}</span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">{formatDate(n.eventDate || n.createdAt)} {n.eventDate ? '• Event' : ''}</span>
        </div>
        <h3 className="text-base font-black text-slate-900 leading-tight">{n.title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{n.content}</p>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <span>By {n.sender?.name || 'Management'}</span>
          {n.expiresAt && <span>• Expires {formatDate(n.expiresAt)}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function NoticesPage() {
  await autoArchivePastNotices().catch(()=>{});
  const upcoming = await getUpcomingNotices(20);
  const archived = await getArchivedNotices(1, 20);

  const featured = upcoming.filter((n: any) => n.isFeatured);
  const regularUpcoming = upcoming.filter((n: any) => !n.isFeatured);

  const hasDynamic = upcoming.length > 0 || archived.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-slate-600">
            <Megaphone className="w-4 h-4 text-indigo-600" /> Notices & Events
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">School Notices</h1>
          <p className="text-sm text-slate-500 font-medium">Official information for students on school activities — visible before and after login.</p>
        </div>

        {featured.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2"><Star className="w-4 h-4" /> Featured Upcoming</h2>
            <div className="grid gap-4">{featured.map((n: any) => <NoticeCard key={n.id} n={n} featured />)}</div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2"><Calendar className="w-4 h-4" /> Upcoming</h2>
          {regularUpcoming.length > 0 ? (
            <div className="grid gap-4">{regularUpcoming.map((n: any) => <NoticeCard key={n.id} n={n} />)}</div>
          ) : featured.length === 0 ? (
            <ResumptionFallback />
          ) : (
            <Card className="p-8 text-center border-dashed"><p className="text-sm font-bold text-slate-400">No other upcoming notices. See featured above.</p></Card>
          )}
          {hasDynamic && regularUpcoming.length === 0 && featured.length > 0 && null}
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Archive className="w-4 h-4" /> Archived (Past Events)</h2>
          {archived.length > 0 ? (
            <div className="grid gap-4">{archived.map((n: any) => <NoticeCard key={n.id} n={n} />)}</div>
          ) : (
            <Card className="p-6 text-center border-dashed"><p className="text-sm font-bold text-slate-400">No archived notices yet. Past events will automatically move here after their date passes.</p></Card>
          )}
        </div>

        {!hasDynamic && (
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/login" className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest">Go to Portal Login</Link>
            <Link href="/" className="px-6 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-widest">Back to Home</Link>
          </div>
        )}
      </div>
    </div>
  );
}
