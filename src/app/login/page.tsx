"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getBrandingSettings } from "@/actions/settings";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [branding, setBranding] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        // Fetch branding settings safely from client
        getBrandingSettings()
            .then(data => setBranding(data))
            .catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                // Use the explicit error message if provided by auth, otherwise fallback
                const message = (result as any).code || result.error;
                if (message === "CredentialsSignin") {
                    setError("Invalid email or password");
                } else {
                    setError(message);
                }
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="text-center space-y-1 bg-slate-50/50 border-b border-slate-100 p-6">
                    <div className="flex justify-center mb-4">
                        <img 
                            src={branding?.INST_LOGO || "/logo.png"} 
                            alt={branding?.INST_NAME || "School Logo"} 
                            className="h-16 object-contain" 
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Sign In</CardTitle>
                    <CardDescription>Enter your credentials to access the FSS Portal</CardDescription>
                </CardHeader>
                <CardContent className=" p-6">
                    <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex gap-2 items-center">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Email / Matric Number</label>
                            <input
                                type="text"
                                required
                                suppressHydrationWarning
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 bg-white"
                                placeholder="name@school.edu or Matric No"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Password</label>
                            <input
                                type="password"
                                required
                                suppressHydrationWarning
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 bg-white"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                                <input type="checkbox" className="rounded border-slate-300 text-blue-600" />
                                Remember me
                            </label>
                            <Link href="/forgot-password" virtual-link="forgot-password" className="text-blue-600 font-semibold hover:underline">
                                Forgot Password?
                            </Link>
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-xl text-lg h-auto shadow-lg shadow-blue-500/20"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign In"}
                        </Button>
                    </form>

                    {/* Back to Homepage Button */}
                    <div className="mt-6">
                        <Link href="/" className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all font-bold text-sm text-slate-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Homepage
                        </Link>
                    </div>


                </CardContent>
            </Card>
        </div>
    );
}
