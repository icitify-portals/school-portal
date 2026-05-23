"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children, session }: { children: React.ReactNode; session?: any }) {
    const Provider = SessionProvider as any;
    return <Provider session={session}>{children}</Provider>;
}

