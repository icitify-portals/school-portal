"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createHostel } from "@/actions/hostels";

export function AddHostelDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: {
            name: "",
            code: "",
            type: "mixed",
            capacity: 0,
            description: ""
        }
    });

    const hostelType = watch("type");

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const res = await createHostel(data);
            if (res.success) {
                toast.success(res.message);
                setOpen(false);
                reset();
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 font-bold h-10">
                    <Plus className="w-4 h-4" /> Add New Hostel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Hostel</DialogTitle>
                    <DialogDescription>
                        Create a new hostel building. You can add blocks and rooms later.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Hostel Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Mandela Hall"
                            {...register("name", { required: true })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Short Code</Label>
                            <Input
                                id="code"
                                placeholder="e.g. MND"
                                {...register("code", { required: true })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Hostel Type</Label>
                            <Select
                                onValueChange={(v) => setValue("type", v as any)}
                                defaultValue={hostelType}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="mixed">Mixed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief details about the hostel..."
                            {...register("description")}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            disabled={loading}
                        >
                            {loading ? "Creating..." : "Create Hostel"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
