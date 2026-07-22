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
        case 100: return "ND 1";
        case 200: return "ND 2";
        case 300: return "HND 1";
        case 400: return "HND 2";
        case 500: return "HND 3";
        default: return `${lvl} Level`;
    }
}
