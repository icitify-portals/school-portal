"use client";
import { isFeatureEnabled } from "@/lib/feature-flags";

export function UnifiedBanner() {
  if (!isFeatureEnabled("CBT_UNIFIED")) return null;
  return (
    <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-700">
      <strong>Unified CBT Enabled:</strong> All quizzes (legacy + central + unified) now route through <code>unifiedExams</code> with <code>contextType='course'</code>. Legacy <code>quizzes</code> and <code>cbtQuizzes</code> remain readable for backward compatibility — no data migrated yet. Disable flag to revert.
    </div>
  );
}
