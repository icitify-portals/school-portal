"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Printer, ShieldCheck, CheckCircle2, Clock, Users, ArrowRight,
    Download, QrCode, Sparkles, Layers, Sliders, AlertTriangle,
    FileText, ExternalLink, Camera, RefreshCw, BookOpen
} from "lucide-react";
import Link from "next/link";

export default function ICTIDCardGuidePage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
            {/* Top Bar / Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm print:border-none print:shadow-none print:p-0">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
                        <BookOpen className="w-7 h-7 text-amber-300" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                ICT Operational Standard
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">• ISO CR80 PVC Production</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase mt-1">
                            ICT Officer ID Card Production &amp; Bulk Printing Guide
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">
                            Standard operating procedures for student identity gating, live proofing, PVC batch printing, and barcode attendance activation.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 print:hidden">
                    <Button
                        onClick={() => window.print()}
                        variant="outline"
                        className="rounded-xl border-slate-300 font-bold text-xs gap-1.5 shadow-sm"
                    >
                        <Printer className="w-4 h-4 text-slate-600" />
                        Print Desk Reference (A4)
                    </Button>
                    <Link href="/admin/ict/print-queue">
                        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-md">
                            <Layers className="w-4 h-4" />
                            Open Print Queue
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                <Link href="/admin/ict/print-queue" className="group">
                    <Card className="h-full border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all rounded-2xl">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Printer className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">Print Queue</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Manage pending print jobs and launch PVC batches</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/ict/photo-capture" className="group">
                    <Card className="h-full border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all rounded-2xl">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Camera className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">Photo Capture</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Capture or upload webcam passports for returning students</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/registrar/id-cards" className="group">
                    <Card className="h-full border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all rounded-2xl">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <Download className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">Asset Export</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Export student photos and signatures for external bureaus</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/identity" className="group">
                    <Card className="h-full border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all rounded-2xl">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">Identity Center</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Search and inspect all active student and staff credentials</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* MAIN 5-STAGE WORKFLOW SEQUENCE */}
            <div className="space-y-6">
                <div className="border-b border-slate-200 pb-3">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        1. End-to-End Production Sequence (Workflow)
                    </h2>
                    <p className="text-xs text-slate-500">
                        Follow this sequential workflow to produce cards with 100% data integrity and electronic attendance compliance.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Stage 1 */}
                    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                        <CardHeader className="p-5 pb-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center mb-2 shadow">
                                1
                            </div>
                            <CardTitle className="text-sm font-black text-slate-900 uppercase">
                                Eligibility &amp; Auto-Queuing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-1 text-xs text-slate-600 space-y-2">
                            <p>
                                <strong>Freshmen (ND 1 / HND 1):</strong> Automatically queued once their acceptance fee is verified. The portal imports their passport photo and signature from admission data.
                            </p>
                            <p>
                                <strong>Returning (ND 2 / HND 2):</strong> Must have photos captured via <Link href="/admin/ict/photo-capture" className="text-indigo-600 font-bold underline">Photo Capture</Link>, then issued via the Print Queue Issue Panel.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Stage 2 */}
                    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                        <CardHeader className="p-5 pb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center mb-2 shadow">
                                2
                            </div>
                            <CardTitle className="text-sm font-black text-slate-900 uppercase">
                                Proofing &amp; Review
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-1 text-xs text-slate-600 space-y-2">
                            <p>
                                Inspect the interactive proof panel on <Link href="/admin/ict/print-queue" className="text-indigo-600 font-bold underline">Print Queue</Link>.
                            </p>
                            <p>
                                Verify student full name, matriculation number, department, passport photo clarity, and signature alignment before queuing the physical print run.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Stage 3 */}
                    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                        <CardHeader className="p-5 pb-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center mb-2 shadow">
                                3
                            </div>
                            <CardTitle className="text-sm font-black text-slate-900 uppercase">
                                Filtering &amp; Batching
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-1 text-xs text-slate-600 space-y-2">
                            <p>
                                Filter by <strong>Status: Pending</strong> to display unprinted cards.
                            </p>
                            <p>
                                Optionally filter by <strong>Programme (ND/HND)</strong> or <strong>Level (Level 1/Level 2)</strong>.
                            </p>
                            <p>
                                Select specific cards using checkboxes or click <strong>&quot;Select All on Page&quot;</strong>.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Stage 4 */}
                    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                        <CardHeader className="p-5 pb-2">
                            <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center mb-2 shadow">
                                4
                            </div>
                            <CardTitle className="text-sm font-black text-slate-900 uppercase">
                                PVC Print Engine
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-1 text-xs text-slate-600 space-y-2">
                            <p>
                                Click <strong>&quot;Print Selected&quot;</strong> to open the multi-card print sheet.
                            </p>
                            <p>
                                Choose <strong>Both Sides (Duplex)</strong> or <strong>Front Only / Back Only</strong>.
                            </p>
                            <p>
                                Send directly to thermal PVC card printer or select <strong>&quot;Save as PDF&quot;</strong> for bulk storage.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Stage 5 */}
                    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                        <CardHeader className="p-5 pb-2">
                            <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center mb-2 shadow">
                                5
                            </div>
                            <CardTitle className="text-sm font-black text-slate-900 uppercase">
                                Mark Printed &amp; Activate
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-1 text-xs text-slate-600 space-y-2">
                            <p>
                                Once the cards exit the hopper, click <strong>&quot;Mark Printed&quot;</strong>.
                            </p>
                            <p>
                                This updates card status from <em>pending</em> to <em>printed</em>, notifies the student, and activates the Code 128 barcode for electronic attendance scanning.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* BULK CAPABILITIES & INSTRUCTIONS */}
            <div className="space-y-6">
                <div className="border-b border-slate-200 pb-3">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-600" />
                        2. How Bulk Operations Work
                    </h2>
                    <p className="text-xs text-slate-500">
                        The school portal supports two distinct bulk operations for different printing scenarios:
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Method A */}
                    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="h-2 bg-indigo-600 w-full" />
                        <CardHeader className="p-6 pb-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                    Method A • Recommended
                                </span>
                                <span className="text-xs font-bold text-slate-400">Direct Batch Thermal Printing</span>
                            </div>
                            <CardTitle className="text-base font-black text-slate-900 mt-2">
                                Bulk PDF &amp; Direct Multi-Card Printing
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                For in-house production using PVC card printers (Evolis, Zebra, Fargo, Datacard).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 text-xs text-slate-600 space-y-3">
                            <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                                <li>
                                    Go to <strong>ICT Print Queue</strong> (<code className="text-indigo-600 font-mono">/admin/ict/print-queue</code>).
                                </li>
                                <li>
                                    Click <strong>&quot;Select All on Page&quot;</strong> or check the desired students (e.g. 20–50 students).
                                </li>
                                <li>
                                    Click the green <strong>&quot;Print Selected (X)&quot;</strong> button at the top right.
                                </li>
                                <li>
                                    The system opens the dedicated batch print engine (<code className="text-indigo-600 font-mono">/admin/ict/print-queue/print?ids=...</code>) containing all cards arranged consecutively.
                                </li>
                                <li>
                                    Press <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono text-[10px]">Ctrl + P</kbd> (or click Print). In the browser dialog:
                                    <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-500">
                                        <li><strong>Destination:</strong> Select your PVC ID Card Printer, OR select <strong>&quot;Save as PDF&quot;</strong> to export all cards into one multi-page PDF.</li>
                                        <li><strong>Margins:</strong> None / 0mm.</li>
                                        <li><strong>Paper Size:</strong> CR80 / Credit Card Size (85.6mm &times; 53.98mm).</li>
                                    </ul>
                                </li>
                                <li>
                                    Click <strong>&quot;Mark Printed&quot;</strong> on the print page to update the batch status in one click.
                                </li>
                            </ol>
                        </CardContent>
                    </Card>

                    {/* Method B */}
                    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="h-2 bg-emerald-600 w-full" />
                        <CardHeader className="p-6 pb-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                    Method B • Bureau Export
                                </span>
                                <span className="text-xs font-bold text-slate-400">Raw Asset &amp; Bio-Data Package</span>
                            </div>
                            <CardTitle className="text-base font-black text-slate-900 mt-2">
                                Bulk Asset Export for External Print Press
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                For external commercial printing contractors or card software (CardExchange, CorelDraw, Asure ID).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 text-xs text-slate-600 space-y-3">
                            <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                                <li>
                                    Go to <strong>ID Card Assets &amp; Schedule</strong> (<code className="text-emerald-600 font-mono">/admin/registrar/id-cards</code>).
                                </li>
                                <li>
                                    Filter by <strong>Programme Type (ND / HND)</strong> and <strong>Level (Level 1 / Level 2)</strong>.
                                </li>
                                <li>
                                    For any student, you can view and export:
                                    <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-500">
                                        <li><strong>Passport Photo:</strong> Download original high-DPI image (<code className="font-mono">photo_matric.jpg</code>).</li>
                                        <li><strong>Digital Signature:</strong> Transparent PNG signature (<code className="font-mono">signature_matric.jpg</code>).</li>
                                        <li><strong>Form Data JSON:</strong> Complete structured bio-data (<code className="font-mono">form_matric.json</code>).</li>
                                    </ul>
                                </li>
                                <li>
                                    Click the direct download icons to save assets for bulk database merging into external printing software.
                                </li>
                            </ol>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* TECHNICAL CARD SPECIFICATIONS */}
            <div className="space-y-6">
                <div className="border-b border-slate-200 pb-3">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-indigo-600" />
                        3. Technical &amp; Printer Specifications
                    </h2>
                    <p className="text-xs text-slate-500">
                        Hardware standards and printing parameters configured in the portal template.
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="p-3">Parameter</th>
                                <th className="p-3">Specification</th>
                                <th className="p-3">Operational Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="p-3 font-bold text-slate-900">Standard Card Format</td>
                                <td className="p-3 font-mono font-bold text-indigo-700">ISO/IEC 7810 ID-1 (CR80)</td>
                                <td className="p-3 text-slate-600">Standard plastic credit/identity card form factor.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold text-slate-900">Physical Dimensions</td>
                                <td className="p-3 font-mono font-bold text-indigo-700">85.60 mm &times; 53.98 mm (3.370 &times; 2.125 in)</td>
                                <td className="p-3 text-slate-600">Renderer renders at 504 &times; 318px scaled precisely to 85.6 &times; 53.98mm.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold text-slate-900">Card Thickness</td>
                                <td className="p-3 font-mono font-bold text-indigo-700">30 mil (0.76 mm) Standard PVC</td>
                                <td className="p-3 text-slate-600">Recommended for durability through campus turnstiles and library scanners.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold text-slate-900">Barcode Symbology</td>
                                <td className="p-3 font-mono font-bold text-indigo-700">Code 128 (High-Density Linear Barcode)</td>
                                <td className="p-3 text-slate-600">Encodes student matriculation number for instant offline and online scanning.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold text-slate-900">Security QR Code</td>
                                <td className="p-3 font-mono font-bold text-indigo-700">2D Dynamic Verification Matrix</td>
                                <td className="p-3 text-slate-600">Directly resolves to <code className="font-mono">https://portal.fssibadan.edu.ng/verify/id/[code]</code>.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold text-slate-900">Printer Ribbon Compatibility</td>
                                <td className="p-3 font-mono font-bold text-indigo-700">YMCKO (Color) / YMCKOK (Dual-Sided Color+K)</td>
                                <td className="p-3 text-slate-600">Resin K panel ensures razor-sharp 100% black barcode lines that scan instantly.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TROUBLESHOOTING & EDGE CASES */}
            <div className="space-y-6">
                <div className="border-b border-slate-200 pb-3">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        4. Troubleshooting &amp; Special Workflows
                    </h2>
                    <p className="text-xs text-slate-500">
                        How to handle missing data, lost card replacement requests, and reprint queues.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                        <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-indigo-600" /> Student Has No Photo / Signature
                        </h4>
                        <p className="text-slate-600 leading-relaxed">
                            If a student appears with a blank photo or signature:
                        </p>
                        <ol className="list-decimal pl-4 space-y-1 text-slate-500">
                            <li>Open <Link href="/admin/ict/photo-capture" className="text-indigo-600 font-bold underline">Photo Capture</Link>.</li>
                            <li>Search for student by Matriculation or Admission number.</li>
                            <li>Capture webcam photo or upload a clean passport picture.</li>
                            <li>Upload transparent signature. Once saved, their card proof updates instantly.</li>
                        </ol>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                        <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                            <RefreshCw className="w-4 h-4 text-emerald-600" /> Lost Card Replacement Requests
                        </h4>
                        <p className="text-slate-600 leading-relaxed">
                            When a student submits a replacement request from their portal:
                        </p>
                        <ol className="list-decimal pl-4 space-y-1 text-slate-500">
                            <li>The system automatically revokes the old card&apos;s barcode.</li>
                            <li>A replacement card is queued under <strong>Pending</strong> with note <em>&quot;REPLACEMENT (lost card)&quot;</em>.</li>
                            <li>Filter by <strong>Status: Pending</strong> to print the replacement.</li>
                        </ol>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                        <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                            <QrCode className="w-4 h-4 text-purple-600" /> Barcode Reader Setup
                        </h4>
                        <p className="text-slate-600 leading-relaxed">
                            To ensure optimal scanning during exams or class attendance:
                        </p>
                        <ol className="list-decimal pl-4 space-y-1 text-slate-500">
                            <li>Set PVC printer driver printhead contrast to High/Dark on the black ribbon.</li>
                            <li>Configure 1D handheld USB or Bluetooth laser scanners to Standard Code 128 mode with Auto-Enter suffix.</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 bg-slate-900 text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                <div>
                    <h3 className="font-black text-base uppercase">Ready to Start ID Card Production?</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Proceed to the print queue to process batches and review student card proofs.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/ict/print-queue">
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow px-5">
                            Go to Print Queue <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
