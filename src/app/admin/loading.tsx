export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-32 bg-slate-200 rounded-[2rem]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-24 bg-slate-100 rounded-2xl" />
        <div className="h-24 bg-slate-100 rounded-2xl" />
        <div className="h-24 bg-slate-100 rounded-2xl" />
      </div>
      <div className="h-96 bg-slate-100 rounded-2xl" />
    </div>
  );
}
