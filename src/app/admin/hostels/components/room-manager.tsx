"use client";

import { useState, useEffect } from "react";
import {
    getHostelStructure,
    createHostelBlock,
    createHostelRoom,
    updateHostelRoom,
    deleteHostelRoom
} from "@/actions/hostels";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Home,
    Trash2,
    Plus,
    Users,
    ChevronRight,
    Layers,
    Settings2,
    Check,
    X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function RoomManager({ hostelId, hostelName }: { hostelId: number, hostelName: string }) {
    const [blocks, setBlocks] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const [blockName, setBlockName] = useState("");
    const [showAddBlock, setShowAddBlock] = useState(false);

    const [showAddRoom, setShowAddRoom] = useState(false);
    const [newRoom, setNewRoom] = useState({
        roomNumber: "",
        capacity: 4,
        gender: "male",
        price: "0.00"
    });

    useEffect(() => {
        fetchStructure();
    }, [hostelId]);

    async function fetchStructure() {
        setLoading(true);
        const res = await getHostelStructure(hostelId);
        if (res.success && 'data' in res && res.data) {
            setBlocks(res.data.blocks);
            setRooms(res.data.rooms);
            if (res.data.blocks.length > 0 && !selectedBlockId) {
                setSelectedBlockId(res.data.blocks[0].id);
            }
        }
        setLoading(false);
    }

    async function handleAddBlock() {
        if (!blockName) return;
        const res = await createHostelBlock({ hostelId, name: blockName });
        if (res.success) {
            toast.success(res.message);
            setBlockName("");
            setShowAddBlock(false);
            fetchStructure();
        } else {
            toast.error(res.error);
        }
    }

    async function handleAddRoom() {
        if (!selectedBlockId || !newRoom.roomNumber) return;
        const res = await createHostelRoom({
            blockId: selectedBlockId,
            ...newRoom,
            price: parseFloat(newRoom.price)
        });
        if (res.success) {
            toast.success(res.message);
            setNewRoom({ roomNumber: "", capacity: 4, gender: "male", price: "0.00" });
            setShowAddRoom(false);
            fetchStructure();
        } else {
            toast.error(res.error);
        }
    }

    async function handleDeleteRoom(id: number) {
        if (!confirm("Are you sure you want to delete this room?")) return;
        const res = await deleteHostelRoom(id);
        if (res.success) {
            toast.success(res.message);
            fetchStructure();
        } else {
            toast.error(res.error);
        }
    }

    const filteredRooms = rooms.filter(r => r.blockId === selectedBlockId);
    const currentBlock = blocks.find(b => b.id === selectedBlockId);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
                <span>Hostels</span>
                <ChevronRight className="w-3 h-3" />
                <span className="font-bold text-slate-600">{hostelName}</span>
                <ChevronRight className="w-3 h-3" />
                <span>Blocks & Rooms</span>
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* Blocks List */}
                <Card className="col-span-12 md:col-span-4 -100 h-fit border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-3">
                        <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-slate-500">
                            <Layers className="w-3.5 h-3.5" /> Blocks
                        </CardTitle>
                        <Dialog open={showAddBlock} onOpenChange={setShowAddBlock}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[300px]">
                                <DialogHeader>
                                    <DialogTitle>Add Block</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                    <Label htmlFor="blockName">Block Name</Label>
                                    <Input
                                        id="blockName"
                                        placeholder="e.g. Block A"
                                        value={blockName}
                                        onChange={(e) => setBlockName(e.target.value)}
                                        className="mt-2"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button size="sm" className="bg-indigo-600 w-full" onClick={handleAddBlock}>Create Block</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="p-2 space-y-1">
                        {loading && <p className="text-center py-4 text-xs text-slate-400">Loading...</p>}
                        {!loading && blocks.length === 0 && <p className="text-center py-4 text-xs text-slate-400">No blocks added.</p>}
                        {blocks.map((b) => (
                            <button
                                key={b.id}
                                onClick={() => setSelectedBlockId(b.id)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left ${selectedBlockId === b.id
                                    ? "bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-200"
                                    : "text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                <span className="text-sm">{b.name}</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] bg-white">
                                        {rooms.filter(r => r.blockId === b.id).length} Rms
                                    </Badge>
                                </div>
                            </button>
                        ))}
                    </CardContent>
                </Card>

                {/* Rooms Matrix */}
                <Card className="col-span-12 md:col-span-8 -100 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-3">
                        <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-slate-500">
                            <Home className="w-3.5 h-3.5" /> {currentBlock?.name || 'Rooms'} Management
                        </CardTitle>
                        {selectedBlockId && (
                            <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700">
                                        <Plus className="w-3.5 h-3.5" /> Add Room
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Room to {currentBlock?.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Room identifier</Label>
                                            <Input
                                                placeholder="e.g. 101"
                                                value={newRoom.roomNumber}
                                                onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Gender</Label>
                                            <Select
                                                onValueChange={(v) => setNewRoom({ ...newRoom, gender: v })}
                                                defaultValue={newRoom.gender}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Capacity (Beds)</Label>
                                            <Input
                                                type="number"
                                                value={newRoom.capacity}
                                                onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Price per session</Label>
                                            <Input
                                                placeholder="0.00"
                                                value={newRoom.price}
                                                onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button size="sm" className="bg-indigo-600 w-full" onClick={handleAddRoom}>Create Room</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent className="p-6">
                        {!selectedBlockId ? (
                            <div className="text-center py-12 text-slate-400">
                                <Plus className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">Select or create a block to manage rooms.</p>
                            </div>
                        ) : filteredRooms.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                                <Plus className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">No rooms yet in this block.</p>
                                <Button
                                    variant="link"
                                    className="text-indigo-600 font-bold"
                                    onClick={() => setShowAddRoom(true)}
                                >
                                    Add the first room
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredRooms.map((r) => (
                                    <div key={r.id} className="group relative bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:border-indigo-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-xl font-black text-slate-800">#{r.roomNumber}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.gender}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRoom(r.id)}
                                                className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                                                <span>Occupancy</span>
                                                <span className={r.occupiedCount >= r.capacity ? "text-rose-500" : "text-emerald-500"}>
                                                    {r.occupiedCount} / {r.capacity}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${r.occupiedCount >= r.capacity ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${(r.occupiedCount / r.capacity) * 100}%` }}
                                                />
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 mt-2">₦{Number(r.price).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
