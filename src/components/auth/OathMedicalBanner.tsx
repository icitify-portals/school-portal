"use client";

import { AlertCircle, PenTool, Stethoscope, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface OathMedicalBannerProps {
    oathRequired: boolean;
    medicalRequired: boolean;
    deadline: string | null;
}

export function OathMedicalBanner({ oathRequired, medicalRequired, deadline }: OathMedicalBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const deadlineText = deadline
        ? new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'the deadline';

    const items = [];
    if (oathRequired) items.push({ label: "Matriculation Oath", href: "/student/matriculation", icon: PenTool });
    if (medicalRequired) items.push({ label: "Medical Form", href: "/student/medical", icon: Stethoscope });

    return (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="text-sm">
                        <span className="font-bold text-amber-800">Action Required:</span>
                        <span className="text-amber-700 ml-1">
                            Complete your {items.map((item, i) => (
                                <span key={item.href}>
                                    {i > 0 && " and "}
                                    <Link href={item.href} className="underline font-bold hover:text-amber-900">
                                        {item.label}
                                    </Link>
                                </span>
                            ))}
                            {" "}by {deadlineText}. After the deadline, completion becomes mandatory.
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-amber-400 hover:text-amber-600 shrink-0"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}