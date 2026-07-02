"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  logVehicleMovementAction, 
  logPatrolAction, 
  reportIncidentAction, 
  getSecurityDashboardStatsAction 
} from "@/actions/security-unit-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Shield, 
  QrCode, 
  Car, 
  AlertTriangle, 
  ListFilter,
  CheckCircle2,
  Clock,
  MapPin,
  ClipboardList,
  Flame,
  UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const IncidentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Please provide description details"),
  incidentType: z.enum(['theft', 'trespass', 'property_damage', 'assault', 'accident', 'fire_hazard', 'medical_emergency', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  location: z.string().min(3, "Incident location is required"),
});

type IncidentFormValues = z.infer<typeof IncidentSchema>;

export default function SecurityOfficerPage() {
  const [activeTab, setActiveTab] = useState<"gate" | "patrol" | "incident" | "feed">("gate");
  const [loading, setLoading] = useState(true);
  const [allCheckpoints, setAllCheckpoints] = useState<any[]>([]);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  
  // Gate scan inputs
  const [gateName, setGateName] = useState("Main Gate");
  const [qrInput, setQrInput] = useState("");
  const [direction, setDirection] = useState<'entry' | 'exit'>("entry");
  const [recentVehicleLogs, setRecentVehicleLogs] = useState<any[]>([]);
  const [recentPatrolLogs, setRecentPatrolLogs] = useState<any[]>([]);

  // Patrol scan inputs
  const [selectedCheckpoint, setSelectedCheckpoint] = useState("");
  const [patrolNotes, setPatrolNotes] = useState("");

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<IncidentFormValues>({
    resolver: zodResolver(IncidentSchema),
    defaultValues: {
      incidentType: "other",
      severity: "medium",
    }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getSecurityDashboardStatsAction();
      if (res.success) {
        setAllCheckpoints(res.checkpoints || []);
        setAllVehicles(res.vehicles || []);
        setRecentVehicleLogs(res.vehicleLogs || []);
        setRecentPatrolLogs(res.patrolLogs || []);
      } else {
        toast.error(res.error || "Failed to load security logs");
      }
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGateScan = async (rawQr: string) => {
    if (!rawQr.trim()) {
      toast.error("Please provide a scannable vehicle QR pass token");
      return;
    }
    
    try {
      const res = await logVehicleMovementAction(rawQr, gateName, direction);
      if (res.success) {
        toast.success(res.message);
        setQrInput("");
        loadData();
      } else {
        toast.error(res.error || "Verification failed");
      }
    } catch (err) {
      toast.error("Failed to log vehicle movement");
    }
  };

  const handlePatrolLog = async () => {
    if (!selectedCheckpoint) {
      toast.error("Please select a patrol checkpoint");
      return;
    }
    
    // Find the actual QR code for the selected checkpoint
    const cp = allCheckpoints.find(c => c.id === parseInt(selectedCheckpoint));
    if (!cp) return;

    try {
      const res = await logPatrolAction(cp.qrCode, patrolNotes, "6.5244,3.3792"); // Mock GPS coords
      if (res.success) {
        toast.success(res.message);
        setPatrolNotes("");
        setSelectedCheckpoint("");
        loadData();
      } else {
        toast.error(res.error || "Failed to log patrol");
      }
    } catch (err) {
      toast.error("Failed to log patrol round");
    }
  };

  const handleIncidentSubmit = async (data: IncidentFormValues) => {
    try {
      const res = await reportIncidentAction(data);
      if (res.success) {
        toast.success(res.message);
        reset();
        setActiveTab("feed");
        loadData();
      } else {
        toast.error(res.error || "Failed to report incident");
      }
    } catch (err) {
      toast.error("An error occurred while submitting incident");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-900 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Security Officer Console</h1>
            <p className="text-slate-400 text-xs">Access gate scanners, patrol checkpoint logs, and file security incidents.</p>
          </div>
        </div>
        
        {/* Mobile-Friendly Grid Navigation tabs */}
        <div className="grid grid-cols-4 w-full md:w-auto bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab("gate")} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'gate' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Gate
          </button>
          <button 
            onClick={() => setActiveTab("patrol")} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'patrol' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Patrol
          </button>
          <button 
            onClick={() => setActiveTab("incident")} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'incident' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Report
          </button>
          <button 
            onClick={() => setActiveTab("feed")} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'feed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Logs
          </button>
        </div>
      </div>

      {/* Main Console Area */}
      {activeTab === "gate" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Scan Controls */}
          <div className="md:col-span-2 space-y-6">
            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-lg font-bold text-slate-900">Gate Access Control Scanner</CardTitle>
                <CardDescription>Select gate name, log direction, and scan/submit the vehicle's QR pass.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Active Gate Post</Label>
                    <select
                      value={gateName}
                      onChange={(e) => setGateName(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Main Gate Entrance">Main Gate (Entrance)</option>
                      <option value="Main Gate Exit">Main Gate (Exit)</option>
                      <option value="Hostel Gate Post">Hostel Gate Post</option>
                      <option value="Admin Block Gate">Admin Block Gate</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Direction</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant={direction === "entry" ? "default" : "outline"}
                        onClick={() => setDirection("entry")}
                        className={`flex-1 font-bold ${direction === "entry" ? "bg-indigo-600" : "border-slate-200"}`}
                      >
                        Vehicular Entry
                      </Button>
                      <Button 
                        type="button" 
                        variant={direction === "exit" ? "default" : "outline"}
                        onClick={() => setDirection("exit")}
                        className={`flex-1 font-bold ${direction === "exit" ? "bg-indigo-600" : "border-slate-200"}`}
                      >
                        Vehicular Exit
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qrData" className="text-xs font-bold uppercase text-slate-500">Scan QR Pass Token</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="qrData"
                      placeholder="Paste vehicle JWT/QR pass token here..."
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      className="border-slate-200 font-mono text-xs focus:ring-indigo-500"
                    />
                    <Button 
                      onClick={() => handleGateScan(qrInput)} 
                      className="bg-indigo-600 hover:bg-indigo-700 font-bold px-6"
                    >
                      Log Pass
                    </Button>
                  </div>
                </div>

                {/* Quick Simulation Section for easy evaluation */}
                <div className="border-t border-slate-100 pt-4 space-y-2 bg-slate-50/50 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Quick-Test Simulation (Approved Vehicle Permits)
                  </h4>
                  <p className="text-[10px] text-slate-400">Click on any approved license plate below to automatically copy its secure QR pass and simulate a gate scan:</p>
                  
                  {loading ? (
                    <div className="text-xs text-slate-400">Loading permit list...</div>
                  ) : allVehicles.filter(v => v.status === 'approved').length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No approved vehicle passes found in the database.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {allVehicles.filter(v => v.status === 'approved').map(v => (
                        <button
                          key={v.id}
                          onClick={() => {
                            // Find the QR pass token which we'll fetch from the vehicle list, or get it if it's there
                            const qrToken = allVehicles.find(x => x.id === v.id)?.qrCode || "";
                            setQrInput(qrToken);
                            toast.success(`Loaded QR code pass for vehicle: ${v.licensePlate}`);
                          }}
                          className="bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/10 text-xs px-2.5 py-1 rounded-lg font-extrabold uppercase text-slate-700 shadow-sm transition-all"
                        >
                          {v.licensePlate} ({v.ownerName})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats sidebar */}
          <div className="space-y-4">
            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-sm font-bold text-slate-800">Traffic Quick-Feed</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {recentVehicleLogs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs italic">
                    No vehicle logs registered today.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {recentVehicleLogs.map((log) => (
                      <div key={log.id} className="p-3 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-extrabold uppercase text-slate-900">{log.licensePlate}</span>
                          <span className="text-[10px] text-slate-400 block">{log.gateName}</span>
                        </div>
                        <Badge className={`text-[9px] font-bold uppercase ${
                          log.direction === 'entry' ? 'bg-emerald-50 text-emerald-600 border-none' : 'bg-amber-50 text-amber-600 border-none'
                        }`}>
                          {log.direction}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "patrol" && (
        <Card className="max-w-2xl mx-auto border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-900">Security Checkpoint Patrol Log</CardTitle>
            <CardDescription>Select the strategic position you are scanning and write any security remarks/notes.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Checkpoint Location</Label>
              <select
                value={selectedCheckpoint}
                onChange={(e) => setSelectedCheckpoint(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Patrol Checkpoint --</option>
                {allCheckpoints.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patrolNotes" className="text-xs font-bold uppercase text-slate-500">Patrol Safety Remarks</Label>
              <Textarea 
                id="patrolNotes"
                placeholder="Enter remarks e.g. 'All security gates locked. No suspicious activity observed.'"
                value={patrolNotes}
                onChange={(e) => setPatrolNotes(e.target.value)}
                className="border-slate-200 focus:ring-indigo-500 min-h-24"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                onClick={handlePatrolLog}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl transition-all"
              >
                Log Checkpoint Scan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "incident" && (
        <Card className="max-w-2xl mx-auto border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-5">
            <CardTitle className="text-lg font-bold text-slate-900">Security Incident Form</CardTitle>
            <CardDescription>Log security incidents or hazardous situations directly to the CSO command office.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(handleIncidentSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold uppercase text-slate-500">Incident Headline</Label>
                <Input 
                  id="title"
                  placeholder="e.g. Broken perimeter fence near Hostel C"
                  {...register("title")}
                  className="border-slate-200 focus:ring-indigo-500"
                />
                {errors.title && <p className="text-[11px] font-bold text-red-500">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incidentType" className="text-xs font-bold uppercase text-slate-500">Incident Category</Label>
                  <select
                    id="incidentType"
                    {...register("incidentType")}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="theft">Theft / Burglary</option>
                    <option value="trespass">Trespassing</option>
                    <option value="property_damage">Property Damage / Vandalism</option>
                    <option value="assault">Assault / Altercation</option>
                    <option value="accident">Accident / Vehicle Crash</option>
                    <option value="fire_hazard">Fire Hazard / Sparking</option>
                    <option value="medical_emergency">Medical Emergency</option>
                    <option value="other">Other Incident</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity" className="text-xs font-bold uppercase text-slate-500">Severity Level</Label>
                  <select
                    id="severity"
                    {...register("severity")}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low (Minor anomaly)</option>
                    <option value="medium">Medium (Requires attention)</option>
                    <option value="high">High (Immediate intervention)</option>
                    <option value="critical">Critical (Life/Security threat)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-bold uppercase text-slate-500">Specific Location</Label>
                <Input 
                  id="location"
                  placeholder="e.g. Science Laboratory Block East Entrance"
                  {...register("location")}
                  className="border-slate-200 focus:ring-indigo-500"
                />
                {errors.location && <p className="text-[11px] font-bold text-red-500">{errors.location.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase text-slate-500">Detailed Description</Label>
                <Textarea 
                  id="description"
                  placeholder="Provide precise descriptions of individuals, timings, and actions..."
                  {...register("description")}
                  className="border-slate-200 focus:ring-indigo-500 min-h-24"
                />
                {errors.description && <p className="text-[11px] font-bold text-red-500">{errors.description.message}</p>}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-50">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl transition-all"
                >
                  {isSubmitting ? "Submitting Alert..." : "Report Incident"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "feed" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Patrol Log Feed */}
          <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                <ClipboardList className="w-5 h-5 text-indigo-600" /> Recent Patrol Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentPatrolLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic text-sm">
                  No patrol rounds logged today.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {recentPatrolLogs.map((log) => (
                    <div key={log.id} className="p-4 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-900">{log.checkpointName}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.scannedAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 italic">"{log.notes || 'No remarks recorded'}"</p>
                      <div className="text-[9px] font-bold text-indigo-500">By: {log.officerName}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gate scan Feed */}
          <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                <Car className="w-5 h-5 text-indigo-600" /> Gate Traffic Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentVehicleLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic text-sm">
                  No vehicle entries/exits logged today.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {recentVehicleLogs.map((log) => (
                    <div key={log.id} className="p-4 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-extrabold text-slate-900 uppercase">{log.licensePlate} ({log.ownerName})</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{log.gateName}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge className={`text-[9px] font-bold uppercase border-none ${
                          log.direction === 'entry' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {log.direction}
                        </Badge>
                        <div className="text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
