import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

// ── Rate Limiting (in-memory, resets on restart) ────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 200;
const RATE_LIMIT_API_MAX = 100;

// ── Tenant Cache (in-memory, invalidates on deploy/restart) ─────
const tenantCache = new Map<string, { dbName: string; expiry: number }>();
const TENANT_CACHE_TTL = 5 * 60 * 1000;

function getClientIp(request: NextRequest): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1"
    );
}

function checkRateLimit(key: string, max: number): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: max - 1 };
    }

    entry.count++;
    if (entry.count > max) {
        return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: max - entry.count };
}

if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitMap.entries()) {
            if (now > entry.resetTime) {
                rateLimitMap.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

/**
 * Next.js 16 Proxy Function
 * Replaces the deprecated middleware convention.
 *
 * Responsibilities:
 * 1. Auth (via next-auth)
 * 2. Subdomain / unit detection
 * 3. Tenant DB resolution (fast-path for db.ts)
 * 4. IP-based rate limiting
 * 5. Security (path traversal, cron protection)
 */
export const proxy = auth((req: NextRequest) => {
    const startTime = Date.now();
    const { pathname } = req.nextUrl;
    const hostname = req.headers.get("host") || "";

    // ── Skip for static assets ──
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        (pathname.includes(".") && !pathname.includes("/api/"))
    ) {
        return NextResponse.next();
    }

    // ── 1. Subdomain / Unit detection ──
    const isSubdomain =
        hostname.includes(".") &&
        !hostname.startsWith("localhost") &&
        !hostname.startsWith("127.0.0.1");
    let unitSlug = "";
    if (isSubdomain) {
        unitSlug = hostname.split(".")[0];
    }

    // ── 2. Tenant DB resolution (in-memory cache) ──
    let dbName = "school_portal";
    const cached = tenantCache.get(hostname);

    if (cached && Date.now() < cached.expiry) {
        dbName = cached.dbName;
    } else {
        if (hostname.includes("ajatschools.local")) {
            dbName = "portal_AJAT_ACADEMY";
        } else if (hostname.includes("citadeluniversity.local")) {
            dbName = "portal_CITADEL_UNI";
        } else {
            const parts = hostname.split(".");
            if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "portal") {
                dbName = `portal_${parts[0].toUpperCase()}`;
            }
        }
        tenantCache.set(hostname, { dbName, expiry: Date.now() + TENANT_CACHE_TTL });
    }

    // ── 3. Build request headers ──
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-tenant-db", dbName);
    requestHeaders.set("x-request-start", String(startTime));

    const activeUnitId = req.cookies.get("activeUnitId")?.value;
    if (activeUnitId) {
        requestHeaders.set("x-active-unit-id", activeUnitId);
    }
    if (unitSlug) {
        requestHeaders.set("x-unit-slug", unitSlug);
    }

    // ── 4. Rate Limiting ──
    const clientIp = getClientIp(req);
    const isApiRoute = pathname.startsWith("/api/");
    const maxRequests = isApiRoute ? RATE_LIMIT_API_MAX : RATE_LIMIT_MAX;
    const rateLimitKey = `rl:${clientIp}:${isApiRoute ? "api" : "web"}`;

    const { allowed, remaining } = checkRateLimit(rateLimitKey, maxRequests);

    if (!allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
                status: 429,
                headers: {
                    "X-RateLimit-Limit": String(maxRequests),
                    "X-RateLimit-Remaining": "0",
                    "Retry-After": "60",
                },
            }
        );
    }

    // ── 5. Security: Block path traversal ──
    if (pathname.includes("..") || pathname.includes("%2e%2e")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 6. Cron endpoint protection ──
    if (pathname.startsWith("/api/cron/")) {
        const cronSecret =
            req.headers.get("authorization")?.replace("Bearer ", "") ||
            req.nextUrl.searchParams.get("secret");
        if (
            cronSecret !== process.env.CRON_SECRET &&
            cronSecret !== process.env.CRON_SECRET_KEY
        ) {
            const origin = req.headers.get("origin") || "";
            const userAgent = req.headers.get("user-agent") || "";
            if (!origin.includes("vercel") && !userAgent.includes("cron-job")) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }
    }

    // ── Response with enriched headers ──
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("X-RateLimit-Limit", String(maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(remaining));

    return response;
});

export default proxy;

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon)
         * - public files (images, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
