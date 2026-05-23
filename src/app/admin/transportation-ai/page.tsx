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
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
import { 
  MapPin, 
  Smartphone, 
  Brain, 
  TrendingUp,
  AlertTriangle,
  Bell,
  CreditCard,
  BarChart3,
  Activity,
  Users,
  Bus,
  Route,
  Zap,
  Target,
  Clock,
  DollarSign,
  Settings,
  Download,
  RefreshCw,
  Map,
  Navigation,
  Wifi,
  Battery,
  Fuel,
  Gauge,
  Star,
  MessageCircle,
  Shield,
  Cpu,
  Database,
  Lightbulb
} from "lucide-react";
import { 
  updateGPSTracking,
  getRealTimeVehicleLocations,
  createMobileSession,
  processPaymentTransaction,
  sendSmartNotification,
  trackMobileAppEvent,
  getRouteOptimizations,
  getDemandForecasts,
  getPredictiveMaintenanceAlerts,
  getPassengerBehaviorAnalytics,
  getMobileAppAnalytics,
  generateAIInsights
} from "@/actions/transportation-ai";
import { toast } from "sonner";

export default function TransportationAI() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiInsights, setAiInsights] = useState(null);
  const [vehicleLocations, setVehicleLocations] = useState([]);
  const [routeOptimizations, setRouteOptimizations] = useState([]);
  const [demandForecasts, setDemandForecasts] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [passengerBehavior, setPassengerBehavior] = useState([]);
  const [mobileAnalytics, setMobileAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGPSSimulator, setShowGPSSimulator] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadAIInsights();
      loadVehicleLocations();
    } else if (activeTab === 'gps') {
      loadVehicleLocations();
    } else if (activeTab === 'optimization') {
      loadRouteOptimizations();
    } else if (activeTab === 'forecasting') {
      loadDemandForecasts();
    } else if (activeTab === 'maintenance') {
      loadMaintenanceAlerts();
    } else if (activeTab === 'behavior') {
      loadPassengerBehavior();
    } else if (activeTab === 'mobile') {
      loadMobileAnalytics();
    }
  }, [activeTab]);

  const loadAIInsights = async () => {
    setLoading(true);
    const result = await generateAIInsights();
    if (result.success) {
      setAiInsights(result);
    }
    setLoading(false);
  };

  const loadVehicleLocations = async () => {
    setLoading(true);
    const result = await getRealTimeVehicleLocations();
    if (result.success) {
      setVehicleLocations(result.locations);
    }
    setLoading(false);
  };

  const loadRouteOptimizations = async () => {
    setLoading(true);
    const result = await getRouteOptimizations();
    if (result.success) {
      setRouteOptimizations(result.optimizations);
    }
    setLoading(false);
  };

  const loadDemandForecasts = async () => {
    setLoading(true);
    const result = await getDemandForecasts();
    if (result.success) {
      setDemandForecasts(result.forecasts);
    }
    setLoading(false);
  };

  const loadMaintenanceAlerts = async () => {
    setLoading(true);
    const result = await getPredictiveMaintenanceAlerts();
    if (result.success) {
      setMaintenanceAlerts(result.alerts);
    }
    setLoading(false);
  };

  const loadPassengerBehavior = async () => {
    setLoading(true);
    const result = await getPassengerBehaviorAnalytics();
    if (result.success) {
      setPassengerBehavior(result.analytics);
    }
    setLoading(false);
  };

  const loadMobileAnalytics = async () => {
    setLoading(true);
    const result = await getMobileAppAnalytics({ limit: 50 });
    if (result.success) {
      setMobileAnalytics(result.analytics);
    }
    setLoading(false);
  };

  const handleGPSSimulator = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const gpsData = {
      vehicleId: parseInt(formData.get('vehicleId') as string),
      latitude: parseFloat(formData.get('latitude') as string),
      longitude: parseFloat(formData.get('longitude') as string),
      speed: parseFloat(formData.get('speed') as string),
      heading: parseFloat(formData.get('heading') as string),
      ignitionStatus: formData.get('ignitionStatus') === 'true',
      gpsStatus: formData.get('gpsStatus') as string,
      batteryLevel: parseInt(formData.get('batteryLevel') as string),
      fuelLevel: parseFloat(formData.get('fuelLevel') as string),
      odometerReading: parseInt(formData.get('odometerReading') as string),
      engineStatus: formData.get('engineStatus') as string,
    };

    const result = await updateGPSTracking(gpsData);
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      setShowGPSSimulator(false);
      loadVehicleLocations();
      e.target.reset();
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const notificationData = {
      userId: parseInt(formData.get('userId') as string),
      notificationType: formData.get('notificationType') as string,
      title: formData.get('title') as string,
      message: formData.get('message') as string,
      priority: formData.get('priority') as string,
      channels: JSON.parse((formData.get('channels') as string) || '[]'),
      responseRequired: formData.get('responseRequired') === 'true',
    };

    const result = await sendSmartNotification(notificationData);
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      setShowNotificationForm(false);
      e.target.reset();
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const paymentData = {
      transactionReference: formData.get('transactionReference') as string,
      transactionType: formData.get('transactionType') as string,
      amount: parseFloat(formData.get('amount') as string),
      currency: formData.get('currency') as string,
      paymentMethod: formData.get('paymentMethod') as string,
      paymentGateway: formData.get('paymentGateway') as string,
      gatewayTransactionId: formData.get('gatewayTransactionId') as string,
      metadata: JSON.parse((formData.get('metadata') as string) || '{}'),
    };

    const result = await processPaymentTransaction(paymentData);
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      setShowPaymentForm(false);
      e.target.reset();
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transportation AI & Mobile</h1>
            <p className="text-gray-600">Real-time GPS tracking, AI-powered insights, and mobile app analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setActiveTab('dashboard')}
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Insights
            </Button>
            <Button
              variant={activeTab === 'gps' ? 'default' : 'outline'}
              onClick={() => setActiveTab('gps')}
            >
              <MapPin className="w-4 h-4 mr-2" />
              GPS Tracking
            </Button>
            <Button
              variant={activeTab === 'optimization' ? 'default' : 'outline'}
              onClick={() => setActiveTab('optimization')}
            >
              <Route className="w-4 h-4 mr-2" />
              Route AI
            </Button>
            <Button
              variant={activeTab === 'forecasting' ? 'default' : 'outline'}
              onClick={() => setActiveTab('forecasting')}
            >
              <Target className="w-4 h-4 mr-2" />
              Demand AI
            </Button>
            <Button
              variant={activeTab === 'maintenance' ? 'default' : 'outline'}
              onClick={() => setActiveTab('maintenance')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Predictive AI
            </Button>
            <Button
              variant={activeTab === 'behavior' ? 'default' : 'outline'}
              onClick={() => setActiveTab('behavior')}
            >
              <Users className="w-4 h-4 mr-2" />
              Behavior AI
            </Button>
            <Button
              variant={activeTab === 'mobile' ? 'default' : 'outline'}
              onClick={() => setActiveTab('mobile')}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Mobile Analytics
            </Button>
          </div>

        </div>

        {/* AI Insights Dashboard */}
        {activeTab === 'dashboard' && aiInsights && (
          <div className="space-y-6">
            {/* AI Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Route className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Route Optimizations</p>
                      <p className="text-2xl font-bold text-gray-900">{aiInsights.insights.routeOptimization.totalOptimizations}</p>
                      <p className="text-xs text-gray-500">
                        {aiInsights.insights.routeOptimization.appliedOptimizations} applied
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <Target className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Forecast Accuracy</p>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(aiInsights.insights.demandForecasting.avgAccuracy * 100)}%</p>
                      <p className="text-xs text-gray-500">
                        {aiInsights.insights.demandForecasting.totalForecasts} forecasts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Settings className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Maintenance Predictions</p>
                      <p className="text-2xl font-bold text-gray-900">{aiInsights.insights.predictiveMaintenance.totalPredictions}</p>
                      <p className="text-xs text-gray-500">
                        {aiInsights.insights.predictiveMaintenance.criticalPredictions} critical
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Passenger Satisfaction</p>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(aiInsights.insights.passengerBehavior.avgSatisfaction)}/5</p>
                      <p className="text-xs text-gray-500">
                        {aiInsights.insights.passengerBehavior.totalJourneys} journeys
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-pink-100 rounded-full">
                      <Smartphone className="w-6 h-6 text-pink-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Mobile App Usage</p>
                      <p className="text-2xl font-bold text-gray-900">{aiInsights.insights.mobileAppUsage.uniqueUsers}</p>
                      <p className="text-xs text-gray-500">
                        {aiInsights.insights.mobileAppUsage.totalEvents} events
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Performance Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Route Optimization Impact */}
              <Card>
                <CardHeader>
                  <CardTitle>Route Optimization Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Fuel Savings:</span>
                      <span className="font-bold">₦{aiInsights.insights.routeOptimization.totalFuelSavings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time Savings:</span>
                      <span className="font-bold">{aiInsights.insights.routeOptimization.avgTimeSavings}min avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Application Rate:</span>
                      <span className="font-bold">{Math.round((aiInsights.insights.routeOptimization.appliedOptimizations / aiInsights.insights.routeOptimization.totalOptimizations) * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Predictive Maintenance */}
              <Card>
                <CardHeader>
                  <CardTitle>Predictive Maintenance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Critical Alerts:</span>
                      <span className="font-bold text-red-600">{aiInsights.insights.predictiveMaintenance.criticalPredictions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resolved:</span>
                      <span className="font-bold text-green-600">{aiInsights.insights.predictiveMaintenance.resolvedPredictions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost Savings:</span>
                      <span className="font-bold">₦{aiInsights.insights.predictiveMaintenance.estimatedCostSavings}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile App Engagement */}
              <Card>
                <CardHeader>
                  <CardTitle>Mobile App Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Daily Opens:</span>
                      <span className="font-bold">{aiInsights.insights.mobileAppUsage.appOpens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>QR Scans:</span>
                      <span className="font-bold">{aiInsights.insights.mobileAppUsage.qrScans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payments:</span>
                      <span className="font-bold">{aiInsights.insights.mobileAppUsage.payments}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiInsights.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <Lightbulb className="w-4 h-4 mr-3 text-blue-600" />
                      <span className="text-blue-900">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Real-time GPS Tracking */}
        {activeTab === 'gps' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Real-time GPS Tracking</h2>
              <div className="flex gap-2">
                <Button onClick={loadVehicleLocations} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => setShowGPSSimulator(true)}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Simulate GPS
                </Button>
              </div>
            </div>

            {/* GPS Simulator Form */}
            {showGPSSimulator && (
              <Card>
                <CardHeader>
                  <CardTitle>Simulate GPS Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGPSSimulator} className="space-y-4">
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
                        <Label htmlFor="speed">Speed (km/h) *</Label>
                        <Input id="speed" name="speed" type="number" required />
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
                        <Label htmlFor="heading">Heading (degrees) *</Label>
                        <Input id="heading" name="heading" type="number" required />
                      </div>
                      <div>
                        <Label htmlFor="batteryLevel">Battery Level (%)</Label>
                        <Input id="batteryLevel" name="batteryLevel" type="number" min="0" max="100" />
                      </div>
                      <div>
                        <Label htmlFor="fuelLevel">Fuel Level (%)</Label>
                        <Input id="fuelLevel" name="fuelLevel" type="number" min="0" max="100" />
                      </div>
                      <div>
                        <Label htmlFor="odometerReading">Odometer Reading</Label>
                        <Input id="odometerReading" name="odometerReading" type="number" />
                      </div>
                      <div>
                        <Label htmlFor="ignitionStatus">Ignition Status</Label>
                        <Select name="ignitionStatus">
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">On</SelectItem>
                            <SelectItem value="false">Off</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="gpsStatus">GPS Status</Label>
                        <Select name="gpsStatus">
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="engineStatus">Engine Status</Label>
                        <Select name="engineStatus">
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="running">Running</SelectItem>
                            <SelectItem value="stopped">Stopped</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Simulating...' : 'Simulate GPS'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowGPSSimulator(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicleLocations.map((location, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{location.vehicle.registrationNumber}</h3>
                        <p className="text-sm text-gray-500">{location.vehicle.make} {location.vehicle.model}</p>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          location.gps.ignitionStatus ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm text-gray-600">
                          {location.gps.ignitionStatus ? 'Running' : 'Stopped'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{location.gps.latitude.toFixed(6)}, {location.gps.longitude.toFixed(6)}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Gauge className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{location.gps.speed} km/h</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Navigation className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{location.gps.heading}°</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Battery className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{location.gps.batteryLevel}% battery</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Fuel className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{location.gps.fuelLevel}% fuel</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{new Date(location.gps.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Route Optimization AI */}
        {activeTab === 'optimization' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">AI Route Optimization</h2>
              <Button onClick={loadRouteOptimizations} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Route Optimizations */}
            <div className="space-y-4">
              {routeOptimizations.map((optimization, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{optimization.route.name}</h3>
                        <p className="text-sm text-gray-500">{optimization.route.code}</p>
                        <div className="text-sm text-gray-500 mt-1">
                          {optimization.route.startPoint} → {optimization.route.endPoint}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          optimization.optimization.applied ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {optimization.optimization.applied ? 'Applied' : 'Pending'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(optimization.optimization.optimizationDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{optimization.optimization.originalDistance}km</div>
                        <div className="text-sm text-gray-500">Original</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{optimization.optimization.optimizedDistance}km</div>
                        <div className="text-sm text-gray-500">Optimized</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">₦{optimization.optimization.fuelSavings}</div>
                        <div className="text-sm text-gray-500">Fuel Saved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{optimization.optimization.timeSavings}min</div>
                        <div className="text-sm text-gray-500">Time Saved</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        <strong>Algorithm:</strong> {optimization.optimization.optimizationAlgorithm} • 
                        <strong> Confidence:</strong> {Math.round(optimization.optimization.confidenceScore * 100)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Demand Forecasting AI */}
        {activeTab === 'forecasting' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">AI Demand Forecasting</h2>
              <Button onClick={loadDemandForecasts} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Demand Forecasts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {demandForecasts.map((forecast, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{forecast.route.name}</h3>
                        <p className="text-sm text-gray-500">{forecast.forecast.forecastType}</p>
                        <div className="text-sm text-gray-500">
                          {new Date(forecast.forecast.forecastDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round(forecast.forecast.confidenceLevel * 100)}%
                        </div>
                        <div className="text-sm text-gray-500">Confidence</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{forecast.forecast.predictedBoardings}</div>
                        <div className="text-sm text-gray-500">Predicted Boardings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">₦{forecast.forecast.predictedRevenue}</div>
                        <div className="text-sm text-gray-500">Predicted Revenue</div>
                      </div>
                    </div>
                    
                    {forecast.forecast.actualBoardings && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{forecast.forecast.actualBoardings}</div>
                          <div className="text-sm text-gray-500">Actual Boardings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">₦{forecast.forecast.actualRevenue}</div>
                          <div className="text-sm text-gray-500">Actual Revenue</div>
                        </div>
                      </div>
                    )}
                    
                    {forecast.forecast.accuracy && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-800">
                          <strong>Accuracy:</strong> {Math.round(forecast.forecast.accuracy * 100)}%
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        <strong>Model:</strong> {forecast.forecast.modelVersion} • 
                        <strong> Factors:</strong> Weather, Day of Week, Historical Data
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Predictive Maintenance AI */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">AI Predictive Maintenance</h2>
              <Button onClick={loadMaintenanceAlerts} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Predictive Maintenance Alerts */}
            <div className="space-y-4">
              {maintenanceAlerts.map((alert, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className={`w-5 h-5 mr-3 ${
                          alert.alert.urgencyLevel === 'critical' ? 'text-red-500' :
                          alert.alert.urgencyLevel === 'high' ? 'text-orange-500' :
                          alert.alert.urgencyLevel === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {alert.alert.componentType.replace('_', ' ').toUpperCase()} Failure Risk
                          </h3>
                          <p className="text-gray-600">Vehicle: {alert.vehicle.registrationNumber}</p>
                          <div className="text-sm text-gray-500 mt-1">
                            Failure Probability: {Math.round(alert.alert.failureProbability * 100)}% • 
                            Predicted: {alert.alert.predictedFailureDate}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(alert.alert.urgencyLevel)}`}>
                          {alert.alert.urgencyLevel}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Est. Cost: ₦{alert.alert.estimatedCost}
                        </div>
                        <div className="text-sm text-gray-500">
                          Status: {alert.alert.status}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        <strong>Confidence:</strong> {Math.round(alert.alert.confidenceScore * 100)}% • 
                        <strong> Model:</strong> {alert.alert.modelVersion}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Passenger Behavior AI */}
        {activeTab === 'behavior' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">AI Passenger Behavior Analytics</h2>
              <Button onClick={loadPassengerBehavior} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Passenger Behavior Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {passengerBehavior.slice(0, 9).map((behavior, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {behavior.student.firstName} {behavior.student.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{behavior.student.matricNumber}</p>
                        <div className="text-sm text-gray-500">
                          Route: {behavior.route.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < (behavior.behavior.satisfactionScore || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Satisfaction: {behavior.behavior.satisfactionScore}/5
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Device Type:</span>
                        <span className="font-medium">{behavior.behavior.deviceType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Travel Duration:</span>
                        <span className="font-medium">{behavior.behavior.travelDuration}min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Fare Paid:</span>
                        <span className="font-medium">₦{behavior.behavior.farePaid}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Loyalty Score:</span>
                        <span className="font-medium">{behavior.behavior.loyaltyScore}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Frequency Score:</span>
                        <span className="font-medium">{behavior.behavior.frequencyScore}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        <strong>Journey:</strong> {new Date(behavior.behavior.boardingTime).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Mobile App Analytics */}
        {activeTab === 'mobile' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Mobile App Analytics</h2>
              <div className="flex gap-2">
                <Button onClick={() => setShowNotificationForm(true)}>
                  <Bell className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
                <Button onClick={() => setShowPaymentForm(true)}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Process Payment
                </Button>
                <Button onClick={loadMobileAnalytics} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Notification Form */}
            {showNotificationForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Send Smart Notification</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleNotification} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="userId">User ID *</Label>
                        <Input id="userId" name="userId" type="number" required />
                      </div>
                      <div>
                        <Label htmlFor="notificationType">Notification Type *</Label>
                        <Select name="notificationType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trip_reminder">Trip Reminder</SelectItem>
                            <SelectItem value="delay_alert">Delay Alert</SelectItem>
                            <SelectItem value="route_change">Route Change</SelectItem>
                            <SelectItem value="maintenance_alert">Maintenance Alert</SelectItem>
                            <SelectItem value="safety_alert">Safety Alert</SelectItem>
                            <SelectItem value="promotional">Promotional</SelectItem>
                            <SelectItem value="feedback_request">Feedback Request</SelectItem>
                            <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input id="title" name="title" required />
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select name="priority">
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea id="message" name="message" required />
                    </div>
                    <div>
                      <Label htmlFor="channels">Channels (JSON array) *</Label>
                      <Input id="channels" name="channels" defaultValue='["push", "email"]' required />
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="responseRequired" name="responseRequired" value="true" className="mr-2" />
                      <Label htmlFor="responseRequired">Response Required</Label>
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Notification'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowNotificationForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Payment Form */}
            {showPaymentForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Process Payment Transaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePayment} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="transactionReference">Transaction Reference *</Label>
                        <Input id="transactionReference" name="transactionReference" required />
                      </div>
                      <div>
                        <Label htmlFor="transactionType">Transaction Type *</Label>
                        <Select name="transactionType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="transport_fare">Transport Fare</SelectItem>
                            <SelectItem value="monthly_pass">Monthly Pass</SelectItem>
                            <SelectItem value="semester_pass">Semester Pass</SelectItem>
                            <SelectItem value="trip_pass">Trip Pass</SelectItem>
                            <SelectItem value="penalty">Penalty</SelectItem>
                            <SelectItem value="refund">Refund</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="amount">Amount (₦) *</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Input id="currency" name="currency" defaultValue="NGN" />
                      </div>
                      <div>
                        <Label htmlFor="paymentMethod">Payment Method *</Label>
                        <Select name="paymentMethod" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="wallet">Wallet</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="paymentGateway">Payment Gateway</Label>
                        <Input id="paymentGateway" name="paymentGateway" placeholder="flutterwave, paystack, etc." />
                      </div>
                      <div>
                        <Label htmlFor="gatewayTransactionId">Gateway Transaction ID</Label>
                        <Input id="gatewayTransactionId" name="gatewayTransactionId" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="metadata">Metadata (JSON)</Label>
                      <Textarea id="metadata" name="metadata" placeholder='{"key": "value"}' />
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : 'Process Payment'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowPaymentForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Mobile Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mobileAnalytics.slice(0, 8).map((analytic, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{analytic.analytics.eventType}</h3>
                        <p className="text-sm text-gray-500">{analytic.user.name}</p>
                        <div className="text-sm text-gray-500">
                          {new Date(analytic.analytics.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {analytic.analytics.sessionDuration ? `${analytic.analytics.sessionDuration}s` : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Screen:</span>
                        <span className="font-medium">{analytic.analytics.screenName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Device:</span>
                        <span className="font-medium">{JSON.parse(analytic.analytics.deviceInfo || '{}').platform || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>App Version:</span>
                        <span className="font-medium">{analytic.analytics.appVersion || 'Unknown'}</span>
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
