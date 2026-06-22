"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Trash2,
    Save,
    LayoutGrid,
    Smile,
    Activity,
    AlertCircle,
    Loader2
} from "lucide-react";
import { getAffectiveTraits, updateAffectiveTrait } from "@/actions/teachers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Trait {
    id: number;
    name: string;
    category: 'affective' | 'psychomotor';
}

export default function TraitManagement() {
    const [traits, setTraits] = useState<Trait[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null);

    useEffect(() => {
        fetchTraits();
    }, []);

    const fetchTraits = async () => {
        setLoading(true);
        const data = await getAffectiveTraits();
        setTraits(data as Trait[]);
        setLoading(false);
    };

    const handleAdd = (category: 'affective' | 'psychomotor') => {
        const newTrait: Trait = {
            id: 0, // Temporary ID for unsaved
            name: "",
            category
        };
        setTraits([...traits, newTrait]);
    };

    const handleSave = async (trait: Trait, index: number) => {
        if (!trait.name) return toast.error("Trait name is required");
        
        setSaving(index);
        const res = await updateAffectiveTrait({
            id: trait.id === 0 ? undefined : trait.id,
            name: trait.name,
            category: trait.category,
            isActive: true
        });

        if (res.success) {
            toast.success("Trait definition updated");
            fetchTraits();
        } else {
            toast.error("Failed to update trait");
        }
        setSaving(null);
    };

    const handleDelete = async (trait: Trait) => {
        if (trait.id === 0) {
            setTraits(traits.filter(t => t !== trait));
            return;
        }
        
        if (confirm("Deactivate this trait? This won't delete historical scores but will hide it from future entry.")) {
            await updateAffectiveTrait({ id: trait.id, isActive: false, name: trait.name, category: trait.category });
            fetchTraits();
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trait Configuration</h2>
                    <p className="text-slate-500 mt-1">Define behavioral and physical traits for student evaluation</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['affective', 'psychomotor'].map((cat) => (
                    <Card key={cat} className="border-none shadow-sm rounded-[2.5rem] overflow-hidden">
                        <CardHeader className={cn("text-white p-8", cat === 'affective' ? "bg-indigo-600" : "bg-emerald-600")}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    {cat === 'affective' ? <Smile className="w-8 h-8" /> : <Activity className="w-8 h-8" />}
                                    <div>
                                        <CardTitle className="text-2xl font-black uppercase tracking-tight">
                                            {cat} Domain
                                        </CardTitle>
                                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Behavioral Standards</p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => handleAdd(cat as any)}
                                    size="sm"
                                    className="bg-white/20 hover:bg-white/30 text-white border-none rounded-xl font-bold"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add New
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4">
                            {traits.filter(t => t.category === cat).map((trait, idx) => (
                                <div key={idx} className="flex gap-3 items-center group">
                                    <div className="flex-1">
                                        <Input 
                                            value={trait.name}
                                            placeholder="e.g. Punctuality, Neatness..."
                                            onChange={(e) => {
                                                const newTraits = [...traits];
                                                const targetIdx = traits.indexOf(trait);
                                                newTraits[targetIdx].name = e.target.value;
                                                setTraits(newTraits);
                                            }}
                                            className="rounded-xl h-12 border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                                        />
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        onClick={() => handleSave(trait, idx)}
                                        disabled={saving === idx}
                                        className="h-12 w-12 rounded-xl text-indigo-600 border-indigo-100 hover:bg-indigo-50"
                                    >
                                        {saving === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleDelete(trait)}
                                        className="h-12 w-12 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {traits.filter(t => t.category === cat).length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <AlertCircle className="w-10 h-10 border-none mx-auto mb-3 opacity-20" />
                                    <p className="text-sm italic">No traits defined for this domain.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
