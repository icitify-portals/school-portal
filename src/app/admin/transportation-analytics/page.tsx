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
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  Fuel,
  Wrench,
  MessageSquare,
  Activity,
  DollarSign,
  Users,
  Bus,
  Calendar,
  MapPin,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  AlertCircle,
  Settings,
  Download,
  RefreshCw
} from "lucide-react";
import { 
  getTransportationAnalytics,
  getMaintenanceAlerts,
  getFuelEfficiencyReport,
  getIncidentReports,
  getFeedbackReports,
  createMaintenanceRecord,
  createFuelRecord,
  reportIncident,
  submitFeedback,
  generateMaintenanceAlerts
} from "@/actions/transportation-analytics";
import { toast } from "sonner";

export default function TransportationAnalytics() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [fuelReport, setFuelReport] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('daily');
  const [fuelPeriod, setFuelPeriod] = useState('monthly');
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadAnalytics();
      loadAlerts();
    } else if (activeTab === 'maintenance') {
      loadAlerts();
    } else if (activeTab === 'fuel') {
      loadFuelReport();
    } else if (activeTab === 'incidents') {
      loadIncidents();
    } else if (activeTab === 'feedback') {
      loadFeedback();
    }
  }, [activeTab, analyticsPeriod, fuelPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    const result = await getTransportationAnalytics(analyticsPeriod);
    if (result.success) {
      setAnalytics(result);
    }
    setLoading(false);
  };

  const loadAlerts = async () => {
    setLoading(true);
    const result = await getMaintenanceAlerts();
    if (result.success) {
      setAlerts(result.alerts);
    }
    setLoading(false);
  };

  const loadFuelReport = async () => {
    setLoading(true);
    const result = await getFuelEfficiencyReport(undefined, fuelPeriod);
    if (result.success) {
      setFuelReport(result);
    }
    setLoading(false);
  };

  const loadIncidents = async () => {
    setLoading(true);
    const result = await getIncidentReports({ limit: 50 });
    if (result.success) {
      setIncidents(result.incidents);
    }
    setLoading(false);
  };

  const loadFeedback = async () => {
    setLoading(true);
    const result = await getFeedbackReports({ limit: 50 });
    if (result.success) {
      setFeedback(result.feedback);
    }
    setLoading(false);
  };

  const handleMaintenanceRecord = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const maintenanceData = {
      vehicleId: parseInt(formData.get('vehicleId')),
      maintenanceType: formData.get('maintenanceType'),
      description: formData.get('description'),
      scheduledDate: formData.get('scheduledDate'),
      cost: parseFloat(formData.get('cost')),
      mechanicName: formData.get('mechanicName'),
      odometerReading: parseInt(formData.get('odometerReading')),
      partsUsed: formData.get('partsUsed'),
      invoiceNumber: formData.get('invoiceNumber'),
      warrantyClaim: formData.get('warrantyClaim') === 'true',
    };

    const result = await createMaintenanceRecord(maintenanceData);
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      setShowMaintenanceForm(false);
      loadAlerts();
      e.target.reset();
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleFuelRecord = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const fuelData = {
      vehicleId: parseInt(formData.get('vehicleId')),
      fuelDate: formData.get('fuelDate'),
      fuelType: formData.get('fuelType'),
      quantityLiters: parseFloat(formData.get('quantityLiters')),
      costPerLiter: parseFloat(formData.get('costPerLiter')),
      totalCost: parseFloat(formData.get('totalCost')),
      odometerReading: parseInt(formData.get('odometerReading')),
      fuelingStation: formData.get('fuelingStation'),
      driverId: parseInt(formData.get('driverId')),
      receiptNumber: formData.get('receiptNumber'),
      paymentMethod: formData.get('paymentMethod'),
      notes: formData.get('notes'),
    };

    const result = await createFuelRecord(fuelData);
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      setShowFuelForm(false);
      loadFuelReport();
      e.target.reset();
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleIncidentReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const incidentData = {
      vehicleId: parseInt(formData.get('vehicleId')),
      driverId: parseInt(formData.get('driverId')),
      incidentType: formData.get('incidentType'),
      severity: formData.get('severity'),
      description: formData.get('description'),
      incidentDateTime: formData.get('incidentDateTime'),
      location: formData.get('location'),
      latitude: formData.get('latitude') ? parseFloat(formData.get('latitude')) : undefined,
      longitude: formData.get('longitude') ? parseFloat(formData.get('longitude')) : undefined,
      passengersInvolved: formData.get('passengersInvolved'),
      injuries: formData.get('injuries'),
      policeReportNumber: formData.get('policeReportNumber'),
      insuranceClaimNumber: formData.get('insuranceClaimNumber'),
      estimatedCost: parseFloat(formData.get('estimatedCost')),
    };

    const result = await reportIncident(incidentData);
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      setShowIncidentForm(false);
      loadIncidents();
      e.target.reset();
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const feedbackData = {
      studentId: parseInt(formData.get('studentId')),
      feedbackType: formData.get('feedbackType'),
      category: formData.get('category'),
      rating: formData.get('rating') ? parseInt(formData.get('rating')) : undefined,
      comments: formData.get('comments'),
      tripId: formData.get('tripId') ? parseInt(formData.get('tripId')) : undefined,
      routeId: formData.get('routeId') ? parseInt(formData.get('routeId')) : undefined,
      vehicleId: formData.get('vehicleId') ? parseInt(formData.get('vehicleId')) : undefined,
      driverId: formData.get('driverId') ? parseInt(formData.get('driverId')) : undefined,
    };

    const result = await submitFeedback(feedbackData);
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      setShowFeedbackForm(false);
      loadFeedback();
      e.target.reset();
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleGenerateAlerts = async () => {
    setLoading(true);
    const result = await generateMaintenanceAlerts();
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      loadAlerts();
    } else {
      toast.error(`❌ ${result.error}`);
    }
    setLoading(false);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertLevelColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeedbackTypeColor = (type) => {
    switch (type) {
      case 'compliment': return 'bg-green-100 text-green-800';
      case 'complaint': return 'bg-red-100 text-red-800';
      case 'suggestion': return 'bg-blue-100 text-blue-800';
      case 'incident_report': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transportation Analytics</h1>
            <p className="text-gray-600">Advanced analytics, maintenance, and performance monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setActiveTab('dashboard')}
            >
              <Activity className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === 'maintenance' ? 'default' : 'outline'}
              onClick={() => setActiveTab('maintenance')}
            >
              <Wrench className="w-4 h-4 mr-2" />
              Maintenance
            </Button>
            <Button
              variant={activeTab === 'fuel' ? 'default' : 'outline'}
              onClick={() => setActiveTab('fuel')}
            >
              <Fuel className="w-4 h-4 mr-2" />
              Fuel
            </Button>
            <Button
              variant={activeTab === 'incidents' ? 'default' : 'outline'}
              onClick={() => setActiveTab('incidents')}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Incidents
            </Button>
            <Button
              variant={activeTab === 'feedback' ? 'default' : 'outline'}
              onClick={() => setActiveTab('feedback')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Feedback
            </Button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {activeTab === 'dashboard' && analytics && (
          <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Label htmlFor="period">Analytics Period</Label>
                <Select value={analyticsPeriod} onValueChange={setAnalyticsPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={loadAnalytics} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Bus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Trips</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.summary.trips.totalTrips}</p>
                      <p className="text-xs text-gray-500">
                        {analytics.summary.trips.completedTrips} completed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Boardings</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.summary.trips.totalBoardings}</p>
                      <p className="text-xs text-gray-500">
                        Avg: {Math.round(analytics.summary.trips.totalBoardings / analytics.summary.trips.totalTrips)} per trip
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">₦{analytics.summary.trips.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        ₦{Math.round(analytics.summary.trips.totalRevenue / analytics.summary.trips.totalTrips)} per trip
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Fuel className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Fuel Cost</p>
                      <p className="text-2xl font-bold text-gray-900">₦{analytics.summary.fuel.totalFuelCost.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {analytics.summary.fuel.totalLiters} liters
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Route Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Route Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.routePerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="routeName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="totalBoardings" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Driver Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Driver Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.driverPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="driverName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completedTrips" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Maintenance Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Maintenance Alerts
                  </span>
                  <Button onClick={handleGenerateAlerts} disabled={loading} size="sm">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Generate Alerts
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className={`w-4 h-4 mr-3 ${
                          alert.alert.alertLevel === 'critical' ? 'text-red-500' :
                          alert.alert.alertLevel === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900">{alert.alert.title}</div>
                          <div className="text-sm text-gray-500">
                            {alert.vehicle.registrationNumber} • {alert.alert.message}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAlertLevelColor(alert.alert.alertLevel)}`}>
                          {alert.alert.alertLevel}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Due: {alert.alert.dueDate}
                        </div>
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      No active maintenance alerts
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Maintenance Management</h2>
              <div className="flex gap-2">
                <Button onClick={handleGenerateAlerts} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Generate Alerts
                </Button>
                <Button onClick={() => setShowMaintenanceForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Maintenance
                </Button>
              </div>
            </div>

            {/* Maintenance Form */}
            {showMaintenanceForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Maintenance Record</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleMaintenanceRecord} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicleId">Vehicle *</Label>
                        <Select name="vehicleId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">ABC-123-45 (Toyota Hiace)</SelectItem>
                            <SelectItem value="2">DEF-456-78 (Mercedes Sprinter)</SelectItem>
                            <SelectItem value="3">GHI-789-01 (Nissan Urvan)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="maintenanceType">Type *</Label>
                        <Select name="maintenanceType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="routine">Routine</SelectItem>
                            <SelectItem value="repair">Repair</SelectItem>
                            <SelectItem value="inspection">Inspection</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                        <Input id="scheduledDate" name="scheduledDate" type="date" required />
                      </div>
                      <div>
                        <Label htmlFor="cost">Cost (₦) *</Label>
                        <Input id="cost" name="cost" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="mechanicName">Mechanic Name *</Label>
                        <Input id="mechanicName" name="mechanicName" required />
                      </div>
                      <div>
                        <Label htmlFor="odometerReading">Odometer Reading *</Label>
                        <Input id="odometerReading" name="odometerReading" type="number" required />
                      </div>
                      <div>
                        <Label htmlFor="invoiceNumber">Invoice Number</Label>
                        <Input id="invoiceNumber" name="invoiceNumber" />
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="warrantyClaim" name="warrantyClaim" value="true" className="mr-2" />
                        <Label htmlFor="warrantyClaim">Warranty Claim</Label>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea id="description" name="description" required />
                    </div>
                    <div>
                      <Label htmlFor="partsUsed">Parts Used</Label>
                      <Textarea id="partsUsed" name="partsUsed" rows={2} />
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Maintenance'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowMaintenanceForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Alerts List */}
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className={`w-5 h-5 mr-3 ${
                          alert.alert.alertLevel === 'critical' ? 'text-red-500' :
                          alert.alert.alertLevel === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{alert.alert.title}</h3>
                          <p className="text-gray-600">{alert.alert.message}</p>
                          <div className="text-sm text-gray-500 mt-1">
                            Vehicle: {alert.vehicle.registrationNumber} ({alert.vehicle.make} {alert.vehicle.model})
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAlertLevelColor(alert.alert.alertLevel)}`}>
                          {alert.alert.alertLevel}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Due: {alert.alert.dueDate}
                        </div>
                        <div className="text-sm text-gray-500">
                          Type: {alert.alert.alertType.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Fuel Tab */}
        {activeTab === 'fuel' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Fuel Management</h2>
                <Select value={fuelPeriod} onValueChange={setFuelPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setShowFuelForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Fuel Record
              </Button>
            </div>

            {/* Fuel Form */}
            {showFuelForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Fuel Record</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFuelRecord} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicleId">Vehicle *</Label>
                        <Select name="vehicleId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">ABC-123-45 (Toyota Hiace)</SelectItem>
                            <SelectItem value="2">DEF-456-78 (Mercedes Sprinter)</SelectItem>
                            <SelectItem value="3">GHI-789-01 (Nissan Urvan)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fuelDate">Fuel Date *</Label>
                        <Input id="fuelDate" name="fuelDate" type="date" required />
                      </div>
                      <div>
                        <Label htmlFor="fuelType">Fuel Type *</Label>
                        <Select name="fuelType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fuel type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="petrol">Petrol</SelectItem>
                            <SelectItem value="electric">Electric</SelectItem>
                            <SelectItem value="cng">CNG</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="quantityLiters">Quantity (Liters) *</Label>
                        <Input id="quantityLiters" name="quantityLiters" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="costPerLiter">Cost per Liter (₦) *</Label>
                        <Input id="costPerLiter" name="costPerLiter" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="totalCost">Total Cost (₦) *</Label>
                        <Input id="totalCost" name="totalCost" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="odometerReading">Odometer Reading *</Label>
                        <Input id="odometerReading" name="odometerReading" type="number" required />
                      </div>
                      <div>
                        <Label htmlFor="fuelingStation">Fueling Station *</Label>
                        <Input id="fuelingStation" name="fuelingStation" required />
                      </div>
                      <div>
                        <Label htmlFor="driverId">Driver</Label>
                        <Select name="driverId">
                          <SelectTrigger>
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Driver 1</SelectItem>
                            <SelectItem value="2">Driver 2</SelectItem>
                            <SelectItem value="3">Driver 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="receiptNumber">Receipt Number</Label>
                        <Input id="receiptNumber" name="receiptNumber" />
                      </div>
                      <div>
                        <Label htmlFor="paymentMethod">Payment Method *</Label>
                        <Select name="paymentMethod" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="company_account">Company Account</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" name="notes" rows={2} />
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Fuel Record'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowFuelForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Fuel Efficiency Report */}
            {fuelReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Fuel Consumption Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Cost:</span>
                        <span className="font-bold">₦{fuelReport.summary?.totalFuelCost || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Liters:</span>
                        <span className="font-bold">{fuelReport.summary?.totalLiters || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Cost/Liter:</span>
                        <span className="font-bold">₦{fuelReport.summary?.avgCostPerLiter || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={fuelReport.efficiencyMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="registrationNumber" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="efficiency" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Incidents Tab */}
        {activeTab === 'incidents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Incident Reports</h2>
              <Button onClick={() => setShowIncidentForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Report Incident
              </Button>
            </div>

            {/* Incident Form */}
            {showIncidentForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Report New Incident</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleIncidentReport} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicleId">Vehicle *</Label>
                        <Select name="vehicleId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">ABC-123-45 (Toyota Hiace)</SelectItem>
                            <SelectItem value="2">DEF-456-78 (Mercedes Sprinter)</SelectItem>
                            <SelectItem value="3">GHI-789-01 (Nissan Urvan)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="driverId">Driver *</Label>
                        <Select name="driverId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Driver 1</SelectItem>
                            <SelectItem value="2">Driver 2</SelectItem>
                            <SelectItem value="3">Driver 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="incidentType">Incident Type *</Label>
                        <Select name="incidentType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accident">Accident</SelectItem>
                            <SelectItem value="breakdown">Breakdown</SelectItem>
                            <SelectItem value="traffic_violation">Traffic Violation</SelectItem>
                            <SelectItem value="passenger_incident">Passenger Incident</SelectItem>
                            <SelectItem value="theft">Theft</SelectItem>
                            <SelectItem value="vandalism">Vandalism</SelectItem>
                            <SelectItem value="medical_emergency">Medical Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="severity">Severity *</Label>
                        <Select name="severity" required>
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
                        <Label htmlFor="incidentDateTime">Date & Time *</Label>
                        <Input id="incidentDateTime" name="incidentDateTime" type="datetime-local" required />
                      </div>
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input id="location" name="location" required />
                      </div>
                      <div>
                        <Label htmlFor="estimatedCost">Estimated Cost (₦) *</Label>
                        <Input id="estimatedCost" name="estimatedCost" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input id="latitude" name="latitude" type="number" step="0.000001" />
                      </div>
                      <div>
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input id="longitude" name="longitude" type="number" step="0.000001" />
                      </div>
                      <div>
                        <Label htmlFor="policeReportNumber">Police Report Number</Label>
                        <Input id="policeReportNumber" name="policeReportNumber" />
                      </div>
                      <div>
                        <Label htmlFor="insuranceClaimNumber">Insurance Claim Number</Label>
                        <Input id="insuranceClaimNumber" name="insuranceClaimNumber" />
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
                      <Label htmlFor="injuries">Injuries</Label>
                      <Textarea id="injuries" name="injuries" rows={2} />
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Reporting...' : 'Report Incident'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowIncidentForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Incidents List */}
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className={`w-5 h-5 mr-3 ${
                          incident.incident.severity === 'critical' ? 'text-red-500' :
                          incident.incident.severity === 'high' ? 'text-orange-500' :
                          incident.incident.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {incident.incident.incidentType.replace('_', ' ').toUpperCase()}
                          </h3>
                          <p className="text-gray-600">{incident.incident.description}</p>
                          <div className="text-sm text-gray-500 mt-1">
                            Vehicle: {incident.vehicle.registrationNumber} • Driver: {incident.driver.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Location: {incident.incident.location} • {new Date(incident.incident.incidentDateTime).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(incident.incident.severity)}`}>
                          {incident.incident.severity}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Cost: ₦{incident.incident.estimatedCost}
                        </div>
                        <div className="text-sm text-gray-500">
                          Status: {incident.incident.status}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Student Feedback</h2>
              <Button onClick={() => setShowFeedbackForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Feedback
              </Button>
            </div>

            {/* Feedback Form */}
            {showFeedbackForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Submit Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="studentId">Student *</Label>
                        <Select name="studentId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">Alice Johnson (STU-1357)</SelectItem>
                            <SelectItem value="3">Bob Smith (STU-5691)</SelectItem>
                            <SelectItem value="4">Charlie Brown (STU-1540)</SelectItem>
                            <SelectItem value="5">Primary Student 1 (P-5505)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="feedbackType">Feedback Type *</Label>
                        <Select name="feedbackType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compliment">Compliment</SelectItem>
                            <SelectItem value="complaint">Complaint</SelectItem>
                            <SelectItem value="suggestion">Suggestion</SelectItem>
                            <SelectItem value="incident_report">Incident Report</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select name="category" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="punctuality">Punctuality</SelectItem>
                            <SelectItem value="cleanliness">Cleanliness</SelectItem>
                            <SelectItem value="driver_behavior">Driver Behavior</SelectItem>
                            <SelectItem value="safety">Safety</SelectItem>
                            <SelectItem value="comfort">Comfort</SelectItem>
                            <SelectItem value="crowding">Crowding</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="rating">Rating (1-5)</Label>
                        <Select name="rating">
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Poor</SelectItem>
                            <SelectItem value="2">2 - Fair</SelectItem>
                            <SelectItem value="3">3 - Good</SelectItem>
                            <SelectItem value="4">4 - Very Good</SelectItem>
                            <SelectItem value="5">5 - Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="routeId">Route</Label>
                        <Select name="routeId">
                          <SelectTrigger>
                            <SelectValue placeholder="Select route" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Main Campus Shuttle</SelectItem>
                            <SelectItem value="2">Science Faculty Express</SelectItem>
                            <SelectItem value="3">Hostel Shuttle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="vehicleId">Vehicle</Label>
                        <Select name="vehicleId">
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">ABC-123-45</SelectItem>
                            <SelectItem value="2">DEF-456-78</SelectItem>
                            <SelectItem value="3">GHI-789-01</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="driverId">Driver</Label>
                        <Select name="driverId">
                          <SelectTrigger>
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Driver 1</SelectItem>
                            <SelectItem value="2">Driver 2</SelectItem>
                            <SelectItem value="3">Driver 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="tripId">Trip</Label>
                        <Select name="tripId">
                          <SelectTrigger>
                            <SelectValue placeholder="Select trip" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Trip 1</SelectItem>
                            <SelectItem value="2">Trip 2</SelectItem>
                            <SelectItem value="3">Trip 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="comments">Comments *</Label>
                      <Textarea id="comments" name="comments" required />
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Feedback'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowFeedbackForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Feedback List */}
            <div className="space-y-4">
              {feedback.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {item.feedback.feedbackType === 'compliment' && <ThumbsUp className="w-5 h-5 text-green-500" />}
                          {item.feedback.feedbackType === 'complaint' && <ThumbsDown className="w-5 h-5 text-red-500" />}
                          {item.feedback.feedbackType === 'suggestion' && <Lightbulb className="w-5 h-5 text-blue-500" />}
                          {item.feedback.feedbackType === 'incident_report' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.feedback.feedbackType.replace('_', ' ').toUpperCase()}
                          </h3>
                          <p className="text-gray-600">{item.feedback.comments}</p>
                          <div className="text-sm text-gray-500 mt-1">
                            Student: {item.student.firstName} {item.student.lastName} ({item.student.matricNumber})
                          </div>
                          <div className="text-sm text-gray-500">
                            Category: {item.feedback.category.replace('_', ' ')} • {new Date(item.feedback.feedbackDate).toLocaleString()}
                          </div>
                          {item.feedback.rating && (
                            <div className="flex items-center mt-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < item.feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getFeedbackTypeColor(item.feedback.feedbackType)}`}>
                          {item.feedback.feedbackType.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Status: {item.feedback.status}
                        </div>
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
