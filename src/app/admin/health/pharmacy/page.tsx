import { db } from "@/db/db";
import { medicalInventory } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pill } from "lucide-react";

export default async function PharmacyPage() {
    const inventory = await db.select().from(medicalInventory);

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pharmacy & Inventory</h1>
                    <p className="text-muted-foreground mt-2">Manage clinic drugs, consumables, and medical equipment.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline">
                        <Pill className="w-4 h-4 mr-2" />
                        Dispense Medication
                    </Button>
                    <Button>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add New Item
                    </Button>
                </div>
            </div>

            <Card className="-4 -emerald-500 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle>Current Stock</CardTitle>
                    <CardDescription>A live overview of all medical items in the clinic.</CardDescription>
                </CardHeader>
                <CardContent className=" p-6">
                    {inventory.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                            <Pill className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-lg font-medium text-gray-900">No inventory items found</p>
                            <p>Click "Add New Item" to start stocking your pharmacy.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventory.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-emerald-50/50 transition-colors">
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">{item.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold">{item.quantity}</span> <span className="text-muted-foreground text-sm">{item.unit}</span>
                                        </TableCell>
                                        <TableCell>
                                            {item.quantity <= (item.minThreshold || 0) ? (
                                                <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Low Stock</Badge>
                                            ) : (
                                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">In Stock</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
