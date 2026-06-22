"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Quote } from 'lucide-react';
import { toast } from 'sonner';

export default function CitationGenerator({ resource }: { resource: any }) {
    const year = resource.publicationYear || new Date().getFullYear();
    const authors = resource.authors || 'Unknown Author';
    const title = resource.title;
    const publisher = resource.publisher || 'Independent';

    const makeBibtexKey = () => {
        const firstAuthor = authors.split(',')[0].split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const firstTitleWord = title.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${firstAuthor || 'unknown'}${year}${firstTitleWord || 'book'}`;
    };

    const citations = {
        APA: `${authors} (${year}). ${title}. ${publisher}.`,
        MLA: `${authors}. "${title}." ${publisher}, ${year}.`,
        Chicago: `${authors}. ${title}. ${publisher}, ${year}.`,
        BibTeX: `@book{${makeBibtexKey()},\n  author = {${authors}},\n  title = {${title}},\n  year = {${year}},\n  publisher = {${publisher}}\n}`
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Citation copied to clipboard!");
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 md:h-10 text-xs font-bold gap-2 bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-300">
                    <Quote className="h-4 w-4 text-indigo-400" />
                    Cite
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-950 text-white border-slate-800 sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">Generate Citation</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="APA" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-4 bg-slate-900">
                        <TabsTrigger value="APA">APA</TabsTrigger>
                        <TabsTrigger value="MLA">MLA</TabsTrigger>
                        <TabsTrigger value="Chicago">Chicago</TabsTrigger>
                        <TabsTrigger value="BibTeX">BibTeX</TabsTrigger>
                    </TabsList>
                    {Object.entries(citations).map(([format, text]) => (
                        <TabsContent key={format} value={format} className="mt-4">
                            <div className={`p-4 bg-slate-900 rounded-xl border border-slate-800 text-sm font-medium leading-relaxed whitespace-pre-wrap ${format === 'BibTeX' ? 'font-mono text-xs' : 'font-serif'}`}>
                                {text}
                            </div>
                            <Button 
                                onClick={() => handleCopy(text)} 
                                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 font-bold"
                            >
                                <Copy className="mr-2 h-4 w-4" /> Copy {format}
                            </Button>
                        </TabsContent>
                    ))}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
