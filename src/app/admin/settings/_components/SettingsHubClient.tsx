"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Paintbrush, 
  ToggleLeft, 
  Sliders, 
  Globe, 
  Award, 
  Layers, 
  Key, 
  Terminal, 
  Search, 
  ArrowRight, 
  TrendingUp, 
  Brain, 
  Shield, 
  Lock, 
  CreditCard, 
  Cpu, 
  Share2, 
  Database,
  Activity,
  Server
} from "lucide-react";
import BackupSettings from "./BackupSettings";

interface SettingsHubClientProps {
  initialSettings: any[];
  modulesCount: number;
}

export default function SettingsHubClient({ initialSettings, modulesCount }: SettingsHubClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"grid" | "backup">("grid");

  // Server Info mockup/details
  const serverDiagnostics = [
    { label: "Environment", value: process.env.NODE_ENV === "production" ? "Production" : "Development", color: "text-indigo-600 font-black" },
    { label: "Engine Dialect", value: "MySQL 8.0+", color: "text-slate-700" },
    { label: "Database Driver", value: "Drizzle Core", color: "text-slate-700" },
    { label: "Signaling Server", value: "LiveKit Cloud", color: "text-emerald-600 font-bold" },
    { label: "System Status", value: "Healthy", color: "text-emerald-600 font-black uppercase tracking-widest text-[9px] bg-emerald-50 px-2 py-0.5 rounded-full" }
  ];

  // Settings Modules Config Grid
  const settingsCards = [
    // BRAND & PROFILE
    {
      title: "School Profile",
      description: "Manage institutional identifiers: name, contact detail, physical address, and school currency.",
      href: "/admin/settings/institution",
      category: "Branding & Profile",
      icon: Building2,
      iconBg: "bg-indigo-50 text-indigo-600",
      status: "Epitome Academy / ₦"
    },
    {
      title: "Theme Customizer",
      description: "Configure the portal design: font sets, color schemes, light/dark styling, and card aesthetics.",
      href: "/admin/settings/theme",
      category: "Branding & Profile",
      icon: Paintbrush,
      iconBg: "bg-purple-50 text-purple-600",
      status: "Modern Elegant Choice"
    },
    {
      title: "Portal Governance",
      description: "Administer portal options: login barriers, signup open switches, public site domains, and footer logs.",
      href: "/admin/settings/portal",
      category: "Branding & Profile",
      icon: Globe,
      iconBg: "bg-sky-50 text-sky-600",
      status: "Public Registrations Open"
    },
    // GOVERNANCE
    {
      title: "Module Governance",
      description: "Switch systems globally on or off: Admissions, Finance, HR, Library, CBT, Health, and Works.",
      href: "/admin/settings/modules",
      category: "Governance & Policies",
      icon: ToggleLeft,
      iconBg: "bg-emerald-50 text-emerald-600",
      status: `${modulesCount} Active Modules`
    },
    {
      title: "Academic Officers",
      description: "Assign administration positions: VP Academics, Deans, and Heads of Departments (HOD).",
      href: "/admin/settings/officers",
      category: "Governance & Policies",
      icon: Shield,
      iconBg: "bg-rose-50 text-rose-600",
      status: "Officer Assignments Active"
    },
    {
      title: "CMS Content Managers",
      description: "Assign designated content editors and page managers to write and publish school pages.",
      href: "/admin/settings/cms-managers",
      category: "Governance & Policies",
      icon: Globe,
      iconBg: "bg-teal-50 text-teal-600",
      status: "CMS Managers Active"
    },
    {
      title: "Matriculation Rules",
      description: "Define generation structures for student matriculation numbers and staff identification prefixes.",
      href: "/admin/settings/matriculation",
      category: "Governance & Policies",
      icon: Lock,
      iconBg: "bg-amber-50 text-amber-600",
      status: "Format: Year/Dept/Code"
    },
    // ACADEMICS
    {
      title: "Grading & GPA",
      description: "Establish academic ranges: grade points, boundary marks, and honors classes.",
      href: "/admin/settings/grading",
      category: "Academics & Evaluation",
      icon: Award,
      iconBg: "bg-orange-50 text-orange-600",
      status: "5.0 CGPA Standard"
    },
    {
      title: "K-12 Grade Levels",
      description: "Design levels: nursery classes, grade categories, and senior secondary division tags.",
      href: "/admin/settings/k12",
      category: "Academics & Evaluation",
      icon: Layers,
      iconBg: "bg-yellow-50 text-yellow-600",
      status: "K-12 Support Enabled"
    },
    {
      title: "Assessment Rubrics",
      description: "Create standard rubrics for class assignments, examinations, and project grading grids.",
      href: "/admin/settings/rubrics",
      category: "Academics & Evaluation",
      icon: Sliders,
      iconBg: "bg-teal-50 text-teal-600",
      status: "Standardized Rubrics Set"
    },
    // FINANCE & SERVICE
    {
      title: "Payment Gateways",
      description: "Input credentials and parameters for gateway channels: Remita, Flutterwave, and Paystack.",
      href: "/admin/settings/payment-gateways",
      category: "Finance & Integrations",
      icon: CreditCard,
      iconBg: "bg-green-50 text-green-600",
      status: "Paystack + Remita Configured"
    },
    {
      title: "External Integrations",
      description: "Manage APIs and media buckets: AWS S3 storage, Twilio SMS routing, and Resend mail services.",
      href: "/admin/settings/integrations",
      category: "Finance & Integrations",
      icon: Cpu,
      iconBg: "bg-pink-50 text-pink-600",
      status: "Storage: AWS S3 Live"
    },
    {
      title: "AI Services & Engines",
      description: "Configure model choices, automated assessment prompts, and chatbot capabilities.",
      href: "/admin/settings/ai",
      category: "Finance & Integrations",
      icon: Brain,
      iconBg: "bg-indigo-50 text-indigo-600",
      status: "Gemini Model Active"
    },
    {
      title: "Gamification Metrics",
      description: "Adjust parameters for student performance leaderboards, badges, and point logs.",
      href: "/admin/settings/leaderboard",
      category: "Finance & Integrations",
      icon: TrendingUp,
      iconBg: "bg-blue-50 text-blue-600",
      status: "Engagement Logs Active"
    },
    // DEV & DEVOPS
    {
      title: "System Units",
      description: "Map institutional structures: administrative departments, faculties, and core colleges.",
      href: "/admin/settings/units",
      category: "System & DevOps",
      icon: Share2,
      iconBg: "bg-violet-50 text-violet-600",
      status: "Departments Synced"
    },
    {
      title: "Environment Variables",
      description: "Read active server environment keys and system parameters (read-only verification).",
      href: "/admin/settings/env",
      category: "System & DevOps",
      icon: Key,
      iconBg: "bg-neutral-100 text-neutral-600",
      status: "Keys Synced"
    },
    {
      title: "Developer Console",
      description: "View endpoint status logs, database migrations registry, and run diagnostic queries.",
      href: "/admin/settings/developer",
      category: "System & DevOps",
      icon: Terminal,
      iconBg: "bg-slate-900 text-slate-100",
      status: "Dev console active"
    }
  ];

  // Filter cards based on search input
  const filteredCards = settingsCards.filter(card => 
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered cards by category
  const categories = filteredCards.reduce((acc: Record<string, typeof settingsCards>, card) => {
    if (!acc[card.category]) acc[card.category] = [];
    acc[card.category].push(card);
    return acc;
  }, {} as Record<string, typeof settingsCards>);

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase italic">
            <Activity className="w-10 h-10 text-indigo-600" />
            Portal Settings Hub
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Configure institution parameters, module variables, payment gateways, and system DevOps.</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 w-full lg:w-auto shrink-0 shadow-inner">
          <Button
            onClick={() => setActiveTab("grid")}
            className={`font-black uppercase text-[10px] tracking-widest h-11 px-6 rounded-xl transition-all ${activeTab === "grid" ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "bg-transparent text-slate-500 hover:bg-slate-200 border-none shadow-none"}`}
          >
            Settings Grid
          </Button>
          <Button
            onClick={() => setActiveTab("backup")}
            className={`font-black uppercase text-[10px] tracking-widest h-11 px-6 rounded-xl transition-all ${activeTab === "backup" ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "bg-transparent text-slate-500 hover:bg-slate-200 border-none shadow-none"}`}
          >
            Backup & Recovery
          </Button>
        </div>
      </div>

      {activeTab === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Main Grid Section */}
          <div className="lg:col-span-3 space-y-8">
            {/* Search Input */}
            <div className="relative w-full shadow-lg shadow-indigo-50/50 rounded-2xl">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search settings module (e.g. grading, payment gateways, theme)..."
                className="pl-12 h-14 rounded-2xl border-none focus:ring-2 focus:ring-indigo-200 text-sm font-medium bg-white placeholder:text-slate-300 shadow-sm"
              />
            </div>

            {/* Render Category Blocks */}
            {Object.keys(categories).length === 0 ? (
              <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[3rem] p-16 text-center">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <p className="text-slate-400 text-sm font-medium">No settings directories match your search query.</p>
              </Card>
            ) : (
              Object.entries(categories).map(([categoryName, cards]) => (
                <div key={categoryName} className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 pl-2">{categoryName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cards.map(card => {
                      const Icon = card.icon;
                      return (
                        <Link href={card.href} key={card.title} className="group">
                          <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 hover:border-indigo-200 shadow-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] rounded-[2rem] p-6 flex flex-col justify-between h-[230px] transition-all duration-300 relative overflow-hidden group">
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center transition-all group-hover:scale-110 duration-300`}>
                                  <Icon className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-all transform group-hover:translate-x-1" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-black text-slate-900 group-hover:text-indigo-600 uppercase italic text-sm transition-all leading-tight">
                                  {card.title}
                                </h4>
                                <p className="text-slate-400 text-[11px] font-medium leading-relaxed line-clamp-3">
                                  {card.description}
                                </p>
                              </div>
                            </div>
                            <div className="border-t border-slate-100 pt-3 mt-4">
                              <Badge className="bg-slate-50 text-slate-500 hover:bg-slate-100 border-none font-bold uppercase tracking-tight text-[8px] px-2 py-0.5 rounded-full">
                                {card.status}
                              </Badge>
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Diagnostics Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden p-6">
              <CardHeader className="p-0 pb-4 border-b border-slate-100 mb-6 flex flex-row items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-black uppercase italic tracking-tight text-slate-900">Diagnostics</CardTitle>
                  <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">System Status Monitor</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {serverDiagnostics.map(item => (
                  <div key={item.label} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{item.label}</span>
                    <span className={item.color}>{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-indigo-950 text-white p-6 relative">
              <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-6 -translate-y-6">
                <Database className="w-48 h-48" />
              </div>
              <CardHeader className="p-0 pb-3">
                <Badge className="bg-white/10 text-white hover:bg-white/20 border-none font-black uppercase text-[8px] tracking-widest w-fit mb-3">Backup Quick Action</Badge>
                <CardTitle className="text-lg font-black uppercase italic tracking-tight leading-none text-white">Database Snapshot</CardTitle>
                <CardDescription className="text-slate-300 font-medium text-xs mt-1">Export, download, and manage system database dumps in backup console.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <Button 
                  onClick={() => setActiveTab("backup")}
                  className="w-full bg-white hover:bg-indigo-50 text-indigo-950 font-black uppercase tracking-widest text-[9px] h-10 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  Backup Console
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white p-8">
          <BackupSettings />
        </Card>
      )}
    </div>
  );
}
