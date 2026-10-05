import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { levelLabel } from "@/lib/levels";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatLevel(level: number | string | undefined | null): string {
    return levelLabel(level, undefined);
}

export function formatLevelWithType(level: number | string | undefined | null, programmeType?: string): string {
    return levelLabel(level, programmeType);
}

export function isGraduatedStatus(status: string | undefined | null): boolean {
    return status === 'nd_graduant' || status === 'hnd_graduant';
}
