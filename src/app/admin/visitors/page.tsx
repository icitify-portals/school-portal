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
  Users, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  Camera,
  UserCheck,
  LogOut
} from "lucide-react";
import { 
  createVisitor, 
  checkInVisitor, 
  checkOutVisitor, 
  getVisitors, 
  getVisitorDestinations,
  getVisitorStats 
} from "@/actions/visitor-management";
import { toast } from "sonner";

export default function VisitorManagement() {
  const [activeTab, setActiveTab] = useState('register');
  const [visitors, setVisitors] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    purpose: '',
    destinationType: 'other',
    destinationId: '',
    destinationName: '',
    hostName: '',
    hostTitle: '',
    hostDepartment: '',
    hostPhone: '',
    hostEmail: '',
    expectedCheckIn: '',
    expectedCheckOut: '',
    idType: '',
    idNumber: '',
    vehicleInfo: '',
    notes: '',
  });

  useEffect(() => {
    loadDestinations();
    loadStats();
    if (activeTab === 'list') {
      loadVisitors();
    }
  }, [activeTab]);

  const loadDestinations = async () => {
    const result = await getVisitorDestinations();
    if (result.success) {
      setDestinations(result.destinations);
    }
  };

  const loadVisitors = async () => {
    setLoading(true);
    const result = await getVisitors({ limit: 50 });
    if (result.success) {
      setVisitors(result.visitors);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const result = await getVisitorStats();
    if (result.success) {
      setStats(result);
    }
  };

  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await createVisitor(formData as any);
    if (result.success) {
      toast.success(`✅ Visitor created successfully!`, {
        description: `QR Code generated for ${formData.firstName} ${formData.lastName}`,
      });
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        purpose: '',
        destinationType: 'other',
        destinationId: '',
        destinationName: '',
        hostName: '',
        hostTitle: '',
        hostDepartment: '',
        hostPhone: '',
        hostEmail: '',
        expectedCheckIn: '',
        expectedCheckOut: '',
        idType: '',
        idNumber: '',
        vehicleInfo: '',
        notes: '',
      });
      
      // Show QR code
      alert(`Visitor QR Code: ${result.qrData}\n\nExpires: ${result.expiresAt}`);
    } else {
      toast.error(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'checked_in': return 'bg-green-100 text-green-800';
      case 'checked_out': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'checked_in': return <UserCheck className="w-4 h-4" />;
      case 'checked_out': return <LogOut className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Visitor Management</h1>
            <p className="text-gray-600">Manage visitor access and tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={activeTab === 'register' ? 'default' : 'outline'}
              onClick={() => setActiveTab('register')}
            >
              <Users className="w-4 h-4 mr-2" />
              Register Visitor
            </Button>
            <Button
              variant={activeTab === 'list' ? 'default' : 'outline'}
              onClick={() => setActiveTab('list')}
            >
              <Users className="w-4 h-4 mr-2" />
              Visitor List
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Today</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todayStats.totalVisitors}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Checked In</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todayStats.checkedIn}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <LogOut className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Checked Out</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todayStats.checkedOut}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Scheduled</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todayStats.scheduled}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        {activeTab === 'register' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Register New Visitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateVisitor} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Visit Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Visit Information</h3>
                    
                    <div>
                      <Label htmlFor="purpose">Purpose of Visit *</Label>
                      <Textarea
                        id="purpose"
                        value={formData.purpose}
                        onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="destinationType">Destination Type *</Label>
                        <Select
                          value={formData.destinationType}
                          onValueChange={(value) => setFormData({...formData, destinationType: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="faculty">Faculty</SelectItem>
                            <SelectItem value="department">Department</SelectItem>
                            <SelectItem value="unit">Unit</SelectItem>
                            <SelectItem value="person">Person</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="destinationName">Destination Name *</Label>
                        <Input
                          id="destinationName"
                          value={formData.destinationName}
                          onChange={(e) => setFormData({...formData, destinationName: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expectedCheckIn">Expected Check In *</Label>
                        <Input
                          id="expectedCheckIn"
                          type="datetime-local"
                          value={formData.expectedCheckIn}
                          onChange={(e) => setFormData({...formData, expectedCheckIn: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="expectedCheckOut">Expected Check Out</Label>
                        <Input
                          id="expectedCheckOut"
                          type="datetime-local"
                          value={formData.expectedCheckOut}
                          onChange={(e) => setFormData({...formData, expectedCheckOut: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Host Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Host Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hostName">Host Name *</Label>
                      <Input
                        id="hostName"
                        value={formData.hostName}
                        onChange={(e) => setFormData({...formData, hostName: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="hostTitle">Host Title</Label>
                      <Input
                        id="hostTitle"
                        value={formData.hostTitle}
                        onChange={(e) => setFormData({...formData, hostTitle: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hostDepartment">Host Department</Label>
                      <Input
                        id="hostDepartment"
                        value={formData.hostDepartment}
                        onChange={(e) => setFormData({...formData, hostDepartment: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="hostPhone">Host Phone</Label>
                      <Input
                        id="hostPhone"
                        value={formData.hostPhone}
                        onChange={(e) => setFormData({...formData, hostPhone: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="hostEmail">Host Email</Label>
                    <Input
                      id="hostEmail"
                      type="email"
                      value={formData.hostEmail}
                      onChange={(e) => setFormData({...formData, hostEmail: e.target.value})}
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="idType">ID Type</Label>
                      <Input
                        id="idType"
                        value={formData.idType}
                        onChange={(e) => setFormData({...formData, idType: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="idNumber">ID Number</Label>
                      <Input
                        id="idNumber"
                        value={formData.idNumber}
                        onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="vehicleInfo">Vehicle Information</Label>
                    <Textarea
                      id="vehicleInfo"
                      value={formData.vehicleInfo}
                      onChange={(e) => setFormData({...formData, vehicleInfo: e.target.value})}
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Visitor & Generate QR'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Visitor List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visitor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Host
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Times
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
                    {visitors.map((visitor) => (
                      <tr key={visitor.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {visitor.firstName} {visitor.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {visitor.email && <><Mail className="w-3 h-3 inline mr-1" />{visitor.email}</>}
                              {visitor.phone && <><Phone className="w-3 h-3 inline mr-1" />{visitor.phone}</>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{visitor.purpose}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{visitor.destinationName}</div>
                              <Badge variant="secondary" className="text-xs">
                                {visitor.destinationType}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{visitor.hostName}</div>
                            {visitor.hostTitle && (
                              <div className="text-gray-500">{visitor.hostTitle}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>In: {visitor.expectedCheckIn ? new Date(visitor.expectedCheckIn).toLocaleString() : 'Not set'}</div>
                            <div>Out: {visitor.expectedCheckOut ? new Date(visitor.expectedCheckOut).toLocaleString() : 'Not set'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(visitor.status)}`}>
                            {getStatusIcon(visitor.status)}
                            <span className="ml-2">{visitor.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <QrCode className="w-4 h-4 mr-1" />
                              View QR
                            </Button>
                            {visitor.status === 'scheduled' && (
                              <Button size="sm" variant="outline">
                                <Camera className="w-4 h-4 mr-1" />
                                Check In
                              </Button>
                            )}
                            {visitor.status === 'checked_in' && (
                              <Button size="sm" variant="outline">
                                <LogOut className="w-4 h-4 mr-1" />
                                Check Out
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
