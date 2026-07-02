import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, Home, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PaymentsPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-8">Payments & Wallet</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-6 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <Badge className="bg-white/20 text-white border-none">Active Balance</Badge>
                        </div>
                        <p className="text-blue-100 text-sm font-medium">Available Balance</p>
                        <h3 className="text-4xl font-bold mt-1">₦45,250.00</h3>
                        <div className="mt-8 flex gap-3">
                            <Button className="bg-white text-blue-600 hover:bg-blue-50 w-full font-semibold">
                                Fund Wallet
                            </Button>
                        </div>
                    </CardContent>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet className="w-24 h-24 rotate-12" />
                    </div>
                </Card>

                <Card className="md:col-span-2 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all group">
                            <div className="p-3 bg-green-50 text-green-600 rounded-full group-hover:scale-110 transition-transform">
                                <ArrowDownLeft className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-600">Pay Tuition</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all group">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-full group-hover:scale-110 transition-transform">
                                <Home className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-600">Hostel Fee</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all group">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-full group-hover:scale-110 transition-transform">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-600">ID Card</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all group">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-600">Transcript</span>
                        </button>
                    </CardContent>
                </Card>
            </div>

            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle className="text-lg font-bold">Recent Transactions</CardTitle>
                    <Button variant="link" className="text-blue-600 font-semibold p-0 h-auto">View All</Button>
                </CardHeader>
                <CardContent className=" p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
                                    <ArrowUpRight className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">Tuition Fee Payment</p>
                                    <p className="text-xs text-slate-500">Oct 24, 2025 • 10:45 AM</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-900">-₦120,000.00</p>
                                <Badge variant="secondary" className="bg-green-100 text-green-700 border-none px-2 py-0">Completed</Badge>
                            </div>
                        </div>

                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors">
                                    <ArrowDownLeft className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">Wallet Funding (Bank Transfer)</p>
                                    <p className="text-xs text-slate-500">Oct 22, 2025 • 03:12 PM</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-600">+₦50,000.00</p>
                                <Badge variant="secondary" className="bg-green-100 text-green-700 border-none px-2 py-0">Completed</Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
