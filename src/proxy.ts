import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

/**
 * Next.js 16 Proxy Function
 * Replaces the deprecated middleware convention.
 */
export const proxy = auth((req: NextRequest) => {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";
    
    // 1. Detect Subdomain (e.g., oshodi.portal.com)
    // Assuming portal.com is the base domain
    const isSubdomain = hostname.includes(".") && !hostname.startsWith("localhost") && !hostname.startsWith("127.0.0.1");
    let unitSlug = "";
    if (isSubdomain) {
        unitSlug = hostname.split(".")[0];
    }

    // 2. Get activeUnitId from cookie (set by BranchProvider)
    const activeUnitId = req.cookies.get("activeUnitId")?.value;

    // 3. Clone headers and inject tenant info
    const requestHeaders = new Headers(req.headers);
    if (activeUnitId) {
        requestHeaders.set("x-active-unit-id", activeUnitId);
    }
    if (unitSlug) {
        requestHeaders.set("x-unit-slug", unitSlug);
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
});

export default proxy;

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
