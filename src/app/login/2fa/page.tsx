import TwoFactorLoginClient from "./TwoFactorLoginClient";

export const metadata = {
    title: "Two-Factor Authentication | FSS Portal",
    description: "Verify your identity to access the portal.",
};

export default function TwoFactorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
            <TwoFactorLoginClient />
        </div>
    );
}
