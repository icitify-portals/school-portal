import { NextRequest, NextResponse } from "next/server";

// Simple API key validation
// Keys are stored as PORTAL_API_KEYS env var (comma-separated)
// In production, use a database table for key management

export async function validateApiKey(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
    // SECURITY FIX H-4: Accept API keys ONLY via Authorization header.
    // Query-string keys (?api_key=...) are logged by web servers, CDNs,
    // and browser history, exposing the key in plain text.
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!apiKey) {
        return {
            valid: false,
            error: "Missing API key. Use: Authorization: Bearer <key>",
        };
    }

    const validKeys = (process.env.PORTAL_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);

    // SECURITY FIX H-5: Never silently bypass authentication in any NODE_ENV.
    // If no keys are configured, log a warning and reject all requests.
    if (validKeys.length === 0) {
        console.warn(
            "[API-AUTH] PORTAL_API_KEYS is not configured. " +
            "All API requests will be rejected. Set comma-separated keys in .env."
        );
        return { valid: false, error: "API access is not configured on this server." };
    }

    if (!validKeys.includes(apiKey)) {
        return { valid: false, error: "Invalid API key" };
    }

    return { valid: true };
}

// Rate limiting (in-memory, simple)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(identifier);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_WINDOW });
        return { allowed: true, remaining: RATE_LIMIT - 1 };
    }

    if (entry.count >= RATE_LIMIT) {
        return { allowed: false, remaining: 0 };
    }

    entry.count++;
    return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

// Wrapper for API route handlers
export function withApiAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
        // Validate API key
        const auth = await validateApiKey(req);
        if (!auth.valid) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        // Check rate limit
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimit = checkRateLimit(ip);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Try again later." },
                { status: 429, headers: { 'Retry-After': '60' } }
            );
        }

        // Call handler
        const response = await handler(req);

        // Add rate limit headers
        response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
        response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT));

        return response;
    };
}
