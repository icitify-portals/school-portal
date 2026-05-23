"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps {
    totalItems: number;
    pageSize: number;
    currentPage: number;
}

export function DataTablePagination({
    totalItems,
    pageSize,
    currentPage,
}: DataTablePaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const totalPages = Math.ceil(totalItems / pageSize);

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const handlePageSizeChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("pageSize", value);
        params.set("page", "1"); // Reset to first page
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleNavigate = (page: number) => {
        router.push(createPageURL(page));
    };

    if (totalItems === 0) return null;

    return (
        <div className="flex flex-col md:flex-row items-center justify-between px-8 py-6 gap-4 bg-slate-50/50">
            <div className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {totalItems} total record{totalItems !== 1 ? "s" : ""}
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rows per page</p>
                    <Select
                        value={pageSize.toString()}
                        onValueChange={handlePageSizeChange}
                    >
                        <SelectTrigger className="h-9 w-[70px] rounded-xl border-slate-200 bg-white font-bold text-xs">
                            <SelectValue placeholder={pageSize.toString()} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                            {[10, 20, 50, 100].map((size) => (
                                <SelectItem key={size} value={`${size}`} className="text-xs font-bold">
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-800">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="outline"
                        className="hidden h-9 w-9 p-0 lg:flex rounded-xl border-slate-200 bg-white shadow-sm"
                        onClick={() => handleNavigate(1)}
                        disabled={currentPage <= 1}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-9 w-9 p-0 rounded-xl border-slate-200 bg-white shadow-sm"
                        onClick={() => handleNavigate(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-9 w-9 p-0 rounded-xl border-slate-200 bg-white shadow-sm"
                        onClick={() => handleNavigate(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-9 w-9 p-0 lg:flex rounded-xl border-slate-200 bg-white shadow-sm"
                        onClick={() => handleNavigate(totalPages)}
                        disabled={currentPage >= totalPages}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
