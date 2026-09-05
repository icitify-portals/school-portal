"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getStudentExams } from "@/actions/unified-exam";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Brain, Clock, ChevronRight, Loader2, Target, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function StudentCBTDashboard() {
  const { data: session, status } = useSession();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
    if (status === "authenticated" && session?.user?.id) {
      loadExams(parseInt(session.user.id));
    }
  }, [status, session]);

  async function loadExams(userId: number) {
    try {
      const data = await getStudentExams(userId);
      setExams(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-black italic uppercase tracking-tight text-slate-800">CBT Center</h1>
        <p className="text-slate-500 font-medium">Access your assigned exams, tests, and quizzes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.length === 0 ? (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
            <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Exams Available</h3>
            <p className="text-slate-500 mt-2">You currently have no active exams assigned to you.</p>
          </div>
        ) : (
          exams.map(exam => (
            <Card key={exam.id} className="group hover:border-indigo-200 hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 text-indigo-600" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2">{exam.title}</h3>
                {exam.description && (
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2">{exam.description}</p>
                )}

                <div className="space-y-3 mb-8">
                  <div className="flex items-center text-sm font-medium text-slate-600">
                    <Clock className="w-4 h-4 mr-3 text-slate-400" />
                    {exam.durationMinutes} Minutes
                  </div>
                  <div className="flex items-center text-sm font-medium text-slate-600">
                    <Target className="w-4 h-4 mr-3 text-slate-400" />
                    {exam.totalMarks} Marks
                  </div>
                  <div className="flex items-center text-sm font-medium text-slate-600 capitalize">
                    <Calendar className="w-4 h-4 mr-3 text-slate-400" />
                    {exam.contextType || ""} Assessment
                  </div>
                </div>

                <Link 
                  href={`/student/cbt/take/${exam.id}`}
                  className="w-full flex items-center justify-center px-4 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors group/btn"
                >
                  Start Exam
                  <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
"
