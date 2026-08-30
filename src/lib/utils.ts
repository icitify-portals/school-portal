import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatLevel(level: number | string | undefined | null): string {
    if (!level) return "N/A";
    const lvl = typeof level === 'string' ? parseInt(level) : level;
    if (isNaN(lvl)) return String(level);

    switch (lvl) {
        case 1: return "Level 1";
        case 2: return "Level 2";
        // Legacy fallback
        case 100: return "ND 1";
        case 200: return "ND 2";
        case 300: return "HND 1";
        case 400: return "HND 2";
        case 500: return "HND 3";
        default: return `${lvl} Level`;
    }
}

export function formatLevelWithType(level: number | string | undefined | null, programmeType?: string): string {
    if (!level) return "N/A";
    const lvl = typeof level === 'string' ? parseInt(level) : level;
    if (isNaN(lvl)) return String(level);

    const prefix = programmeType || 'ND';
    if (lvl === 1) return `${prefix} 1`;
    if (lvl === 2) return `${prefix} 2`;
    // Legacy fallback
    return formatLevel(level);
}

export function isGraduatedStatus(status: string | undefined | null): boolean {
    return status === 'nd_graduant' || status === 'hnd_graduant';
}
