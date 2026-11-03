import { redirect } from "next/navigation";

export default function SuccessfulPaymentSingularRedirect() {
    redirect("/admin/bursary/successful-payments");
}
