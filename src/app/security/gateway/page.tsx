"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  User,
  Book,
  Users,
  MapPin,
  Clock,
  DollarSign,
  RefreshCw,
  Settings
} from "lucide-react";
import { logMovement, getSecurityAuditLogs } from "@/actions/security-movement";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ScanResult {
  success: boolean;
  scanResult: 'allowed' | 'blocked' | 'error';
  entity?: any;
  finesOwed?: string;
  photoUrl?: string | null;
  message?: string;
  error?: string;
}

export default function SecurityGateway() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState<string>("");
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocation("Location unavailable");
        }
      );
    }
  }, []);

  // Load recent scans
  useEffect(() => {
    loadRecentScans();
    const interval = setInterval(loadRecentScans, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadRecentScans = async () => {
    try {
      const result = await getSecurityAuditLogs(10);
      if (result.success) {
        setRecentScans(result.logs || []);
      }
    } catch (error) {
      console.error("Failed to load recent scans:", error);
    }
  };

  const handleScan = useCallback(async (detectedCodes: any[]) => {
    if (isProcessing) return;
    
    // Get the first detected code
    const result = detectedCodes[0]?.rawValue || detectedCodes[0];
    if (!result) return;
    
    setIsProcessing(true);
    setIsScanning(false);

    try {
      // Determine scan type based on QR content or patterns
      const scanType = determineScanType(result);
      
      const response = await logMovement({
        qrData: result,
        scanType,
        location,
      });

      setLastScan(response as ScanResult);

      // Show appropriate toast notification
      if (response.success) {
        toast.success(`✅ ${response.message}`, {
          description: response.finesOwed !== "0.00" ? `Fines: ₦${response.finesOwed}` : undefined,
        });
      } else {
        if (response.scanResult === 'blocked') {
          toast.error(`🚫 ${response.error}`, {
            description: response.finesOwed !== "0.00" ? `Outstanding fines: ₦${response.finesOwed}` : undefined,
          });
        } else {
          toast.error(`❌ ${response.error}`);
        }
      }

      // Refresh recent scans
      await loadRecentScans();

    } catch (error) {
      console.error("Scan processing error:", error);
      toast.error("Failed to process scan");
      setLastScan({
        success: false,
        scanResult: 'error',
        error: "Processing failed",
      });
    } finally {
      setIsProcessing(false);
      // Auto-resume scanning after 3 seconds
      setTimeout(() => {
        setIsScanning(true);
        setLastScan(null);
      }, 3000);
    }
  }, [isProcessing, location]);

  const determineScanType = (qrData: string): 'library_book' | 'visitor_pass' | 'student_gate' | 'staff_gate' => {
    // Simple heuristic to determine scan type
    if (qrData.includes('library_book')) return 'library_book';
    if (qrData.includes('visitor_pass')) return 'visitor_pass';
    if (qrData.includes('student_gate')) return 'student_gate';
    if (qrData.includes('staff_gate')) return 'staff_gate';
    
    // Default based on content patterns
    if (qrData.includes('barcode')) return 'library_book';
    if (qrData.includes('visitorName')) return 'visitor_pass';
    if (qrData.includes('schoolPortalId')) return 'student_gate';
    
    return 'visitor_pass'; // Default fallback for visitor management
  };

  const getScanResultIcon = (result: ScanResult) => {
    switch (result.scanResult) {
      case 'allowed':
        return <CheckCircle2 className="w-16 h-16 text-green-500" />;
      case 'blocked':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-16 h-16 text-amber-500" />;
      default:
        return <AlertTriangle className="w-16 h-16 text-gray-500" />;
    }
  };

  const getScanResultColor = (result: ScanResult) => {
    switch (result.scanResult) {
      case 'allowed':
        return "bg-green-50 border-green-200 text-green-800";
      case 'blocked':
        return "bg-red-50 border-red-200 text-red-800";
      case 'error':
        return "bg-amber-50 border-amber-200 text-amber-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getEntityIcon = (entityType?: string) => {
    switch (entityType) {
      case 'student':
        return <User className="w-5 h-5" />;
      case 'staff':
        return <Users className="w-5 h-5" />;
      case 'library_book':
        return <Book className="w-5 h-5" />;
      case 'visitor':
        return <Users className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center text-white">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl font-bold">Security Gateway</h1>
          </div>
          <p className="text-slate-300">Smart Access Control System</p>
          {location && (
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-400">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Scanner Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Scanner Card */}
            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  QR Scanner
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isScanning ? "destructive" : "default"}
                    size="sm"
                    onClick={() => setIsScanning(!isScanning)}
                    disabled={isProcessing}
                  >
                    {isScanning ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    {isScanning ? "Stop" : "Start"}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {isScanning ? (
                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <Scanner
                        onScan={handleScan}
                        onError={(error) => {
                          console.error("QR Scanner error:", error);
                          toast.error("Scanner error. Please try again.");
                        }}
                        styles={{
                          container: {
                            width: "100%",
                            height: "400px",
                            borderRadius: "0.5rem",
                          },
                        }}
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-green-500 text-white">
                          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                          Scanning Active
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="h-96 bg-slate-900 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-600">
                      <div className="text-center">
                        <Camera className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">
                          {isProcessing ? "Processing..." : "Click Start to begin scanning"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Scan Result */}
            {lastScan && (
              <Card className={cn("border-2", getScanResultColor(lastScan))}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {getScanResultIcon(lastScan)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {lastScan.scanResult === 'allowed' ? 'Access Granted' :
                         lastScan.scanResult === 'blocked' ? 'Access Denied' : 'Scan Error'}
                      </h3>
                      
                      {lastScan.entity && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getEntityIcon(lastScan.entity.type)}
                            <span className="font-medium">{lastScan.message}</span>
                          </div>
                          
                          {lastScan.entity.matricNumber && (
                            <p className="text-sm opacity-75">ID: {lastScan.entity.matricNumber}</p>
                          )}
                          
                          {lastScan.finesOwed && lastScan.finesOwed !== "0.00" && (
                            <div className="flex items-center gap-2 text-amber-600">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-medium">Outstanding Fines: ₦{lastScan.finesOwed}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {lastScan.error && (
                        <p className="text-sm opacity-75">{lastScan.error}</p>
                      )}
                    </div>
                    
                    {lastScan.photoUrl && (
                      <img
                        src={lastScan.photoUrl}
                        alt="Person"
                        className="w-20 h-20 rounded-full object-cover border-2 border-white"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <Button variant="outline" size="sm" onClick={loadRecentScans}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentScans.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">No recent activity</p>
                  ) : (
                    recentScans.map((scan: any, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          scan.audit.scanResult === 'allowed' ? 'bg-green-500' :
                          scan.audit.scanResult === 'blocked' ? 'bg-red-500' : 'bg-amber-500'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {scan.scanner.name || 'Security Officer'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(scan.audit.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {scan.audit.scanType.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Today's Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {recentScans.filter(s => s.audit.scanResult === 'allowed').length}
                    </div>
                    <p className="text-xs text-slate-400">Allowed</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">
                      {recentScans.filter(s => s.audit.scanResult === 'blocked').length}
                    </div>
                    <p className="text-xs text-slate-400">Blocked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
