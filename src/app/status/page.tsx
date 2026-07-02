import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowRight, UserPlus, FileSearch, HelpCircle } from "lucide-react";

export default function StatusPage() {
    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Request Status & Changes</h2>
            <p className="text-slate-500 mb-10">Manage your academic lifecycle and departmental changes.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                <Card className="hover: transition- cursor-pointer group -200 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-6 p-6">
                        <div className="flex gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <UserPlus className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Change of Programme</h3>
                                <p className="text-sm text-slate-500 mt-1">Cross-department or internal course change request.</p>
                                <div className="mt-4 flex items-center text-blue-600 text-sm font-bold gap-1 group-hover:gap-2 transition-all">
                                    Apply Now <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover: transition- cursor-pointer group -200 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardContent className="pt-6 p-6">
                        <div className="flex gap-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <RefreshCw className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Suspension / Deferment</h3>
                                <p className="text-sm text-slate-500 mt-1">Temporarily pause your studies due to health or personal reasons.</p>
                                <div className="mt-4 flex items-center text-orange-600 text-sm font-bold gap-1 group-hover:gap-2 transition-all">
                                    Apply Now <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <FileSearch className="w-5 h-5 text-slate-400" />
                    Previous Requests
                </h3>
                <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Request ID</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Submitted Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-sm font-mono text-slate-500 font-bold">#REQ-82910</td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-700">Course Add/Drop</td>
                                <td className="px-6 py-4 text-sm text-slate-500">Jan 12, 2025</td>
                                <td className="px-6 py-4">
                                    <Badge className="bg-green-100 text-green-700 border-none">Approved</Badge>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <HelpCircle className="w-4 h-4 text-slate-400" />
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    );
}
