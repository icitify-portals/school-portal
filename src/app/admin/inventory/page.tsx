
import { 
    getInventoryItems, 
    getInventoryAnalytics, 
    getInventoryCategories,
    getSuppliers 
} from "@/actions/inventory";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Package, 
    AlertTriangle, 
    ArrowUpRight, 
    ArrowDownRight, 
    Plus, 
    History,
    Users,
    Tag
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function InventoryDashboard() {
    const items = await getInventoryItems();
    const analytics = await getInventoryAnalytics();
    
    return (
        <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Inventory & Stock</h1>
                    <p className="text-slate-500 mt-1">Manage school supplies, equipment, and consumables.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/admin/inventory/transactions">
                            <History className="w-4 h-4 mr-2" />
                            Movement History
                        </Link>
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Item
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Items</p>
                                <h3 className="text-2xl font-bold text-slate-900">{items.length}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Low Stock</p>
                                <h3 className="text-2xl font-bold text-slate-900">{analytics.lowStockCount}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                                <Tag className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Categories</p>
                                <h3 className="text-2xl font-bold text-slate-900">12</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Suppliers</p>
                                <h3 className="text-2xl font-bold text-slate-900">8</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Inventory Table */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle>Current Stock</CardTitle>
                        <CardDescription>Real-time availability of all inventory items.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Stock Level</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => {
                                    const isLow = parseFloat(item.quantityInStock || "0") <= parseFloat(item.reorderLevel || "0");
                                    return (
                                        <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                                            <TableCell>{item.category?.name || "General"}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold">{item.quantityInStock}</span>
                                                    <span className="text-xs text-slate-400 uppercase">{item.unitOfMeasure}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {isLow ? (
                                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
                                                        Low Stock
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                                                        In Stock
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                                    Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Recent Movements */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle>Recent Movements</CardTitle>
                        <CardDescription>Latest stock in/out activities.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {analytics.recentTransactions.map((tx) => (
                            <div key={tx.id} className="flex gap-4 group">
                                <div className={`mt-1 p-2 rounded-xl h-fit ${
                                    tx.type === 'purchase' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                    {tx.type === 'purchase' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 border-b border-slate-50 pb-4 group-last:border-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-semibold text-slate-900">{tx.item?.name}</p>
                                        <p className="text-xs font-bold text-slate-500">
                                            {tx.type === 'purchase' ? '+' : '-'}{tx.quantity}
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {tx.type === 'purchase' ? `from ${tx.supplier?.name || 'Vendor'}` : `issued to ${tx.recipient?.name || 'Staff'}`}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
                                        {format(new Date(tx.transactionDate || Date.now()), "MMM dd, hh:mm a")}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
