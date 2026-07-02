// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Settings, 
  Layers, 
  Send, 
  Trash2, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Search, 
  Download, 
  Clock, 
  AlertCircle,
  Truck,
  ExternalLink
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  getRegistryApplications, 
  updateRegistryApplicationStatus, 
  createDocumentForm
} from "@/actions/graduate-documents";
import { getAcademicSessions } from "@/actions/transcripts";
import { db } from "@/db/db";
import { toast } from "sonner";

export default function RegistryDocumentQueue() {
  const [activeTab, setActiveTab] = useState<"queue" | "forms">("queue");
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Dispatch / action modals states
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [processedFileUrl, setProcessedFileUrl] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [registryComments, setRegistryComments] = useState("");
  const [updating, setUpdating] = useState(false);

  // Form builder states
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<string>("polytechnic_ond");
  const [formSchemaText, setFormSchemaText] = useState(
    JSON.stringify(
      {
        targetInstitution: { label: "Destination Institution Name", type: "text", required: true },
        targetAddress: { label: "Destination Office Address", type: "text", required: true }
      },
      null,
      2
    )
  );
  const [formInstructions, setFormInstructions] = useState("");
  const [creatingForm, setCreatingForm] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [filterStatus, filterCategory]);

  const loadApplications = async () => {
    setLoading(true);
    const statusVal = filterStatus === "all" ? undefined : filterStatus;
    const catVal = filterCategory === "all" ? undefined : filterCategory;
    const data = await getRegistryApplications({ status: statusVal, category: catVal });
    setApplications(data);
    setLoading(false);
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp) return;
    setUpdating(true);
    try {
      const res = await updateRegistryApplicationStatus({
        applicationId: selectedApp.id,
        status: processingStatus as any,
        comments: registryComments || undefined,
        trackingNumber: trackingNumber || undefined,
        processedFileUrl: processedFileUrl || undefined,
        rejectionReason: rejectionReason || undefined
      });

      if (res.success) {
        toast.success("Request status updated successfully.");
        setSelectedApp(null);
        await loadApplications();
      } else {
        toast.error(res.error || "Failed to update status.");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to submit updates.");
    }
    setUpdating(false);
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error("Form name required");
      return;
    }
    setCreatingForm(true);
    try {
      // Validate schema is valid JSON
      JSON.parse(formSchemaText);

      const res = await createDocumentForm({
        name: formName,
        documentTypeId: 1, // Defaulting to 1 (Transcript)
        category: formCategory as any,
        formSchema: formSchemaText,
        instructions: formInstructions || undefined
      });

      if (res.success) {
        toast.success("Document application form created successfully!");
        setFormName("");
        setFormInstructions("");
        setActiveTab("queue");
      } else {
        toast.error(res.error || "Failed to create form template.");
      }
    } catch (err: any) {
      toast.error("Invalid JSON Schema format: " + err.message);
    }
    setCreatingForm(false);
  };

  // Helper to parse dynamic form values
  const renderDynamicInputs = (dataString: string) => {
    try {
      const data = JSON.parse(dataString);
      return Object.keys(data).map(key => (
        <div key={key} className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
          <span className="text-slate-400 font-medium mr-1 uppercase text-[9px] block tracking-wide">{key}</span>
          {data[key]}
        </div>
      ));
    } catch (e) {
      return <p className="text-xs text-red-500">Failed to render form details.</p>;
    }
  };

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-10 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FileText className="w-10 h-10 text-indigo-650 text-indigo-600" />
            Registry Dispatch Queue
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Exams & Records office workspace to build dynamic templates and process graduate document requests.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeTab === "queue" ? "default" : "outline"}
            onClick={() => setActiveTab("queue")}
            className="rounded-xl font-bold h-11"
          >
            <Clock className="w-4 h-4 mr-2" /> Application Queue
          </Button>
          <Button
            variant={activeTab === "forms" ? "default" : "outline"}
            onClick={() => setActiveTab("forms")}
            className="rounded-xl font-bold h-11"
          >
            <Settings className="w-4 h-4 mr-2" /> Configure Forms
          </Button>
        </div>
      </div>

      {activeTab === "queue" ? (
        <div className="space-y-8">
          
          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Filter Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-slate-50 border-none font-bold rounded-xl h-11 text-slate-800">
                  <SelectValue placeholder="All Queue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Queue</SelectItem>
                  <SelectItem value="pending">Pending Queue</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Filter Level / Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="bg-slate-50 border-none font-bold rounded-xl h-11 text-slate-800">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="polytechnic_ond">Polytechnic OND</SelectItem>
                  <SelectItem value="polytechnic_hnd">Polytechnic HND</SelectItem>
                  <SelectItem value="university_undergrad">University Undergrad</SelectItem>
                  <SelectItem value="university_postgrad">University Postgrad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadApplications} className="w-full h-11 bg-slate-900 font-bold rounded-xl">
                <Search className="w-4 h-4 mr-2" /> Search Records
              </Button>
            </div>
          </div>

          {/* Application Queue List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Queue Table (Span 2) */}
            <div className="lg:col-span-2">
              <Card className="-200/50 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <th className="px-8 py-4">Graduate Identity</th>
                          <th className="px-8 py-4">Document / Category</th>
                          <th className="px-8 py-4">Payment / Fee</th>
                          <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {loading ? (
                          <tr>
                            <td colSpan={4} className="px-8 py-10 text-center">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 opacity-30" />
                            </td>
                          </tr>
                        ) : applications.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-8 py-10 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                              No matching document requests found.
                            </td>
                          </tr>
                        ) : (
                          applications.map(app => (
                            <tr key={app.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="px-8 py-4">
                                <div className="font-bold text-slate-800 uppercase tracking-tight">{app.user?.name}</div>
                                <code className="text-[10px] text-indigo-650 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-black">
                                  {app.graduateProfile?.category === "polytechnic_ond" ? "OND Level" : app.graduateProfile?.category === "polytechnic_hnd" ? "HND Level" : "Degree Level"}
                                </code>
                              </td>
                              <td className="px-8 py-4">
                                <p className="text-xs font-black text-slate-700">{app.form?.name}</p>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Route: {app.deliveryMethod.replace("_", " ")}</span>
                              </td>
                              <td className="px-8 py-4">
                                <p className="text-xs font-black text-slate-800">₦{parseFloat(app.amountPaid || "0.00").toLocaleString()}</p>
                                <Badge className={`rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  app.registryStatus === "pending" ? "bg-amber-100 text-amber-700" :
                                  app.registryStatus === "processing" ? "bg-blue-100 text-blue-700" :
                                  app.registryStatus === "completed" || app.registryStatus === "dispatched" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                }`}>
                                  {app.registryStatus}
                                </Badge>
                              </td>
                              <td className="px-8 py-4 text-right">
                                <Button
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setProcessingStatus(app.registryStatus);
                                    setTrackingNumber(app.trackingNumber || "");
                                    setProcessedFileUrl(app.processedFileUrl || "");
                                    setRegistryComments(app.registryComments || "");
                                  }}
                                  className="h-9 px-4 bg-slate-900 hover:bg-indigo-600 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all"
                                >
                                  Process Request
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Application Detail Action Box (Span 1) */}
            <div>
              {selectedApp ? (
                <Card className="-200/50 p-8 space-y-6 -100 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase italic">Request Details</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Application ID: {selectedApp.id}</p>
                  </div>
                  <Separator className="bg-slate-100" />

                  {/* Dynamic Form Metadata */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Form Field Submissions</p>
                    <div className="grid gap-2">
                      {renderDynamicInputs(selectedApp.formData)}
                    </div>
                  </div>
                  <Separator className="bg-slate-100" />

                  {/* Actions Console */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Set Registry Status</label>
                      <Select value={processingStatus} onValueChange={setProcessingStatus}>
                        <SelectTrigger className="bg-slate-50 border-none font-bold rounded-xl h-11 text-slate-800">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reviewing">Reviewing</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="dispatched">Dispatched / Completed</SelectItem>
                          <SelectItem value="rejected">Rejected / Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {processingStatus === "dispatched" && selectedApp.deliveryMethod === "email" && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Secure Document PDF Link</label>
                        <Input
                          placeholder="https://s3.aws.com/secure-transcripts/..."
                          value={processedFileUrl}
                          onChange={e => setProcessedFileUrl(e.target.value)}
                          className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs"
                        />
                      </div>
                    )}

                    {processingStatus === "dispatched" && selectedApp.deliveryMethod !== "email" && selectedApp.deliveryMethod !== "pickup" && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Courier Tracking Number</label>
                        <Input
                          placeholder="e.g. DHL-98217391"
                          value={trackingNumber}
                          onChange={e => setTrackingNumber(e.target.value)}
                          className="h-11 rounded-xl bg-slate-50 border-none font-bold"
                        />
                      </div>
                    )}

                    {processingStatus === "rejected" && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rejection Reason</label>
                        <Input
                          placeholder="Failed clearance check or unpassed courses"
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          className="h-11 rounded-xl bg-slate-50 border-none font-bold"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Internal Officer Comments</label>
                      <textarea
                        placeholder="Registry internal notes..."
                        value={registryComments}
                        onChange={e => setRegistryComments(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-xs min-h-[60px] focus:outline-none"
                      />
                    </div>

                    <Button
                      onClick={handleUpdateStatus}
                      disabled={updating}
                      className="w-full h-12 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl"
                    >
                      {updating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                      Submit Queue Update
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="-200/50 p-8 text-center -100 border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div className="p-4 bg-slate-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">No Request Selected</h4>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Select a student request from the queue to process their document dispatch.</p>
                </Card>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* Form Configurator Console */
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="-200/50 overflow-hidden border-none shadow-xl rounded-[2rem] bg-white group overflow-hidden hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-slate-900 text-white p-8">
              <CardTitle className="text-xl font-black italic">Create Document Form Template</CardTitle>
              <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                Registry custom forms builders - set fields for each degree category.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleCreateForm} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Form Template Name</label>
                    <Input
                      required
                      placeholder="e.g. Polytechnic OND Transcript Request Form"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Graduate Level Category</label>
                    <Select value={formCategory} onValueChange={setFormCategory}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="polytechnic_ond" className="font-bold">Polytechnic OND</SelectItem>
                        <SelectItem value="polytechnic_hnd" className="font-bold">Polytechnic HND</SelectItem>
                        <SelectItem value="university_undergrad" className="font-bold">University Undergrad</SelectItem>
                        <SelectItem value="university_postgrad" className="font-bold">University Postgrad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dynamic Fields JSON Schema</label>
                  <textarea
                    required
                    value={formSchemaText}
                    onChange={e => setFormSchemaText(e.target.value)}
                    className="w-full p-4 rounded-xl bg-slate-50 border-none font-mono text-xs min-h-[160px] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Define fields using JSON structure: {"{ \"fieldName\": { \"label\": \"Display Name\", \"type\": \"text\", \"required\": true } }"}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filing Instructions</label>
                  <textarea
                    placeholder="Turnaround policies, pickup rules..."
                    value={formInstructions}
                    onChange={e => setFormInstructions(e.target.value)}
                    className="w-full p-4 rounded-xl bg-slate-50 border-none font-bold text-xs min-h-[80px] focus:outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={creatingForm}
                  className="bg-indigo-600 hover:bg-indigo-700 px-8 h-12 rounded-xl font-bold shadow-lg shadow-indigo-500/20"
                >
                  {creatingForm ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                  Deploy Form Template
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
