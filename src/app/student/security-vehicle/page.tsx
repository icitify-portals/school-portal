"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { registerVehicleAction, getMyVehiclesAction } from "@/actions/security-unit-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Car, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  QrCode, 
  Download,
  AlertCircle,
  Shield,
  Printer
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const VehicleSchema = z.object({
  licensePlate: z.string().min(3, "License plate must be at least 3 characters").max(15, "Invalid plate format"),
  vehicleMake: z.string().min(2, "Make is required (e.g. Toyota)"),
  vehicleModel: z.string().min(2, "Model is required (e.g. Corolla)"),
  vehicleColor: z.string().min(2, "Color is required"),
  ownerType: z.enum(['student', 'staff']),
  ownerName: z.string().min(2, "Owner name is required"),
});

type VehicleFormValues = z.infer<typeof VehicleSchema>;

export default function StudentVehiclePage() {
  const [activeTab, setActiveTab] = useState<"register" | "passes">("passes");
  const [myVehicles, setMyVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<VehicleFormValues>({
    resolver: zodResolver(VehicleSchema),
    defaultValues: {
      ownerType: "student",
      ownerName: ""
    }
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await getMyVehiclesAction();
      if (res.success) {
        setMyVehicles(res.vehicles || []);
      } else {
        toast.error(res.error || "Failed to load vehicles");
      }
    } catch (err) {
      toast.error("Failed to load registered vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const onSubmit = async (data: VehicleFormValues) => {
    try {
      const res = await registerVehicleAction(data);
      if (res.success) {
        toast.success(res.message);
        reset();
        setActiveTab("passes");
        fetchVehicles();
      } else {
        toast.error(res.error || "Failed to register vehicle");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Car className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vehicle Gate Pass Portal</h1>
            <p className="text-slate-400 text-sm">Register your vehicle to obtain a secure QR pass for campus gate entry and exit.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={activeTab === "passes" ? "default" : "outline"} 
            onClick={() => setActiveTab("passes")}
            className={activeTab === "passes" ? "bg-indigo-600 hover:bg-indigo-700" : "border-slate-700 text-slate-300 hover:bg-slate-800"}
          >
            My Passes
          </Button>
          <Button 
            variant={activeTab === "register" ? "default" : "outline"} 
            onClick={() => setActiveTab("register")}
            className={activeTab === "register" ? "bg-indigo-600 hover:bg-indigo-700" : "border-slate-700 text-slate-300 hover:bg-slate-800"}
          >
            Register Vehicle
          </Button>
        </div>
      </div>

      {/* Tabs Content */}
      {activeTab === "register" ? (
        <Card className="border-none shadow-lg overflow-hidden bg-white max-w-2xl mx-auto">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-5">
            <CardTitle className="text-lg font-bold text-slate-900">Vehicle Registration Form</CardTitle>
            <CardDescription>Enter details about your vehicle. All registrations require Chief Security Officer (CSO) approval.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="text-xs font-bold uppercase text-slate-500">Owner Full Name</Label>
                  <Input 
                    id="ownerName" 
                    placeholder="Enter your name" 
                    {...register("ownerName")}
                    className="border-slate-200 focus:ring-indigo-500"
                  />
                  {errors.ownerName && <p className="text-[11px] font-bold text-red-500">{errors.ownerName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerType" className="text-xs font-bold uppercase text-slate-500">Ownership Category</Label>
                  <select
                    id="ownerType"
                    {...register("ownerType")}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="student">Student</option>
                    <option value="staff">Staff Member</option>
                  </select>
                  {errors.ownerType && <p className="text-[11px] font-bold text-red-500">{errors.ownerType.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licensePlate" className="text-xs font-bold uppercase text-slate-500">License Plate Number</Label>
                  <Input 
                    id="licensePlate" 
                    placeholder="e.g. ABJ-123-XY" 
                    {...register("licensePlate")}
                    className="border-slate-200 uppercase focus:ring-indigo-500"
                  />
                  {errors.licensePlate && <p className="text-[11px] font-bold text-red-500">{errors.licensePlate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleColor" className="text-xs font-bold uppercase text-slate-500">Vehicle Color</Label>
                  <Input 
                    id="vehicleColor" 
                    placeholder="e.g. Dark Grey, Silver" 
                    {...register("vehicleColor")}
                    className="border-slate-200 focus:ring-indigo-500"
                  />
                  {errors.vehicleColor && <p className="text-[11px] font-bold text-red-500">{errors.vehicleColor.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleMake" className="text-xs font-bold uppercase text-slate-500">Vehicle Make / Brand</Label>
                  <Input 
                    id="vehicleMake" 
                    placeholder="e.g. Toyota" 
                    {...register("vehicleMake")}
                    className="border-slate-200 focus:ring-indigo-500"
                  />
                  {errors.vehicleMake && <p className="text-[11px] font-bold text-red-500">{errors.vehicleMake.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleModel" className="text-xs font-bold uppercase text-slate-500">Vehicle Model</Label>
                  <Input 
                    id="vehicleModel" 
                    placeholder="e.g. Corolla 2020" 
                    {...register("vehicleModel")}
                    className="border-slate-200 focus:ring-indigo-500"
                  />
                  {errors.vehicleModel && <p className="text-[11px] font-bold text-red-500">{errors.vehicleModel.message}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl transition-all"
                >
                  {isSubmitting ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Permits List */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Card className="border-none shadow-md overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-lg font-bold text-slate-900">Registered Vehicles</CardTitle>
                <CardDescription>Select an approved vehicle to view and download your QR Gate Pass.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-12 text-center text-slate-400 font-medium">
                    Loading your registered vehicles...
                  </div>
                ) : myVehicles.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium">
                    <Car className="w-12 h-12 mx-auto mb-3 opacity-20 text-slate-500" />
                    You have not registered any vehicles yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {myVehicles.map((vehicle) => (
                      <div 
                        key={vehicle.id} 
                        onClick={() => setSelectedVehicle(vehicle)}
                        className={`p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-colors ${
                          selectedVehicle?.id === vehicle.id ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <div className="flex gap-3 items-center">
                          <div className={`p-2.5 rounded-lg ${
                            vehicle.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                            vehicle.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                            'bg-slate-50 text-slate-400'
                          }`}>
                            <Car className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-extrabold text-sm text-slate-900 uppercase flex items-center gap-2">
                              {vehicle.licensePlate}
                              <Badge className={`text-[9px] font-bold uppercase px-1.5 py-0.5 border-none ${
                                vehicle.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                vehicle.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                'bg-slate-100 text-slate-400'
                              }`}>
                                {vehicle.status}
                              </Badge>
                            </div>
                            <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                              {vehicle.vehicleColor} {vehicle.vehicleMake} {vehicle.vehicleModel}
                            </div>
                          </div>
                        </div>
                        {vehicle.status === 'approved' && (
                          <Button size="sm" variant="outline" className="border-indigo-100 text-indigo-600 hover:bg-indigo-50/50 gap-1 text-[11px] font-bold">
                            <QrCode className="w-3.5 h-3.5" /> View Pass
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Selected Vehicle Pass Detail */}
          <div className="md:col-span-1">
            {selectedVehicle && selectedVehicle.status === 'approved' ? (
              <Card className="border-none shadow-lg overflow-hidden bg-gradient-to-b from-indigo-950 to-slate-950 text-white border border-indigo-900 rounded-2xl relative">
                {/* Print area */}
                <div className="p-6 flex flex-col items-center text-center space-y-6" id="gate-pass-print">
                  <div className="flex items-center gap-1.5 border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 rounded-full text-indigo-400 text-xs font-bold">
                    <Shield className="w-3.5 h-3.5" /> Official Gate Pass
                  </div>

                  <div>
                    <h3 className="text-xl font-black tracking-widest text-white uppercase">{selectedVehicle.licensePlate}</h3>
                    <p className="text-xs text-indigo-300 font-bold mt-1 uppercase">{selectedVehicle.vehicleColor} {selectedVehicle.vehicleMake} {selectedVehicle.vehicleModel}</p>
                  </div>

                  {/* QR Code Container */}
                  <div className="bg-white p-4 rounded-xl shadow-inner relative border-2 border-indigo-500/20">
                    {/* SVG Representation of QR to avoid packages issues */}
                    <svg className="w-36 h-36" viewBox="0 0 100 100">
                      <rect width="100" height="100" fill="white" />
                      {/* Stylized QR patterns */}
                      <rect x="5" y="5" width="25" height="25" fill="#1e1b4b" />
                      <rect x="10" y="10" width="15" height="15" fill="white" />
                      <rect x="12" y="12" width="11" height="11" fill="#1e1b4b" />

                      <rect x="70" y="5" width="25" height="25" fill="#1e1b4b" />
                      <rect x="75" y="10" width="15" height="15" fill="white" />
                      <rect x="77" y="12" width="11" height="11" fill="#1e1b4b" />

                      <rect x="5" y="70" width="25" height="25" fill="#1e1b4b" />
                      <rect x="10" y="75" width="15" height="15" fill="white" />
                      <rect x="12" y="77" width="11" height="11" fill="#1e1b4b" />

                      {/* Random dots to make it look like a QR */}
                      <rect x="40" y="10" width="5" height="5" fill="#1e1b4b" />
                      <rect x="55" y="15" width="5" height="10" fill="#1e1b4b" />
                      <rect x="45" y="35" width="10" height="5" fill="#1e1b4b" />
                      <rect x="40" y="50" width="5" height="15" fill="#1e1b4b" />
                      <rect x="50" y="60" width="15" height="5" fill="#1e1b4b" />
                      <rect x="70" y="40" width="15" height="5" fill="#1e1b4b" />
                      <rect x="75" y="50" width="10" height="10" fill="#1e1b4b" />
                      <rect x="80" y="80" width="15" height="15" fill="#1e1b4b" />
                      <rect x="50" y="80" width="5" height="5" fill="#1e1b4b" />
                    </svg>
                    <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none flex items-center justify-center">
                      <div className="bg-indigo-950 p-1.5 rounded-lg border border-indigo-500/25 text-white">
                        <Car className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="w-full border-t border-slate-800 pt-4 text-left space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Owner:</span>
                      <span className="font-bold text-slate-200">{selectedVehicle.ownerName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Pass Number:</span>
                      <span className="font-bold text-slate-200 tracking-wider text-[11px]">{selectedVehicle.passNumber}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Expires:</span>
                      <span className="font-bold text-slate-200">
                        {selectedVehicle.expiresAt ? new Date(selectedVehicle.expiresAt).toLocaleDateString() : "Never"}
                      </span>
                    </div>
                  </div>

                  <div className="w-full flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => window.print()}
                      className="flex-1 bg-transparent hover:bg-slate-800 text-slate-300 border-slate-800 gap-2 font-bold text-xs"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </Button>
                    <a 
                      href={`data:text/plain;charset=utf-8,${encodeURIComponent(selectedVehicle.qrCode || '')}`}
                      download={`gate-pass-${selectedVehicle.licensePlate}.txt`}
                      className="flex-1"
                    >
                      <Button 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold text-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                    </a>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 p-6 rounded-2xl text-center text-slate-400">
                <QrCode className="w-12 h-12 mx-auto mb-3 opacity-20" />
                Select an approved vehicle to load its security QR Pass card details.
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
