"use client";

import { useState, useEffect } from "react";
import { 
  Coins, 
  Plus, 
  Loader2, 
  Trash2, 
  CreditCard, 
  MapPin, 
  Mail, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Building,
  UserCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  getAllDocumentPricingRules, 
  getAllActiveForms, 
  configureDocumentPricingRule 
} from "@/actions/graduate-documents";
import { getSettlementAccounts } from "@/actions/bursary";
import { toast } from "sonner";

export default function BursaryDocumentPricing() {
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [activeForms, setActiveForms] = useState<any[]>([]);
  const [settlementList, setSettlementList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [formId, setFormId] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] = useState<string>("email");
  const [feeAmount, setFeeAmount] = useState<string>("");
  const [settlementAccountId, setSettlementAccountId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const rules = await getAllDocumentPricingRules();
    const forms = await getAllActiveForms();
    const accounts = await getSettlementAccounts();
    setPricingRules(rules);
    setActiveForms(forms);
    setSettlementList(accounts);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId || !deliveryMethod || !feeAmount || !settlementAccountId) {
      toast.error("Please fill all configuration options.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await configureDocumentPricingRule({
        formId: parseInt(formId),
        deliveryMethod: deliveryMethod as any,
        feeAmount: parseFloat(feeAmount),
        settlementAccountId: parseInt(settlementAccountId)
      });

      if (res.success) {
        toast.success("Document pricing rule configured successfully.");
        setFeeAmount("");
        await loadData();
      } else {
        toast.error(res.error || "Failed to save pricing rule.");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to process form request.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-650 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-10 min-h-screen">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Coins className="w-10 h-10 text-emerald-600" />
          Document Fee configurator
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Bursary Office workspace to set graduate certificate and transcript fees, courier surcharges, and ledger settlements accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Side: Pricing Rules Grid (Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white p-8">
              <CardTitle className="text-xl font-black italic">Active Document Pricing Rules</CardTitle>
              <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                Fee structure mapped by dynamic forms templates and delivery channels.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-8 py-4">Document / Form</th>
                      <th className="px-8 py-4">Delivery route</th>
                      <th className="px-8 py-4">General Ledger Account</th>
                      <th className="px-8 py-4 text-right">Fee Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pricingRules.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-10 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                          No pricing rules configured yet.
                        </td>
                      </tr>
                    ) : (
                      pricingRules.map(rule => (
                        <tr key={rule.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-8 py-4">
                            <div className="font-bold text-slate-800">{rule.form?.name}</div>
                            <span className="text-[9px] text-indigo-600 bg-indigo-50 font-black uppercase tracking-wider px-2 py-0.5 rounded leading-none">
                              {rule.form?.category.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-8 py-4">
                            <Badge variant="outline" className="rounded-full text-[10px] font-black uppercase tracking-widest border-slate-200 bg-slate-50 text-slate-600">
                              {rule.deliveryMethod.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-8 py-4">
                            <div className="text-xs font-bold text-slate-700">{rule.settlementAccount?.accountName}</div>
                            <div className="text-[10px] text-slate-400 font-bold tracking-wide">
                              {rule.settlementAccount?.bankName} • {rule.settlementAccount?.accountNumber}
                            </div>
                          </td>
                          <td className="px-8 py-4 text-right font-black text-slate-900 text-sm">
                            {settings?.base_currency || '₦'}{parseFloat(rule.feeAmount).toLocaleString()}
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

        {/* Right Side: Configure Form Box (Span 1) */}
        <div>
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-8 space-y-6 bg-white border border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase italic">Set Document Price</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Configure Surcharges & Bank Splits</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Form Template</label>
                <Select value={formId} onValueChange={setFormId}>
                  <SelectTrigger className="bg-slate-50 border-none font-bold rounded-xl h-11 text-slate-800">
                    <SelectValue placeholder="Form Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeForms.map(f => (
                      <SelectItem key={f.id} value={f.id.toString()} className="font-bold">
                        {f.name} ({f.category.replace("polytechnic_", "ND/").replace("university_", "UNI ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Delivery Channel</label>
                <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                  <SelectTrigger className="bg-slate-50 border-none font-bold rounded-xl h-11 text-slate-800">
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email" className="font-bold">Secure Email / E-Copy</SelectItem>
                    <SelectItem value="courier_local" className="font-bold">Courier Local (Nigeria)</SelectItem>
                    <SelectItem value="courier_international" className="font-bold">Courier International</SelectItem>
                    <SelectItem value="pickup" className="font-bold">In-Person Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Configure Price (₦)</label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 5000"
                  value={feeAmount}
                  onChange={e => setFeeAmount(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 border-none font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Settlement General Ledger</label>
                <Select value={settlementAccountId} onValueChange={setSettlementAccountId}>
                  <SelectTrigger className="bg-slate-50 border-none font-bold rounded-xl h-11 text-slate-800">
                    <SelectValue placeholder="General Ledger Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {settlementList.map(acct => (
                      <SelectItem key={acct.id} value={acct.id.toString()} className="font-bold">
                        {acct.accountName} ({acct.accountNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                Apply Pricing Rule
              </Button>

            </form>
          </Card>
        </div>

      </div>

    </div>
  );
}
