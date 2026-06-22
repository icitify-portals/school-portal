"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bus, 
  Users, 
  MapPin, 
  Clock, 
  Calendar,
  QrCode,
  Ticket,
  Route,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Eye,
  UserCheck,
  Navigation,
  CreditCard
} from "lucide-react";
import { 
  registerStudentForTransport,
  getStudentRegistrations,
  getTransportRoutesWithStops,
  getTodayTrips,
  getStudentTransportDashboard
} from "@/actions/student-transportation";
import { toast } from "sonner";

export default function StudentTransportation() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [registrations, setRegistrations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [todayTrips, setTodayTrips] = useState([]);
  const [studentDashboard, setStudentDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadStudentDashboard();
    } else if (activeTab === 'registrations') {
      loadRegistrations();
    } else if (activeTab === 'routes') {
      loadRoutes();
    } else if (activeTab === 'trips') {
      loadTodayTrips();
    }
  }, [activeTab]);

  const loadStudentDashboard = async () => {
    if (!selectedStudent) return;
    
    setLoading(true);
    const result = await getStudentTransportDashboard(parseInt(selectedStudent));
    if (result.success) {
      setStudentDashboard(result);
    } else {
      setStudentDashboard(null);
    }
    setLoading(false);
  };

  const loadRegistrations = async () => {
    setLoading(true);
    const result = await getStudentRegistrations(undefined, { limit: 50 });
    if (result.success) {
      setRegistrations(result.registrations);
    }
    setLoading(false);
  };

  const loadRoutes = async () => {
    setLoading(true);
    const result = await getTransportRoutesWithStops();
    if (result.success) {
      setRoutes(result.routes);
    }
    setLoading(false);
  };

  const loadTodayTrips = async () => {
    setLoading(true);
    const result = await getTodayTrips();
    if (result.success) {
      setTodayTrips(result.trips);
    }
    setLoading(false);
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const registrationData = {
      studentId: parseInt(formData.get('studentId')),
      routeId: parseInt(formData.get('routeId')),
      registrationType: formData.get('registrationType'),
      validFrom: formData.get('validFrom'),
      validTo: formData.get('validTo'),
      fareAmount: parseFloat(formData.get('fareAmount')),
      boardingPoint: formData.get('boardingPoint'),
      alightingPoint: formData.get('alightingPoint'),
      parentContact: formData.get('parentContact'),
      emergencyContact: formData.get('emergencyContact'),
      specialRequirements: formData.get('specialRequirements'),
    };

    const result = await registerStudentForTransport(registrationData);
    if (result.success) {
      toast.success(`✅ ${result.message}`);
      setShowRegistration(false);
      loadRegistrations();
      e.target.reset();
      
      // Show QR code
      alert(`Transportation QR Code: ${result.qrData}\n\nExpires: ${result.expiresAt}`);
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  const getRegistrationTypeColor = (type) => {
    switch (type) {
      case 'semester': return 'bg-blue-100 text-blue-800';
      case 'monthly': return 'bg-green-100 text-green-800';
      case 'daily': return 'bg-yellow-100 text-yellow-800';
      case 'trip_based': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      case 'waived': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTripStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'delayed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Transportation</h1>
            <p className="text-gray-600">Manage student transportation registrations and services</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setActiveTab('dashboard')}
            >
              <Users className="w-4 h-4 mr-2" />
              Student Dashboard
            </Button>
            <Button
              variant={activeTab === 'registrations' ? 'default' : 'outline'}
              onClick={() => setActiveTab('registrations')}
            >
              <Ticket className="w-4 h-4 mr-2" />
              Registrations
            </Button>
            <Button
              variant={activeTab === 'routes' ? 'default' : 'outline'}
              onClick={() => setActiveTab('routes')}
            >
              <Route className="w-4 h-4 mr-2" />
              Routes
            </Button>
            <Button
              variant={activeTab === 'trips' ? 'default' : 'outline'}
              onClick={() => setActiveTab('trips')}
            >
              <Bus className="w-4 h-4 mr-2" />
              Today's Trips
            </Button>
          </div>
        </div>

        {/* Student Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Student Selector */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div>
                    <Label htmlFor="studentSelect">Select Student</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">Alice Johnson (STU-1357)</SelectItem>
                        <SelectItem value="3">Bob Smith (STU-5691)</SelectItem>
                        <SelectItem value="4">Charlie Brown (STU-1540)</SelectItem>
                        <SelectItem value="5">Primary Student 1 (P-5505)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={loadStudentDashboard} disabled={!selectedStudent || loading}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Student Dashboard Content */}
            {studentDashboard && (
              <>
                {/* Registration Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="w-5 h-5" />
                      Active Transportation Registration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Details</h3>
                        <div className="space-y-3">
                          <div>
                            <Label>Route</Label>
                            <div className="text-lg font-medium text-gray-900">
                              {studentDashboard.registration.route.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {studentDashboard.registration.route.code} • {studentDashboard.registration.route.startPoint} → {studentDashboard.registration.route.endPoint}
                            </div>
                          </div>
                          <div>
                            <Label>Registration Type</Label>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRegistrationTypeColor(studentDashboard.registration.registration.registrationType)}`}>
                              {studentDashboard.registration.registration.registrationType.replace('_', ' ')}
                            </div>
                          </div>
                          <div>
                            <Label>Valid Period</Label>
                            <div className="text-sm text-gray-900">
                              {new Date(studentDashboard.registration.registration.validFrom).toLocaleDateString()} - {new Date(studentDashboard.registration.registration.validTo).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Details</h3>
                        <div className="space-y-3">
                          <div>
                            <Label>Boarding Point</Label>
                            <div className="text-lg font-medium text-gray-900">
                              {studentDashboard.registration.registration.boardingPoint}
                            </div>
                          </div>
                          <div>
                            <Label>Alighting Point</Label>
                            <div className="text-lg font-medium text-gray-900">
                              {studentDashboard.registration.registration.alightingPoint}
                            </div>
                          </div>
                          <div>
                            <Label>Route Fare</Label>
                            <div className="text-lg font-medium text-gray-900">
                              {settings?.base_currency || '₦'}{studentDashboard.registration.route.fareAmount}
                            </div>
                          </div>
                          <div>
                            <Label>Payment Status</Label>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(studentDashboard.registration.registration.paymentStatus)}`}>
                              {studentDashboard.registration.registration.paymentStatus}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Today's Trips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Today's Trips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studentDashboard.todayTrips.map((trip, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <Bus className="w-5 h-5 mr-3 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {trip.vehicle.registrationNumber} ({trip.vehicle.type})
                              </div>
                              <div className="text-sm text-gray-500">
                                Driver: {trip.driver.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Departure: {new Date(trip.trip.plannedDepartureTime).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTripStatusColor(trip.trip.status)}`}>
                              {trip.trip.status}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Capacity: {trip.vehicle.type === 'bus' ? '16' : trip.vehicle.type === 'shuttle' ? '12' : '8'} seats
                            </div>
                          </div>
                        </div>
                      ))}
                      {studentDashboard.todayTrips.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No trips scheduled for today
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Boardings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Recent Boardings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studentDashboard.recentBoardings.map((boarding, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">
                                Boarded at {boarding.stop.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(boarding.boarding.boardingTime).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              Trip #{boarding.boarding.tripId}
                            </div>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTripStatusColor(boarding.trip.status)}`}>
                              {boarding.trip.status}
                            </div>
                          </div>
                        </div>
                      ))}
                      {studentDashboard.recentBoardings.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          No recent boardings found
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Transportation Registrations</h2>
              <Button onClick={() => setShowRegistration(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Register Student
              </Button>
            </div>

            {/* Registration Form */}
            {showRegistration && (
              <Card>
                <CardHeader>
                  <CardTitle>Register Student for Transportation</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegistration} className="space-y-4">
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
                        <Label htmlFor="routeId">Route *</Label>
                        <Select name="routeId" required>
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
                        <Label htmlFor="registrationType">Registration Type *</Label>
                        <Select name="registrationType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semester">Semester</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="trip_based">Trip Based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fareAmount">Fare Amount *</Label>
                        <Input id="fareAmount" name="fareAmount" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="validFrom">Valid From *</Label>
                        <Input id="validFrom" name="validFrom" type="date" required />
                      </div>
                      <div>
                        <Label htmlFor="validTo">Valid To *</Label>
                        <Input id="validTo" name="validTo" type="date" required />
                      </div>
                      <div>
                        <Label htmlFor="boardingPoint">Boarding Point *</Label>
                        <Input id="boardingPoint" name="boardingPoint" required />
                      </div>
                      <div>
                        <Label htmlFor="alightingPoint">Alighting Point *</Label>
                        <Input id="alightingPoint" name="alightingPoint" required />
                      </div>
                      <div>
                        <Label htmlFor="parentContact">Parent Contact *</Label>
                        <Input id="parentContact" name="parentContact" required />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                        <Input id="emergencyContact" name="emergencyContact" required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="specialRequirements">Special Requirements</Label>
                      <Textarea id="specialRequirements" name="specialRequirements" rows={3} />
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Registering...' : 'Register Student'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowRegistration(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Registrations List */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valid Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations.map((reg) => (
                    <tr key={reg.registration.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reg.student.firstName} {reg.student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{reg.student.matricNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{reg.route.name}</div>
                          <div className="text-sm text-gray-500">{reg.route.code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRegistrationTypeColor(reg.registration.registrationType)}`}>
                          {reg.registration.registrationType.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(reg.registration.validFrom).toLocaleDateString()} - {new Date(reg.registration.validTo).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{settings?.base_currency || '₦'}{reg.registration.fareAmount}</div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(reg.registration.paymentStatus)}`}>
                          {reg.registration.paymentStatus}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${reg.registration.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {reg.registration.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <QrCode className="w-4 h-4 mr-1" />
                            QR
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Routes Tab */}
        {activeTab === 'routes' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Available Routes</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routes.map((route, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{route.route.name}</h3>
                        <p className="text-sm text-gray-500">{route.route.code}</p>
                      </div>
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Navigation className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{route.route.startPoint} → {route.route.endPoint}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Route className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{route.route.distanceKm}km • {route.route.estimatedDurationMinutes}min</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Fare: {settings?.base_currency || '₦'}{route.route.fareAmount}</span>
                      </div>
                    </div>
                    
                    {/* Route Stops */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Stops:</h4>
                      <div className="space-y-1">
                        {route.stops && Array.isArray(route.stops) && route.stops.map((stop, stopIndex) => (
                          <div key={stopIndex} className="flex items-center text-xs text-gray-600">
                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs mr-2">
                              {stop.stopOrder}
                            </span>
                            {stop.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Today's Trips Tab */}
        {activeTab === 'trips' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Today's Trips</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {todayTrips.map((trip, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{trip.route.name}</h3>
                        <p className="text-sm text-gray-500">{trip.route.startPoint} → {trip.route.endPoint}</p>
                      </div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTripStatusColor(trip.trip.status)}`}>
                        {trip.trip.status}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Bus className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{trip.vehicle.registrationNumber} ({trip.vehicle.make} {trip.vehicle.model})</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Driver: {trip.driver.name}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Departure: {new Date(trip.trip.plannedDepartureTime).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Route className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Capacity: {trip.vehicle.capacity} seats</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Boardings: {trip.trip.totalBoardings}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
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
