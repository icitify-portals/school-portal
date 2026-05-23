"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface OrderingEditorProps {
    question: any;
    updateQuestion: (updates: any) => void;
}

export function OrderingEditor({ question, updateQuestion }: OrderingEditorProps) {
    const items = question.options || ["", "", ""];

    const handleUpdateItem = (index: number, value: string) => {
        const newItems = [...items];
        newItems[index] = value;
        updateQuestion({ options: newItems });
    };

    const addItem = () => {
        updateQuestion({ options: [...items, ""] });
    };

    const removeItem = (index: number) => {
        if (items.length <= 2) return;
        const newItems = items.filter((_: any, i: number) => i !== index);
        updateQuestion({ options: newItems });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">Ordering Items</h3>
                    <p className="text-[10px] text-slate-500 font-medium">List items in their CORRECT sequence</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="rounded-xl h-9 border-slate-200 text-indigo-600 hover:text-indigo-700"
                >
                    <Plus className="w-4 h-4 mr-1" /> Add Option
                </Button>
            </div>

            <div className="space-y-2">
                {items.map((item: string, index: number) => (
                    <div key={index} className="group flex items-center gap-3 animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="w-8 h-10 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-black text-slate-400">
                            {index + 1}
                        </div>
                        <div className="flex-1 relative">
                            <Input
                                value={item}
                                onChange={(e) => handleUpdateItem(index, e.target.value)}
                                placeholder={`Item ${index + 1}`}
                                className="h-11 rounded-xl border-slate-200 pr-10"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                                <GripVertical className="w-4 h-4" />
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-amber-600 rotate-45" />
                </div>
                <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                    <strong>Pro Tip:</strong> These items will be SHUFFLED when shown to the student. They must drag them back into the order you define here.
                </p>
            </div>
        </div>
    );
}
