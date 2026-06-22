import { NextResponse } from "next/server";
import { CronService } from "@/services/CronService";

/**
 * Standard-compliant journal background cron trigger endpoint.
 * Secures requests using the Bearer CRON_SECRET auth header.
 */
export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        console.log("[CRON] Triggered Journal Reviewer Invitation Expiration check...");
        const result = await CronService.expireJournalReviewInvitations();

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Journal Expiry Cron API failed:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
