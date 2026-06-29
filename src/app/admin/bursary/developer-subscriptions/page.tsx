import { getUnpaidSubscriptions } from "@/actions/developer-subscriptions";
import BursarSubscriptionTable from "./BursarSubscriptionTable";

export default async function DeveloperSubscriptionsBursaryPage() {
    const subscriptions = await getUnpaidSubscriptions();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Subscriptions (Bulk Settlement)</h1>
                <p className="text-muted-foreground mt-2">
                    Review and settle outstanding platform subscription fees on behalf of enrolled students.
                </p>
            </div>

            <BursarSubscriptionTable initialData={subscriptions} />
        </div>
    );
}
