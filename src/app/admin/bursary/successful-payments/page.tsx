import { getSuccessfulPaymentsGrouped } from "@/actions/successful-payments";
import SuccessfulPaymentsClient from "./SuccessfulPaymentsClient";

export const dynamic = "force-dynamic";

export default async function SuccessfulPaymentsPage() {
    let initialData: any = { success: false, data: {}, counts: {}, totals: {} };
    try {
        initialData = await getSuccessfulPaymentsGrouped();
    } catch (err) {
        console.error("Failed to load initial payments data on server:", err);
    }

    return <SuccessfulPaymentsClient initialData={initialData} />;
}
