// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area
} from "recharts";
import { 
  Building2, 
  MapPin, 
  AlertTriangle, 
  Settings, 
  Globe, 
  Shield,
  Activity,
  Users,
  Bus,
  Route,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Target,
  Zap,
  Database,
  Cpu,
  Server,
  Network,
  Key,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Bell,
  Phone,
  Ambulance,
  Car,
  Navigation,
  Map,
  Filter,
  Search
} from "lucide-react";
import { 
  createMultiCampusCoordination,
  getMultiCampusCoordinations,
  createCampusLocation,
  getCampusLocations,
  createEmergencyTransportation,
  getEmergencyTransportationRequests,
  updateEmergencyTransportationStatus,
  createPerformanceMetric,
  getPerformanceMetrics,
  getGlobalTransportationSettings,
  updateGlobalTransportationSetting,
  getEnterpriseDashboard
} from "@/actions/transportation-enterprise";
import { toast } from "sonner";

export default function TransportationEnterprise() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [enterpriseData, setEnterpriseData] = useState<any>(null);
  const [coordinations, setCoordinations] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [emergencyRequests, setEmergencyRequests] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCoordinationForm, setShowCoordinationForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [showMetricForm, setShowMetricForm] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadEnterpriseDashboard();
    } else if (activeTab === 'coordination') {
      loadCoordinations();
    } else if (activeTab === 'locations') {
      loadLocations();
    } else if (activeTab === 'emergency') {
      loadEmergencyRequests();
    } else if (activeTab === 'metrics') {
      loadPerformanceMetrics();
    } else if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab]);

  const loadEnterpriseDashboard = async () => {
    setLoading(true);
    const result = await getEnterpriseDashboard();
    if (result.success) {
      
      setEnterpriseData(result);
    }
    setLoading(false);
  };

  const loadCoordinations = async () => {
    setLoading(true);
    const result = await getMultiCampusCoordinations();
    if (result.success) {
      
      setCoordinations(result.coordinations);
    }
    setLoading(false);
  };

  const loadLocations = async () => {
    setLoading(true);
    const result = await getCampusLocations();
    if (result.success) {
      
      setLocations(result.locations);
    }
    setLoading(false);
  };

  const loadEmergencyRequests = async () => {
    setLoading(true);
    const result = await getEmergencyTransportationRequests();
    if (result.success) {
      
      setEmergencyRequests(result.requests);
    }
    setLoading(false);
  };

  const loadPerformanceMetrics = async () => {
    setLoading(true);
    const result = await getPerformanceMetrics();
    if (result.success) {
      
      setPerformanceMetrics(result.metrics);
    }
    setLoading(false);
  };

  const loadSettings = async () => {
    setLoading(true);
    const result = await getGlobalTransportationSettings();
    if (result.success) {
      
      setSettings(result.settings);
    }
    setLoading(false);
  };

  
      // @ts-expect-error - Auto-suppressed by script
  const handleCoordinationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const coordinationData = {
      
      // @ts-expect-error - Auto-suppressed by script
      sourceCampusId: parseInt(formData.get('sourceCampusId')),
      
      // @ts-expect-error - Auto-suppressed by script
      destinationCampusId: parseInt(formData.get('destinationCampusId')),
      routeType: formData.get('routeType'),
      
      // @ts-expect-error - Auto-suppressed by script
      operatingHours: JSON.parse(formData.get('operatingHours')),
      
      // @ts-expect-error - Auto-suppressed by script
      frequencyMinutes: parseInt(formData.get('frequencyMinutes')),
      
      // @ts-expect-error - Auto-suppressed by script
      vehicleCapacity: parseInt(formData.get('vehicleCapacity')),
      driverRequirements: formData.get('driverRequirements'),
      
      // @ts-expect-error - Auto-suppressed by script
      fareStructure: JSON.parse(formData.get('fareStructure')),
      priorityLevel: formData.get('priorityLevel'),
      
      // @ts-expect-error - Auto-suppressed by script
      coordinationRules: JSON.parse(formData.get('coordinationRules')),
    };

    
      // @ts-expect-error - Auto-suppressed by script
    const result = await createMultiCampusCoordination(coordinationData);
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      setShowCoordinationForm(false);
      loadCoordinations();
      e.target.reset();
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  
      // @ts-expect-error - Auto-suppressed by script
  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const locationData = {
      
      // @ts-expect-error - Auto-suppressed by script
      campusId: parseInt(formData.get('campusId')),
      locationName: formData.get('locationName'),
      locationType: formData.get('locationType'),
      
      // @ts-expect-error - Auto-suppressed by script
      latitude: parseFloat(formData.get('latitude')),
      
      // @ts-expect-error - Auto-suppressed by script
      longitude: parseFloat(formData.get('longitude')),
      address: formData.get('address'),
      
      // @ts-expect-error - Auto-suppressed by script
      capacity: parseInt(formData.get('capacity')),
      
      // @ts-expect-error - Auto-suppressed by script
      facilities: JSON.parse(formData.get('facilities')),
      
      // @ts-expect-error - Auto-suppressed by script
      operatingHours: JSON.parse(formData.get('operatingHours')),
      accessibilityFeatures: formData.get('accessibilityFeatures'),
    };

    
      // @ts-expect-error - Auto-suppressed by script
    const result = await createCampusLocation(locationData);
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      setShowLocationForm(false);
      loadLocations();
      e.target.reset();
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  
      // @ts-expect-error - Auto-suppressed by script
  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const emergencyData = {
      emergencyType: formData.get('emergencyType'),
      severityLevel: formData.get('severityLevel'),
      
      // @ts-expect-error - Auto-suppressed by script
      campusId: parseInt(formData.get('campusId')),
      
      // @ts-expect-error - Auto-suppressed by script
      locationId: parseInt(formData.get('locationId')),
      description: formData.get('description'),
      priorityLevel: formData.get('priorityLevel'),
      passengersInvolved: formData.get('passengersInvolved'),
      specialRequirements: formData.get('specialRequirements'),
      
      // @ts-expect-error - Auto-suppressed by script
      costEstimate: parseFloat(formData.get('costEstimate')),
      notes: formData.get('notes'),
    };

    
      // @ts-expect-error - Auto-suppressed by script
    const result = await createEmergencyTransportation(emergencyData);
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      setShowEmergencyForm(false);
      loadEmergencyRequests();
      e.target.reset();
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  
      // @ts-expect-error - Auto-suppressed by script
  const handleMetricSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const metricData = {
      metricType: formData.get('metricType'),
      metricName: formData.get('metricName'),
      
      // @ts-expect-error - Auto-suppressed by script
      metricValue: parseFloat(formData.get('metricValue')),
      metricUnit: formData.get('metricUnit'),
      
      // @ts-expect-error - Auto-suppressed by script
      targetValue: parseFloat(formData.get('targetValue')),
      
      // @ts-expect-error - Auto-suppressed by script
      variancePercentage: parseFloat(formData.get('variancePercentage')),
      periodStart: formData.get('periodStart'),
      periodEnd: formData.get('periodEnd'),
      
      // @ts-expect-error - Auto-suppressed by script
      benchmarkValue: parseFloat(formData.get('benchmarkValue')),
      trendDirection: formData.get('trendDirection'),
      notes: formData.get('notes'),
    };

    
      // @ts-expect-error - Auto-suppressed by script
    const result = await createPerformanceMetric(metricData);
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      setShowMetricForm(false);
      loadPerformanceMetrics();
      e.target.reset();
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleEmergencyStatusUpdate = async (emergencyId: number, status: string) => {
    setLoading(true);
    const result = await updateEmergencyTransportationStatus(emergencyId, status);
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      loadEmergencyRequests();
    } else {
      toast.error(`❌ ${result.error}`);
    }
    setLoading(false);
  };

  
      // @ts-expect-error - Auto-suppressed by script
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  
      // @ts-expect-error - Auto-suppressed by script
  const getEmergencyTypeColor = (type) => {
    switch (type) {
      case 'medical': return 'bg-red-100 text-red-800';
      case 'security': return 'bg-blue-100 text-blue-800';
      case 'fire': return 'bg-orange-100 text-orange-800';
      case 'accident': return 'bg-purple-100 text-purple-800';
      case 'natural_disaster': return 'bg-gray-100 text-gray-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  
      // @ts-expect-error - Auto-suppressed by script
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  
      // @ts-expect-error - Auto-suppressed by script
  const getMetricTypeColor = (type) => {
    switch (type) {
      case 'kpi': return 'bg-blue-100 text-blue-800';
      case 'efficiency': return 'bg-green-100 text-green-800';
      case 'safety': return 'bg-red-100 text-red-800';
      case 'satisfaction': return 'bg-purple-100 text-purple-800';
      case 'financial': return 'bg-yellow-100 text-yellow-800';
      case 'operational': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enterprise Transportation</h1>
            <p className="text-gray-600">Multi-campus coordination, emergency services, and global management</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setActiveTab('dashboard')}
            >
              <Globe className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === 'coordination' ? 'default' : 'outline'}
              onClick={() => setActiveTab('coordination')}
            >
              <Route className="w-4 h-4 mr-2" />
              Coordination
            </Button>
            <Button
              variant={activeTab === 'locations' ? 'default' : 'outline'}
              onClick={() => setActiveTab('locations')}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Locations
            </Button>
            <Button
              variant={activeTab === 'emergency' ? 'default' : 'outline'}
              onClick={() => setActiveTab('emergency')}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Emergency
            </Button>
            <Button
              variant={activeTab === 'metrics' ? 'default' : 'outline'}
              onClick={() => setActiveTab('metrics')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Metrics
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'outline'}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Enterprise Dashboard */}
        {activeTab === 'dashboard' && enterpriseData && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Route className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Multi-Campus Routes</p>
                      
                      <p className="text-2xl font-bold text-gray-900">{enterpriseData.summary.coordination.totalCoordinations}</p>
                      <p className="text-xs text-gray-500">
                        
                        {enterpriseData.summary.coordination.activeCoordinations} active
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <MapPin className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Campus Locations</p>
                      
                      <p className="text-2xl font-bold text-gray-900">{enterpriseData.summary.locations.totalLocations}</p>
                      <p className="text-xs text-gray-500">
                        
                        {enterpriseData.summary.locations.totalCapacity} capacity
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-full">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Emergency Requests</p>
                      
                      <p className="text-2xl font-bold text-gray-900">{enterpriseData.summary.emergency.totalRequests}</p>
                      <p className="text-xs text-gray-500">
                        
                        {enterpriseData.summary.emergency.criticalRequests} critical
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Target className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Performance Metrics</p>
                      
                      <p className="text-2xl font-bold text-gray-900">{enterpriseData.summary.performance.totalMetrics}</p>
                      <p className="text-xs text-gray-500">
                        
                        KPI: {Math.round(enterpriseData.summary.performance.avgKpiScore || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Emergency Requests */}
            <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Recent Emergency Requests
                  </span>
                  <Button onClick={loadEnterpriseDashboard} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className=" p-6">
                <div className="space-y-4">
                  
      // @ts-expect-error - Auto-suppressed by script
                  {enterpriseData.recentEmergencies.map((emergency, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 mr-3 ${
                          emergency.emergency.severityLevel === 'critical' ? 'text-red-500' :
                          emergency.emergency.severityLevel === 'high' ? 'text-orange-500' :
                          'text-yellow-500'
                        }`}>
                          <AlertTriangle className="w-full h-full" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {emergency.emergency.emergencyType.replace('_', ' ').toUpperCase()}
                          </h3>
                          <p className="text-gray-600">{emergency.emergency.description}</p>
                          <div className="text-sm text-gray-500 mt-1">
                            Campus: {emergency.campus.name} • Requested by: {emergency.requestedBy.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(emergency.emergency.severityLevel)}`}>
                          {emergency.emergency.severityLevel}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(emergency.emergency.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {enterpriseData.recentEmergencies.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      No recent emergency requests
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                  <CardTitle>Top Performing KPIs</CardTitle>
                </CardHeader>
                <CardContent className=" p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    
                    <BarChart data={enterpriseData.topMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric.metricName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="metric.metricValue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                  <CardTitle>Route Distribution</CardTitle>
                </CardHeader>
                <CardContent className=" p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Shuttle Routes:</span>
                      
                      <span className="font-bold">{enterpriseData.summary.coordination.shuttleRoutes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Express Routes:</span>
                      
                      <span className="font-bold">{enterpriseData.summary.coordination.expressRoutes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Routes:</span>
                      
                      <span className="font-bold">{enterpriseData.summary.coordination.activeCoordinations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Routes:</span>
                      
                      <span className="font-bold">{enterpriseData.summary.coordination.totalCoordinations}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Multi-Campus Coordination */}
        {activeTab === 'coordination' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Multi-Campus Coordination</h2>
              <Button onClick={() => setShowCoordinationForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Coordination
              </Button>
            </div>

            {/* Coordination Form */}
            {showCoordinationForm && (
              <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                  <CardTitle>Add Multi-Campus Coordination</CardTitle>
                </CardHeader>
                <CardContent className=" p-6">
                  <form onSubmit={handleCoordinationSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sourceCampusId">Source Campus *</Label>
                        <Select name="sourceCampusId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source campus" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Campus A</SelectItem>
                            <SelectItem value="2">Campus B</SelectItem>
                            <SelectItem value="3">Campus C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="destinationCampusId">Destination Campus *</Label>
                        <Select name="destinationCampusId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination campus" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Campus A</SelectItem>
                            <SelectItem value="2">Campus B</SelectItem>
                            <SelectItem value="3">Campus C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="routeType">Route Type *</Label>
                        <Select name="routeType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select route type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="shuttle">Shuttle</SelectItem>
                            <SelectItem value="express">Express</SelectItem>
                            <SelectItem value="chartered">Chartered</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="frequencyMinutes">Frequency (minutes) *</Label>
                        <Input id="frequencyMinutes" name="frequencyMinutes" type="number" required />
                      </div>
                      <div>
                        <Label htmlFor="vehicleCapacity">Vehicle Capacity *</Label>
                        <Input id="vehicleCapacity" name="vehicleCapacity" type="number" required />
                      </div>
                      <div>
                        <Label htmlFor="priorityLevel">Priority Level</Label>
                        <Select name="priorityLevel">
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="driverRequirements">Driver Requirements</Label>
                        <Textarea id="driverRequirements" name="driverRequirements" rows={2} />
                      </div>
                      <div>
                        <Label htmlFor="operatingHours">Operating Hours (JSON) *</Label>
                        <Textarea id="operatingHours" name="operatingHours" rows={2} defaultValue='{"weekday": {"start": "07:00", "end": "19:00"}}' />
                      </div>
                      <div>
                        <Label htmlFor="fareStructure">Fare Structure (JSON) *</Label>
                        <Textarea id="fareStructure" name="fareStructure" rows={2} defaultValue='{"students": 100, "staff": 150, "currency": "NGN"}' />
                      </div>
                      <div>
                        <Label htmlFor="coordinationRules">Coordination Rules (JSON)</Label>
                        <Textarea id="coordinationRules" name="coordinationRules" rows={2} defaultValue='{"maxWaitTime": 15, "minCapacity": 4}' />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Coordination'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowCoordinationForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Coordinations List */}
            <div className="space-y-4">
              {coordinations.map((coordination, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          
                          {coordination.sourceCampus.name} → {coordination.destinationCampus.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          
                          {coordination.sourceCampus.code} → {coordination.destinationCampus.code}
                        </p>
                        <div className="text-sm text-gray-500 mt-1">
                          
                          Route Type: {coordination.coordination.routeType} • 
                          
                          Frequency: {coordination.coordination.frequencyMinutes}min • 
                          
                          Capacity: {coordination.coordination.vehicleCapacity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          
                          coordination.coordination.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          
                          {coordination.coordination.isActive ? 'Active' : 'Inactive'}
                        </div>
                        
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(coordination.coordination.priorityLevel)}`}>
                          
                          {coordination.coordination.priorityLevel}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Campus Locations */}
        {activeTab === 'locations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Campus Locations</h2>
              <Button onClick={() => setShowLocationForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </div>

            {/* Location Form */}
            {showLocationForm && (
              <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                  <CardTitle>Add Campus Location</CardTitle>
                </CardHeader>
                <CardContent className=" p-6">
                  <form onSubmit={handleLocationSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="campusId">Campus *</Label>
                        <Select name="campusId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campus" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Campus A</SelectItem>
                            <SelectItem value="2">Campus B</SelectItem>
                            <SelectItem value="3">Campus C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="locationName">Location Name *</Label>
                        <Input id="locationName" name="locationName" required />
                      </div>
                      <div>
                        <Label htmlFor="locationType">Location Type *</Label>
                        <Select name="locationType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="main_gate">Main Gate</SelectItem>
                            <SelectItem value="bus_stop">Bus Stop</SelectItem>
                            <SelectItem value="parking_lot">Parking Lot</SelectItem>
                            <SelectItem value="student_center">Student Center</SelectItem>
                            <SelectItem value="faculty_building">Faculty Building</SelectItem>
                            <SelectItem value="hostel">Hostel</SelectItem>
                            <SelectItem value="library">Library</SelectItem>
                            <SelectItem value="sports_complex">Sports Complex</SelectItem>
                            <SelectItem value="admin_block">Admin Block</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="latitude">Latitude *</Label>
                        <Input id="latitude" name="latitude" type="number" step="0.000001" required />
                      </div>
                      <div>
                        <Label htmlFor="longitude">Longitude *</Label>
                        <Input id="longitude" name="longitude" type="number" step="0.000001" required />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" name="address" />
                      </div>
                      <div>
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input id="capacity" name="capacity" type="number" />
                      </div>
                      <div>
                        <Label htmlFor="facilities">Facilities (JSON)</Label>
                        <Textarea id="facilities" name="facilities" rows={2} defaultValue='["security_post", "waiting_area"]' />
                      </div>
                      <div>
                        <Label htmlFor="operatingHours">Operating Hours (JSON)</Label>
                        <Textarea id="operatingHours" name="operatingHours" rows={2} defaultValue='{"open": "06:00", "close": "22:00"}' />
                      </div>
                      <div>
                        <Label htmlFor="accessibilityFeatures">Accessibility Features</Label>
                        <Textarea id="accessibilityFeatures" name="accessibilityFeatures" rows={2} />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Location'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowLocationForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Locations List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((location, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        
                        <h3 className="text-lg font-semibold text-gray-900">{location.location.locationName}</h3>
                        
                        <p className="text-sm text-gray-500">{location.location.locationType.replace('_', ' ')}</p>
                        <div className="text-sm text-gray-500 mt-1">
                          
                          Campus: {location.campus.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          
                          location.location.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          
                          {location.location.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        
                        <span>{location.location.latitude.toFixed(6)}, {location.location.longitude.toFixed(6)}</span>
                      </div>
                      
                      {location.location.address && (
                        <div className="flex items-center text-sm">
                          <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                          
                          <span>{location.location.address}</span>
                        </div>
                      )}
                      
                      {location.location.capacity && (
                        <div className="flex items-center text-sm">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          
                          <span>Capacity: {location.location.capacity}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Transportation */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Emergency Transportation</h2>
              <Button onClick={() => setShowEmergencyForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Request Emergency
              </Button>
            </div>

            {/* Emergency Form */}
            {showEmergencyForm && (
              <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                  <CardTitle>Request Emergency Transportation</CardTitle>
                </CardHeader>
                <CardContent className=" p-6">
                  <form onSubmit={handleEmergencySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergencyType">Emergency Type *</Label>
                        <Select name="emergencyType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medical">Medical</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="natural_disaster">Natural Disaster</SelectItem>
                            <SelectItem value="accident">Accident</SelectItem>
                            <SelectItem value="fire">Fire</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="severityLevel">Severity Level *</Label>
                        <Select name="severityLevel" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="campusId">Campus *</Label>
                        <Select name="campusId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campus" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Campus A</SelectItem>
                            <SelectItem value="2">Campus B</SelectItem>
                            <SelectItem value="3">Campus C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="locationId">Location</Label>
                        <Select name="locationId">
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Main Gate - Campus A</SelectItem>
                            <SelectItem value="2">Student Center - Campus A</SelectItem>
                            <SelectItem value="3">Main Gate - Campus B</SelectItem>
                            <SelectItem value="4">Library - Campus B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priorityLevel">Priority Level</Label>
                        <Select name="priorityLevel">
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="costEstimate">Cost Estimate (₦)</Label>
                        <Input id="costEstimate" name="costEstimate" type="number" step="0.01" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea id="description" name="description" required />
                    </div>
                    <div>
                      <Label htmlFor="passengersInvolved">Passengers Involved</Label>
                      <Textarea id="passengersInvolved" name="passengersInvolved" rows={2} />
                    </div>
                    <div>
                      <Label htmlFor="specialRequirements">Special Requirements</Label>
                      <Textarea id="specialRequirements" name="specialRequirements" rows={2} />
                    </div>
                    <div>
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea id="notes" name="notes" rows={2} />
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Request'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowEmergencyForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Emergency Requests */}
            <div className="space-y-4">
              {emergencyRequests.map((request, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        
                        <div className={`w-5 h-5 mr-3 ${getEmergencyTypeColor(request.emergency.emergencyType)}`}>
                          <AlertTriangle className="w-full h-full" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            
                            {request.emergency.emergencyType.replace('_', ' ').toUpperCase()}
                          </h3>
                          
                          <p className="text-gray-600">{request.emergency.description}</p>
                          <div className="text-sm text-gray-500 mt-1">
                            
                            Campus: {request.campus.name} • Requested by: {request.requestedBy.name}
                          </div>
                          
                          {request.location && (
                            <div className="text-sm text-gray-500">
                              
                              Location: {request.location.locationName}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(request.emergency.severityLevel)}`}>
                          
                          {request.emergency.severityLevel}
                        </div>
                        
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(request.emergency.priorityLevel)}`}>
                          
                          {request.emergency.priorityLevel}
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          
                          request.emergency.status === 'completed' ? 'bg-green-100 text-green-800' :
                          
                          request.emergency.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          
                          request.emergency.status === 'dispatched' ? 'bg-yellow-100 text-yellow-800' :
                          
                          request.emergency.status === 'requested' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          
                          {request.emergency.status}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          
                          {new Date(request.emergency.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      
                      {request.emergency.status === 'requested' && (
                        
                        <Button size="sm" onClick={() => handleEmergencyStatusUpdate(request.emergency.id, 'approved')}>
                          Approve
                        </Button>
                      )}
                      
                      {request.emergency.status === 'approved' && (
                        
                        <Button size="sm" onClick={() => handleEmergencyStatusUpdate(request.emergency.id, 'dispatched')}>
                          Dispatch
                        </Button>
                      )}
                      
                      {request.emergency.status === 'dispatched' && (
                        
                        <Button size="sm" onClick={() => handleEmergencyStatusUpdate(request.emergency.id, 'in_progress')}>
                          In Progress
                        </Button>
                      )}
                      
                      {request.emergency.status === 'in_progress' && (
                        
                        <Button size="sm" onClick={() => handleEmergencyStatusUpdate(request.emergency.id, 'completed')}>
                          Complete
                        </Button>
                      )}
                      
                      <Button size="sm" variant="outline" onClick={() => handleEmergencyStatusUpdate(request.emergency.id, 'cancelled')}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Performance Metrics</h2>
              <Button onClick={() => setShowMetricForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Metric
              </Button>
            </div>

            {/* Metric Form */}
            {showMetricForm && (
              <Card className=" border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                  <CardTitle>Add Performance Metric</CardTitle>
                </CardHeader>
                <CardContent className=" p-6">
                  <form onSubmit={handleMetricSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="metricType">Metric Type *</Label>
                        <Select name="metricType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kpi">KPI</SelectItem>
                            <SelectItem value="efficiency">Efficiency</SelectItem>
                            <SelectItem value="safety">Safety</SelectItem>
                            <SelectItem value="satisfaction">Satisfaction</SelectItem>
                            <SelectItem value="financial">Financial</SelectItem>
                            <SelectItem value="operational">Operational</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="metricName">Metric Name *</Label>
                        <Input id="metricName" name="metricName" required />
                      </div>
                      <div>
                        <Label htmlFor="metricValue">Metric Value *</Label>
                        <Input id="metricValue" name="metricValue" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="targetValue">Target Value *</Label>
                        <Input id="targetValue" name="targetValue" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="variancePercentage">Variance Percentage</Label>
                        <Input id="variancePercentage" name="variancePercentage" type="number" step="0.01" />
                      </div>
                      <div>
                        <Label htmlFor="periodStart">Period Start *</Label>
                        <Input id="periodStart" name="periodStart" type="date" required />
                      </div>
                      <div>
                        <Label htmlFor="periodEnd">Period End *</Label>
                        <Input id="periodEnd" name="periodEnd" type="date" required />
                      </div>
                      <div>
                        <Label htmlFor="benchmarkValue">Benchmark Value</Label>
                        <Input id="benchmarkValue" name="benchmarkValue" type="number" step="0.01" />
                      </div>
                      <div>
                        <Label htmlFor="trendDirection">Trend Direction *</Label>
                        <Select name="trendDirection" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trend" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="up">Up</SelectItem>
                            <SelectItem value="down">Down</SelectItem>
                            <SelectItem value="stable">Stable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="metricUnit">Unit</Label>
                        <Input id="metricUnit" name="metricUnit" />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" name="notes" rows={2} />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Metric'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowMetricForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Metrics List */}
            <div className="space-y-4">
              {performanceMetrics.map((metric, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        
                        <h3 className="text-lg font-semibold text-gray-900">{metric.metric.metricName}</h3>
                        <p className="text-sm text-gray-500">
                          
                          {metric.metric.periodStart} - {metric.metric.periodEnd}
                        </p>
                        <div className="text-sm text-gray-500 mt-1">
                          
                          Type: {metric.metric.metricType} • Unit: {metric.metric.metricUnit}
                        </div>
                        
                        {metric.campus && (
                          <div className="text-sm text-gray-500">
                            
                            Campus: {metric.campus.name}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMetricTypeColor(metric.metric.metricType)}`}>
                          
                          {metric.metric.metricType}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">
                          
                          {metric.metric.metricValue}
                        </div>
                        <div className="text-sm text-gray-500">
                          
                          Target: {metric.metric.targetValue}
                        </div>
                        <div className={`text-sm mt-1 ${
                          
                          metric.metric.trendDirection === 'up' ? 'text-green-600' :
                          
                          metric.metric.trendDirection === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          
                          {metric.metric.trendDirection === 'up' ? '↑' : metric.metric.trendDirection === 'down' ? '↓' : '→'} {Math.abs(metric.metric.variancePercentage)}%
                        </div>
                      </div>
                    </div>
                    
                    
                    {metric.metric.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">
                          
                          <strong>Notes:</strong> {metric.metric.notes}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Global Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Global Transportation Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.map((setting, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        
                        <h3 className="text-lg font-semibold text-gray-900">{setting.setting.settingKey}</h3>
                        
                        <p className="text-sm text-gray-500">{setting.setting.description}</p>
                        <div className="text-sm text-gray-500 mt-1">
                          
                          Category: {setting.setting.category} • Type: {setting.setting.settingType}
                        </div>
                        
                        {setting.campus && (
                          <div className="text-sm text-gray-500">
                            
                            Campus: {setting.campus.name}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          
                          setting.setting.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          
                          {setting.setting.isActive ? 'Active' : 'Inactive'}
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          
                          setting.setting.isGlobal ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          
                          {setting.setting.isGlobal ? 'Global' : 'Campus'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-sm text-gray-600">
                        
                        <strong>Current Value:</strong> {setting.setting.settingValue}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        
                        Last modified by: {setting.lastModifiedBy.name}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
