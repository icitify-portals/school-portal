"use client";

import { useState } from "react";
import { 
    ShoppingBag, 
    Zap, 
    Palette, 
    Star, 
    Lock, 
    CheckCircle2,
    Clock,
    Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ShopItem {
    id: string;
    name: string;
    price: number;
    description: string;
    icon: any;
    category: 'theme' | 'powerup' | 'cosmetic';
    unlocked: boolean;
}

const shopItems: ShopItem[] = [
    { 
        id: "1", 
        name: "Neon Night Theme", 
        price: 500, 
        description: "A sleek, dark theme with glowing neon highlights.", 
        icon: Palette, 
        category: 'theme', 
        unlocked: false 
    },
    { 
        id: "2", 
        name: "Second Chance", 
        price: 250, 
        description: "Erase one incorrect answer in Practice Mode.", 
        icon: Zap, 
        category: 'powerup', 
        unlocked: false 
    },
    { 
        id: "3", 
        name: "Golden Avatar Frame", 
        price: 1000, 
        description: "Stand out on the leaderboard with a premium border.", 
        icon: Sparkles, 
        category: 'cosmetic', 
        unlocked: true 
    },
    { 
        id: "4", 
        name: "Time-Bender", 
        price: 300, 
        description: "Get an extra 5 minutes on your next Mock Exam.", 
        icon: Clock, 
        category: 'powerup', 
        unlocked: false 
    },
];

export function HeroShop({ coins }: { coins: number }) {
    const [activeTab, setActiveTab] = useState<'all' | 'theme' | 'powerup'>('all');

    const filteredItems = shopItems.filter(item => activeTab === 'all' || item.category === activeTab);

    return (
        <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[3rem] overflow-hidden bg-white">
            <CardHeader className="bg-indigo-600 p-8 text-white">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tight italic">Hero <span className="text-indigo-200">Shop</span></CardTitle>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Spend your EduCoins on upgrades</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-6 py-3 bg-black/20 rounded-2xl border border-white/10 backdrop-blur-md">
                        <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                        <span className="text-2xl font-black tabular-nums">{coins.toLocaleString()}</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-8 space-y-8">
                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl w-fit">
                    {['all', 'theme', 'powerup'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredItems.map((item) => (
                        <div 
                            key={item.id}
                            className={cn(
                                "p-6 rounded-[2.5rem] border-2 flex flex-col justify-between group transition-all",
                                item.unlocked ? "border-emerald-100 bg-emerald-50/20" : "border-slate-100 hover:border-indigo-100"
                            )}
                        >
                            <div className="space-y-4">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                                    item.unlocked ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-slate-100 text-slate-400"
                                )}>
                                    <item.icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 uppercase tracking-tight">{item.name}</h4>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                {item.unlocked ? (
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Unlocked</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-900">
                                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                                        <span className="text-lg font-black tabular-nums">{item.price}</span>
                                    </div>
                                )}
                                
                                {!item.unlocked && (
                                    <Button 
                                        disabled={coins < item.price}
                                        className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[8px] tracking-widest disabled:opacity-30"
                                    >
                                        Purchase
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
