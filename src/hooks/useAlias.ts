"use client";

import { useBranch } from "@/providers/BranchProvider";

/**
 * Hook to handle dynamic terminology based on the active branch tier and settings.
 * Example: {alias('student')} returns "Pupil" for K12 and "Student" for Tertiary.
 */
export function useAlias() {
    const { aliases } = useBranch();

    const alias = (term: keyof typeof aliases) => {
        return aliases[term] || term;
    };

    return { alias };
}
