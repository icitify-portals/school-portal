"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getInstitutionalUnits } from "@/actions/institutional_units";

interface AliasConfig {
    student: string;
    course: string;
    term: string;
    faculty: string;
    department: string;
}

interface BranchContextType {
    activeUnit: any | null;
    availableUnits: any[];
    switchUnit: (unitId: number) => void;
    aliases: AliasConfig;
    isK12: boolean;
    loading: boolean;
}

const defaultAliases: AliasConfig = {
    student: "Student",
    course: "Course",
    term: "Semester",
    faculty: "Faculty",
    department: "Department",
};

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children, initialUnitId }: { children: React.ReactNode; initialUnitId?: string }) {
    const { data: session } = useSession();
    const [activeUnit, setActiveUnit] = useState<any | null>(null);
    const [availableUnits, setAvailableUnits] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user) {
            fetchUnits();
        }
    }, [session]);

    const fetchUnits = async () => {
        setLoading(true);
        const units = await getInstitutionalUnits();
        setAvailableUnits(units);
        
        // Default to first unit or saved unit from server/localStorage
        const savedUnitId = initialUnitId || (typeof window !== 'undefined' ? localStorage.getItem("activeUnitId") : null);
        const defaultUnit = units.find((u: any) => u.unit.id === Number(savedUnitId)) || units[0];

        
        if (defaultUnit) {
            setActiveUnit(defaultUnit.unit);
            // Save to cookie for middleware to read
            document.cookie = `activeUnitId=${defaultUnit.unit.id}; path=/; max-age=31536000`;
        }
        setLoading(false);
    };

    const switchUnit = (unitId: number) => {
        const unit = availableUnits.find((u: any) => u.unit.id === unitId);
        if (unit) {
            setActiveUnit(unit.unit);
            localStorage.setItem("activeUnitId", unitId.toString());
            document.cookie = `activeUnitId=${unitId}; path=/; max-age=31536000`;
            // Refresh page to reset all states with new branch context
            window.location.reload();
        }
    };

    const parseSettings = (settingsStr: string | null) => {
        try {
            return settingsStr ? JSON.parse(settingsStr) : {};
        } catch {
            return {};
        }
    };

    const settings = parseSettings(activeUnit?.settings);
    const aliases = { ...defaultAliases, ...(settings.aliases || {}) };
    const isK12 = activeUnit?.academicTier === "k12";

    return (
        <BranchContext.Provider value={{ 
            activeUnit, 
            availableUnits, 
            switchUnit, 
            aliases, 
            isK12,
            loading 
        }}>
            {children}
        </BranchContext.Provider>
    );
}

export function useBranch() {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error("useBranch must be used within a BranchProvider");
    }
    return context;
}
