export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/2 mx-auto" />
        <div className="h-4 bg-slate-100 rounded w-3/4 mx-auto" />
        <div className="h-32 bg-slate-100 rounded-2xl mt-6" />
      </div>
    </div>
  );
}
