"use client";

import { useState, useEffect } from "react";
import { 
  getSecurityDashboardStatsAction, 
  approveVehiclePassAction, 
  createStrategicPositionAction, 
  resolveIncidentAction 
} from "@/actions/security-unit-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  ShieldAlert, 
  Car, 
  Compass, 
  FileText, 
  Activity, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  MapPin, 
  Printer, 
  FileCheck2,
  Lock,
  UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SecurityDirectorPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    activePatrolsCount: 0,
    openIncidentsCount: 0,
    gateTrafficCount: 0,
    pendingPassesCount: 0,
  });
  
  const [incidents, setIncidents] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [patrolLogs, setPatrolLogs] = useState<any[]>([]);
  const [vehicleLogs, setVehicleLogs] = useState<any[]>([]);

  // Checkpoint creation inputs
  const [checkpointName, setCheckpointName] = useState("");
  const [checkpointDesc, setCheckpointDesc] = useState("");

  // Incident resolution modal states
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [incidentStatus, setIncidentStatus] = useState<'under_investigation' | 'resolved' | 'closed'>("under_investigation");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Print state for checkpoint placards
  const [selectedCheckpointForPrint, setSelectedCheckpointForPrint] = useState<any | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await getSecurityDashboardStatsAction();
      if (res.success) {
        setStats(res.stats);
        setIncidents(res.incidents || []);
        setVehicles(res.vehicles || []);
        setCheckpoints(res.checkpoints || []);
        setPatrolLogs(res.patrolLogs || []);
        setVehicleLogs(res.vehicleLogs || []);
      } else {
        toast.error(res.error || "Failed to load dashboard data");
      }
    } catch (err) {
      toast.error("Error loading security analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApprovePass = async (vehicleId: number, approve: boolean) => {
    try {
      const res = await approveVehiclePassAction(vehicleId, approve);
      if (res.success) {
        toast.success(res.message);
        fetchStats();
      } else {
        toast.error(res.error || "Review failed");
      }
    } catch (err) {
      toast.error("Failed to approve vehicle pass");
    }
  };

  const handleCreateCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkpointName.trim()) {
      toast.error("Please enter a checkpoint name");
      return;
    }
    
    try {
      const res = await createStrategicPositionAction(checkpointName, checkpointDesc);
      if (res.success) {
        toast.success(res.message);
        setCheckpointName("");
        setCheckpointDesc("");
        fetchStats();
      } else {
        toast.error(res.error || "Failed to create checkpoint");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleUpdateIncident = async () => {
    if (!selectedIncident) return;
    if (!resolutionNotes.trim()) {
      toast.error("Please write case notes or progress updates");
      return;
    }

    try {
      const res = await resolveIncidentAction(selectedIncident.id, incidentStatus, resolutionNotes);
      if (res.success) {
        toast.success(res.message);
        setSelectedIncident(null);
        setResolutionNotes("");
        fetchStats();
      } else {
        toast.error(res.error || "Failed to update incident");
      }
    } catch (err) {
      toast.error("An error occurred updating the case");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chief Security Officer Control Center</h1>
            <p className="text-slate-400 text-sm">Overview of strategic patrols, active security incident cases, and vehicle permits.</p>
          </div>
        </div>
        <Button onClick={fetchStats} variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800 font-bold gap-2">
          <Activity className="w-4 h-4 text-indigo-500" /> Refresh Live Feed
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Patrol Rounds</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.activePatrolsCount}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Strategic logs filed today</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Compass className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Incident Cases</p>
              <h3 className="text-2xl font-black text-red-600 mt-1">{stats.openIncidentsCount}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Awaiting resolution notes</p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Gate Traffic</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.gateTrafficCount}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Vehicle check-ins / outs</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Car className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Vehicle Passes</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.pendingPassesCount}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Awaiting permit approval</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <FileCheck2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Vehicle passes & Strategic checkpoints */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Vehicle Passes */}
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-md font-bold text-slate-900">Vehicle Pass Permits Pending Approval</CardTitle>
              <CardDescription>Review plate numbers and vehicle details submitted by staff and students.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">Loading passes...</div>
              ) : vehicles.filter(v => v.status === 'pending').length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No vehicle pass registrations pending approval.
                </div>
              ) : (
                <div className="divide-y divide-slate-50 overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap text-xs">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-3">Owner / Type</th>
                        <th className="px-6 py-3">Vehicle Details</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {vehicles.filter(v => v.status === 'pending').map((vehicle) => (
                        <tr key={vehicle.id} className="hover:bg-slate-50/30">
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-slate-900">{vehicle.ownerName}</div>
                            <div className="text-[10px] text-slate-400 uppercase mt-0.5">{vehicle.ownerType}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-indigo-600 uppercase">{vehicle.licensePlate}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{vehicle.vehicleColor} {vehicle.vehicleMake} {vehicle.vehicleModel}</div>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <Button 
                              onClick={() => handleApprovePass(vehicle.id, false)} 
                              size="sm" 
                              variant="outline" 
                              className="border-red-100 text-red-600 hover:bg-red-50/50 text-[10px] font-bold py-0.5 px-2"
                            >
                              Reject
                            </Button>
                            <Button 
                              onClick={() => handleApprovePass(vehicle.id, true)} 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-0.5 px-2.5"
                            >
                              Approve
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incident Cases Management */}
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-md font-bold text-slate-900">Incident Logs & Case Files</CardTitle>
              <CardDescription>Track active security alerts. Update statuses or write case resolution logs.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">Loading cases...</div>
              ) : incidents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No incident logs registered.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="p-4 space-y-2 hover:bg-slate-50/20 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                            {inc.title}
                            <Badge className={`text-[8px] font-bold uppercase border-none ${
                              inc.severity === 'critical' ? 'bg-red-50 text-red-600 animate-pulse' :
                              inc.severity === 'high' ? 'bg-orange-50 text-orange-600' :
                              'bg-slate-100 text-slate-400'
                            }`}>
                              {inc.severity}
                            </Badge>
                          </h4>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-indigo-400" /> {inc.location} • Filed by {inc.reporterName} • {new Date(inc.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[9px] font-bold uppercase px-2 py-0.5 ${
                          inc.status === 'reported' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                          inc.status === 'under_investigation' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                          inc.status === 'resolved' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                          'text-slate-400 bg-slate-50 border-slate-100'
                        }`}>
                          {inc.status}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-slate-600 leading-relaxed">{inc.description}</p>
                      
                      {inc.resolutionNotes ? (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                          <div className="font-bold text-slate-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> CSO Case Notes:
                          </div>
                          <p className="mt-0.5 italic">"{inc.resolutionNotes}"</p>
                        </div>
                      ) : (
                        <div className="flex justify-end pt-1">
                          <Button 
                            onClick={() => {
                              setSelectedIncident(inc);
                              setIncidentStatus(inc.status === 'reported' ? 'under_investigation' : 'resolved');
                              setResolutionNotes(inc.resolutionNotes || "");
                            }}
                            size="sm" 
                            variant="outline" 
                            className="border-indigo-100 text-indigo-600 hover:bg-indigo-50/50 text-[11px] font-bold py-0.5 px-3"
                          >
                            Update Case Notes
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Strategic positions creation */}
        <div className="space-y-6">
          {/* Create Strategic Position Checkpoint */}
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-md font-bold text-slate-900">Add Patrol Checkpoint</CardTitle>
              <CardDescription>Define a strategic campus position and print its matching QR Placard.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateCheckpoint} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase text-slate-500">Checkpoint Name</Label>
                  <Input 
                    id="name"
                    placeholder="e.g. Science Complex Back Entrance"
                    value={checkpointName}
                    onChange={(e) => setCheckpointName(e.target.value)}
                    className="border-slate-200 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-xs font-bold uppercase text-slate-500">Description (Optional)</Label>
                  <Textarea 
                    id="desc"
                    placeholder="Provide details about required inspection frequency..."
                    value={checkpointDesc}
                    onChange={(e) => setCheckpointDesc(e.target.value)}
                    className="border-slate-200 focus:ring-indigo-500 text-xs min-h-16"
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl">
                  Register Checkpoint
                </Button>
              </form>

              {/* Checkpoints List */}
              <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Registered Checkpoints</h4>
                {loading ? (
                  <div className="text-xs text-slate-400">Loading checkpoints...</div>
                ) : checkpoints.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">No checkpoints registered yet.</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {checkpoints.map(cp => (
                      <div key={cp.id} className="p-3 flex justify-between items-center bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <div className="text-xs font-bold text-slate-800">{cp.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{cp.qrCode}</div>
                        </div>
                        <Button 
                          onClick={() => setSelectedCheckpointForPrint(cp)}
                          size="sm" 
                          variant="outline" 
                          className="border-slate-200 hover:bg-white text-[10px] font-bold p-2 gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-500" /> Placard
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Incident resolution Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-none shadow-2xl bg-white animate-in zoom-in-95 duration-150">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-slate-900">Update Case File Notes</CardTitle>
              <CardDescription>Change status and enter investigation reports for: <strong>"{selectedIncident.title}"</strong></CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Case Status</Label>
                <select
                  value={incidentStatus}
                  onChange={(e: any) => setIncidentStatus(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="under_investigation">Under Active Investigation</option>
                  <option value="resolved">Case Resolved / Security Cleared</option>
                  <option value="closed">Closed / Archived</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-bold uppercase text-slate-500">Investigation & Resolution Notes</Label>
                <Textarea 
                  id="notes"
                  placeholder="Enter details e.g. 'Security logs verified. Incident cleared with local police team. Fence patch scheduled.'"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="border-slate-200 focus:ring-indigo-500 min-h-24 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedIncident(null)} className="border-slate-200 font-bold text-xs">
                  Cancel
                </Button>
                <Button onClick={handleUpdateIncident} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
                  Update Case File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Checkpoint Print Placard Modal */}
      {selectedCheckpointForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm border-none shadow-2xl bg-white text-slate-900 animate-in zoom-in-95 duration-150">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-sm font-bold">Patrol Checkpoint Placard</CardTitle>
                <CardDescription>Mount this physical card at checkpoint location.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedCheckpointForPrint(null)} className="border-slate-200 text-xs font-bold">Close</Button>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4" id="checkpoint-print">
              <div className="flex items-center gap-1.5 border border-indigo-200 bg-indigo-50/60 px-3 py-1 rounded-full text-indigo-600 text-xs font-bold">
                <ShieldAlert className="w-3.5 h-3.5" /> SECURITY PATROL CHECKPOINT
              </div>
              
              <div>
                <h3 className="text-lg font-black tracking-wide uppercase text-slate-800">{selectedCheckpointForPrint.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedCheckpointForPrint.qrCode}</p>
              </div>

              {/* Placard QR Box */}
              <div className="bg-white p-4 rounded-xl shadow-inner relative border-2 border-slate-100">
                <svg className="w-44 h-44" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="white" />
                  <rect x="5" y="5" width="25" height="25" fill="#0f172a" />
                  <rect x="10" y="10" width="15" height="15" fill="white" />
                  <rect x="12" y="12" width="11" height="11" fill="#0f172a" />

                  <rect x="70" y="5" width="25" height="25" fill="#0f172a" />
                  <rect x="75" y="10" width="15" height="15" fill="white" />
                  <rect x="77" y="12" width="11" height="11" fill="#0f172a" />

                  <rect x="5" y="70" width="25" height="25" fill="#0f172a" />
                  <rect x="10" y="75" width="15" height="15" fill="white" />
                  <rect x="12" y="77" width="11" height="11" fill="#0f172a" />

                  {/* Placard patterns */}
                  <rect x="45" y="10" width="5" height="15" fill="#0f172a" />
                  <rect x="50" y="30" width="15" height="5" fill="#0f172a" />
                  <rect x="40" y="45" width="10" height="10" fill="#0f172a" />
                  <rect x="60" y="55" width="15" height="15" fill="#0f172a" />
                  <rect x="35" y="75" width="10" height="5" fill="#0f172a" />
                  <rect x="50" y="80" width="15" height="10" fill="#0f172a" />
                  <rect x="80" y="45" width="10" height="5" fill="#0f172a" />
                </svg>
                <div className="absolute inset-0 bg-slate-500/5 pointer-events-none flex items-center justify-center">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 text-white">
                    <Compass className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                Instruction for security crew: Open patrol portal on tablet/mobile, scan this QR checkpoint code and record inspection remarks.
              </p>

              <Button onClick={() => window.print()} className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 font-bold text-xs rounded-xl py-2 shadow-md">
                <Printer className="w-4 h-4" /> Print Placard
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
