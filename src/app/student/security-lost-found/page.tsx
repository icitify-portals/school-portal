import { getAuthUser } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import LostFoundClient from "./LostFoundClient";
import { getLostAndFoundItemsAction, getMyLostItemsAction } from "@/actions/security-lost-found";

export default async function StudentLostAndFoundPage() {
    const user = await getAuthUser();
    if (!user || (user as any).role !== "student") {
        redirect("/login");
    }

    const [foundRes, myRes] = await Promise.all([
        getLostAndFoundItemsAction({ type: 'found', status: 'open' }),
        getMyLostItemsAction()
    ]);

    const foundItems = foundRes.items || [];
    const myItems = myRes.items || [];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Lost & Found Hub</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Report lost belongings or browse items recovered by the security unit.
                </p>
            </div>

            <LostFoundClient initialFoundItems={foundItems} initialMyItems={myItems} />
        </div>
    );
}
