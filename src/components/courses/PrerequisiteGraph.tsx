"use client";
import React from "react";

interface CourseNode {
  id: number;
  code: string;
  name: string;
}

interface PrereqEdge {
  courseId: number;
  prerequisiteId: number;
  minGrade?: string;
}

export function PrerequisiteGraph({ courses, prerequisites }: { courses: CourseNode[]; prerequisites: PrereqEdge[] }) {
  // Read-only visual, no breaking — simple SVG-free list with arrows
  if (courses.length === 0) return <p className="text-sm text-slate-500">No courses to display</p>;
  const hasEdges = prerequisites.length > 0;
  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
      <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">Prerequisite Map (Read-only)</h4>
      {!hasEdges ? (
        <p className="text-xs text-slate-500">No prerequisites configured — all courses are standalone.</p>
      ) : (
        <div className="space-y-2">
          {prerequisites.map((e, i) => {
            const course = courses.find(c => c.id === e.courseId);
            const prereq = courses.find(c => c.id === e.prerequisiteId);
            return (
              <div key={i} className="flex items-center gap-2 text-xs bg-white p-2 rounded-lg border border-slate-200">
                <span className="font-bold text-indigo-600">{prereq?.code || e.prerequisiteId}</span>
                <span className="text-slate-400">→</span>
                <span className="font-bold text-slate-700">{course?.code || e.courseId}</span>
                <span className="text-[10px] text-slate-500">min: {e.minGrade || "D"}</span>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[10px] text-slate-400">This is a read-only view. Existing `coursePrerequisites` table is unchanged. No breaking change.</p>
    </div>
  );
}
