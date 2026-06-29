"use server";

import mysql from "mysql2/promise";
import { hasRole } from "@/lib/rbac";

const baseUri = process.env.DATABASE_URL || "mysql://root:@localhost:3306/school_portal";
const databases = ["school_portal", "portal_AJAT_ACADEMY", "portal_CITADEL_UNI"];

export async function getCrossTenantDeveloperRevenue() {
    if (!(await hasRole("icitify_dev"))) throw new Error("Unauthorized");

    let totalRevenue = 0;
    let totalUnpaid = 0;
    const portals: { name: string; revenue: number; unpaid: number }[] = [];

    for (const dbName of databases) {
        try {
            const parsedUrl = new URL(baseUri);
            parsedUrl.pathname = `/${dbName}`;
            const connection = await mysql.createConnection(parsedUrl.toString());

            const [paidResult]: any = await connection.query(`
                SELECT SUM(amount_paid) as sum_paid FROM developer_subscriptions WHERE status = 'paid' OR status = 'part_paid'
            `);
            
            const [unpaidResult]: any = await connection.query(`
                SELECT SUM(amount_due - amount_paid) as sum_unpaid FROM developer_subscriptions WHERE status != 'paid' AND status != 'exempt'
            `);

            const rev = parseFloat(paidResult[0]?.sum_paid || 0);
            const unp = parseFloat(unpaidResult[0]?.sum_unpaid || 0);

            totalRevenue += rev;
            totalUnpaid += unp;
            portals.push({ name: dbName, revenue: rev, unpaid: unp });

            await connection.end();
        } catch (e) {
            console.error(`Analytics sync failed for ${dbName}`);
            portals.push({ name: dbName, revenue: 0, unpaid: 0 });
        }
    }

    return { totalRevenue, totalUnpaid, portals };
}
