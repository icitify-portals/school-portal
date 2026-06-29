import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import dotenv from "dotenv";
import { headers } from "next/headers";
import path from "path";
import { redis } from "../lib/redis";

dotenv.config();

const baseUri = process.env.DATABASE_URL || "mysql://root:@localhost:3306/school_portal";

// Global cache for connection pools
const globalCache = global as unknown as {
    pools: Record<string, mysql.Pool>;
};

if (!globalCache.pools) globalCache.pools = {};

/**
 * Gets or creates a connection pool for a specific database
 */
export function getPoolForDb(dbName: string): mysql.Pool {
    if (!globalCache.pools[dbName]) {
        const parsedUrl = new URL(baseUri);
        parsedUrl.pathname = `/${dbName}`;
        globalCache.pools[dbName] = mysql.createPool({
            uri: parsedUrl.toString(),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return globalCache.pools[dbName];
}

/**
 * Resolves the active database name asynchronously from request headers
 */
export async function getActiveDbName(): Promise<string> {
    if (process.env.CLI_DB_OVERRIDE) {
        return process.env.CLI_DB_OVERRIDE;
    }
    let hostname = "";
    try {
        const headersList = await headers();
        hostname = headersList.get("host") || "";
    } catch (e) {
        // Outside request context (e.g., seeding, CLI, background job)
    }

    if (!hostname) {
        return "school_portal";
    }

    // 1. Attempt Redis Cache Lookup
    try {
        const cached = await redis.get(`tenant:host:${hostname}`);
        if (cached) {
            return cached;
        }
    } catch (err) {
        // Redis connection/fetch error, fall through gracefully
    }

    let dbName = "school_portal";

    // 2. Fetch from tenant_nodes mapping table in master pool
    try {
        const pool = getPoolForDb("school_portal");
        const [rows]: any = await pool.execute(
            "SELECT db_name FROM tenant_nodes WHERE hostname = ? AND is_active = 1 LIMIT 1",
            [hostname]
        );
        if (rows && rows.length > 0) {
            dbName = rows[0].db_name;
        } else {
            // Hardcoded fallbacks for local dev compatibility
            if (hostname.includes("ajatschools.local")) {
                dbName = "portal_AJAT_ACADEMY";
            } else if (hostname.includes("citadeluniversity.local")) {
                dbName = "portal_CITADEL_UNI";
            }
        }
    } catch (err) {
        // Master table doesn't exist yet, fallback to hardcoded domains
        if (hostname.includes("ajatschools.local")) {
            dbName = "portal_AJAT_ACADEMY";
        } else if (hostname.includes("citadeluniversity.local")) {
            dbName = "portal_CITADEL_UNI";
        }
    }

    // 3. Cache the successful resolution in Redis with a 24h TTL
    try {
        await redis.set(`tenant:host:${hostname}`, dbName, "EX", 86400);
    } catch (err) {
        // Ignore cache write errors
    }

    return dbName;
}

/**
 * Proxied connection pool that intercepts all queries and dynamically
 * routes them to the correct active database at execution time.
 */
const proxiedPool = new Proxy({} as any, {
    get(target, prop, receiver) {
        if (prop === "query") {
            return async (...args: any[]) => {
                const dbName = await getActiveDbName();
                const pool = getPoolForDb(dbName);
                return (pool.query as any)(...args);
            };
        }
        if (prop === "execute") {
            return async (...args: any[]) => {
                const dbName = await getActiveDbName();
                const pool = getPoolForDb(dbName);
                return (pool.execute as any)(...args);
            };
        }
        if (prop === "getConnection") {
            return async (...args: any[]) => {
                const dbName = await getActiveDbName();
                const pool = getPoolForDb(dbName);
                // @ts-expect-error - TS2556: Auto-suppressed for build
                return pool.getConnection(...args);
            };
        }

        // Fallback for pool setup properties
        const defaultPool = getPoolForDb("school_portal");
        const value = Reflect.get(defaultPool, prop, receiver);
        if (typeof value === "function") {
            return value.bind(defaultPool);
        }
        return value;
    }
});

/**
 * High-authority dynamic database client.
 * All queries are routed to the active host's partitioned database automatically.
 */
export const db = drizzle(proxiedPool as any, { schema, mode: "default" });

/**
 * Resolves the active database name synchronously (for diagnostics banner)
 */
export function getActiveDbNameSync(): string {
    // Non-async helper for direct UI render where async headers are not supported in component body
    return "school_portal";
}

/**
 * Returns the isolated filesystem storage path for the active tenant
 */
export function getTenantStoragePath(hostname: string): string {
    let nodeId = "DEFAULT";
    if (hostname.includes("ajatschools.local")) {
        nodeId = "AJAT-ACADEMY";
    } else if (hostname.includes("citadeluniversity.local")) {
        nodeId = "CITADEL-UNI";
    } else {
        const parts = hostname.split('.');
        if (parts.length > 1 && parts[0] !== 'www') {
            nodeId = parts[0].toUpperCase();
        }
    }

    return path.join("c:/xampp/htdocs/portal-moodle/nodes", nodeId);
}
