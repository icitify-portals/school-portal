"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Copy,
  Download,
  Upload,
  BookOpen,
  GraduationCap,
  Beaker,
  Calculator,
  Globe
} from "lucide-react";
import {
  getProgrammeRequirements,
  addUtmeRequirement,
  updateUtmeRequirement,
  deleteUtmeRequirement,
  addOLevelRequirement,
  updateOLevelRequirement,
  deleteOLevelRequirement,
  getAllProgrammesWithRequirements,
  applyUtmeTemplate,
  applyOLevelTemplate
} from "@/actions/programme-requirements";
import {
  UTME_SUBJECT_TEMPLATES,
  OLEVEL_SUBJECT_TEMPLATES
} from "@/lib/constants/admission-templates";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProgrammeRequirementsPage() {
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState<any>(null);
  const [requirements, setRequirements] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingUtme, setEditingUtme] = useState<number | null>(null);
  const [editingOLevel, setEditingOLevel] = useState<number | null>(null);
  const [showUtmeForm, setShowUtmeForm] = useState(false);
  const [showOLevelForm, setShowOLevelForm] = useState(false);

  // Form states
  const [utmeForm, setUtmeForm] = useState({
    subjectName: "",
    isCompulsory: true,
    isAlternative: false,
    alternativeSubjects: ""
  });

  const [oLevelForm, setOLevelForm] = useState({
    subjectName: "",
    isCompulsory: true,
    minGrade: "C6",
    acceptTwoSittings: false,
    sixthSubjectRequired: false
  });

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const fetchProgrammes = async () => {
    try {
      const result = await getAllProgrammesWithRequirements();
      if (result.success && result.programmes) {
        setProgrammes(result.programmes);
        if (result.programmes.length > 0) {
          await selectProgramme(result.programmes[0].id);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch programmes");
    }
    setLoading(false);
  };

  const selectProgramme = async (programmeId: number) => {
    const programme = programmes.find(p => p.id === programmeId);
    setSelectedProgramme(programme);

    const res = await getProgrammeRequirements(programmeId);
    if (res.success) {
      setRequirements(res);
    }
  };

  const handleAddUtmeRequirement = async () => {
    try {
      const alternativeSubjects = utmeForm.alternativeSubjects
        ? utmeForm.alternativeSubjects.split(',').map(s => s.trim()).filter(s => s)
        : [];

      const res = await addUtmeRequirement(
        selectedProgramme.id,
        utmeForm.subjectName,
        utmeForm.isCompulsory,
        utmeForm.isAlternative,
        alternativeSubjects
      );

      if (res.success) {
        toast.success("UTME requirement added");
        setUtmeForm({ subjectName: "", isCompulsory: true, isAlternative: false, alternativeSubjects: "" });
        setShowUtmeForm(false);
        await selectProgramme(selectedProgramme.id);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to add requirement");
    }
  };

  const handleUpdateUtmeRequirement = async (id: number) => {
    try {
      const alternativeSubjects = utmeForm.alternativeSubjects
        ? utmeForm.alternativeSubjects.split(',').map(s => s.trim()).filter(s => s)
        : [];

      const res = await updateUtmeRequirement(
        id,
        utmeForm.subjectName,
        utmeForm.isCompulsory,
        utmeForm.isAlternative,
        alternativeSubjects
      );

      if (res.success) {
        toast.success("UTME requirement updated");
        setEditingUtme(null);
        setUtmeForm({ subjectName: "", isCompulsory: true, isAlternative: false, alternativeSubjects: "" });
        await selectProgramme(selectedProgramme.id);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to update requirement");
    }
  };

  const handleDeleteUtmeRequirement = async (id: number) => {
    try {
      const res = await deleteUtmeRequirement(id);
      if (res.success) {
        toast.success("UTME requirement deleted");
        await selectProgramme(selectedProgramme.id);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to delete requirement");
    }
  };

  const handleDeleteOLevelRequirement = async (id: number) => {
    try {
      const res = await deleteOLevelRequirement(id);
      if (res.success) {
        toast.success("O-Level requirement deleted");
        await selectProgramme(selectedProgramme.id);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to delete requirement");
    }
  };

  const handleUpdateOLevelRequirement = async (id: number) => {
    try {
      const res = await updateOLevelRequirement(
        id,
        oLevelForm.subjectName,
        oLevelForm.isCompulsory,
        oLevelForm.minGrade,
        oLevelForm.acceptTwoSittings,
        oLevelForm.sixthSubjectRequired
      );
      if (res.success) {
        toast.success("O-Level requirement updated");
        setEditingOLevel(null);
        await selectProgramme(selectedProgramme.id);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to update requirement");
    }
  };

  const handleAddOLevelRequirement = async () => {
    try {
      const res = await addOLevelRequirement(
        selectedProgramme.id,
        oLevelForm.subjectName,
        oLevelForm.isCompulsory,
        oLevelForm.minGrade,
        oLevelForm.acceptTwoSittings,
        oLevelForm.sixthSubjectRequired
      );

      if (res.success) {
        toast.success("O-Level requirement added");
        setOLevelForm({ subjectName: "", isCompulsory: true, minGrade: "C6", acceptTwoSittings: false, sixthSubjectRequired: false });
        setShowOLevelForm(false);
        await selectProgramme(selectedProgramme.id);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to add requirement");
    }
  };

  const handleApplyTemplate = async (type: 'utme' | 'olevel', template: any) => {
    try {
      if (type === 'utme') {
        const res = await applyUtmeTemplate(selectedProgramme.id, template);
        if (res.success) {
          toast.success("UTME template applied");
          await selectProgramme(selectedProgramme.id);
        }
      } else {
        const res = await applyOLevelTemplate(selectedProgramme.id, template);
        if (res.success) {
          toast.success("O-Level template applied");
          await selectProgramme(selectedProgramme.id);
        }
      }
    } catch (error) {
      toast.error("Failed to apply template");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent">
      <div className="max-w-[1600px] w-full mx-auto space-y-10 text-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 text-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-650/30 to-purple-650/30 opacity-50 mix-blend-overlay" />
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-4 mb-2">
              <Settings className="w-12 h-12 text-indigo-400 drop-shadow-md" />
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic drop-shadow-md">
                Programme Requirements
              </h2>
            </div>
            <p className="text-slate-300 font-medium mt-1 uppercase text-sm tracking-wide opacity-90">
              Configure UTME and O-Level requirements for each academic programme
            </p>
          </div>
        </div>

        {/* Programme Selector */}
        <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-8">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Select Academic Programme</h3>
          <div className="flex flex-wrap gap-3">
            {programmes.map((programme) => (
              <Button
                key={programme.id}
                onClick={() => selectProgramme(programme.id)}
                className={cn(
                  "px-6 py-5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95",
                  selectedProgramme?.id === programme.id
                    ? "bg-indigo-650 text-white shadow-lg"
                    : "bg-white/60 hover:bg-white text-slate-700 border border-slate-200/80 shadow-sm"
                )}
              >
                {programme.name}
              </Button>
            ))}
          </div>
        </Card>

        {selectedProgramme && requirements && (
          <>
            {/* Quick Templates */}
            <Card className="border border-white/40 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Quick Setup Templates</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white/40 border border-white/60 rounded-[2rem] shadow-sm">
                  <h4 className="text-sm font-black text-indigo-950 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <GraduationCap className="w-5 h-5 text-indigo-500" /> UTME Templates
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(UTME_SUBJECT_TEMPLATES).map((template) => (
                      <Button
                        key={template}
                        size="sm"
                        variant="outline"
                        onClick={() => handleApplyTemplate('utme', template as any)}
                        className="text-[10px] font-black uppercase tracking-wider bg-white/80 hover:bg-white border-slate-200/80 rounded-xl px-4 py-2"
                      >
                        {template.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="p-6 bg-white/40 border border-white/60 rounded-[2rem] shadow-sm">
                  <h4 className="text-sm font-black text-emerald-950 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <BookOpen className="w-5 h-5 text-emerald-500" /> O-Level Templates
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(OLEVEL_SUBJECT_TEMPLATES).map((template) => (
                      <Button
                        key={template}
                        size="sm"
                        variant="outline"
                        onClick={() => handleApplyTemplate('olevel', template as any)}
                        className="text-[10px] font-black uppercase tracking-wider bg-white/80 hover:bg-white border-slate-200/80 rounded-xl px-4 py-2"
                      >
                        {template.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* UTME Requirements */}
              <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-650 to-purple-650 text-white p-8">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-3 text-lg font-black uppercase tracking-wide">
                      <GraduationCap className="w-6 h-6" />
                      UTME Subject Requirements
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setShowUtmeForm(true)}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/20 font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {showUtmeForm && (
                    <div className="p-6 bg-white/80 border border-white/60 rounded-3xl space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">Add UTME Requirement</h4>
                        <Button size="sm" variant="ghost" onClick={() => setShowUtmeForm(false)} className="rounded-full w-8 h-8 p-0">
                          <X className="w-4 h-4 text-slate-500" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Subject Name</Label>
                          <Input
                            value={utmeForm.subjectName}
                            onChange={(e) => setUtmeForm({ ...utmeForm, subjectName: e.target.value })}
                            placeholder="e.g. Mathematics"
                            className="bg-white border-slate-200 rounded-xl font-bold"
                          />
                        </div>
                        <div className="flex gap-6">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm">
                            <input
                              type="checkbox"
                              checked={utmeForm.isCompulsory}
                              onChange={(e) => setUtmeForm({ ...utmeForm, isCompulsory: e.target.checked })}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                            />
                            <span>Compulsory</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm">
                            <input
                              type="checkbox"
                              checked={utmeForm.isAlternative}
                              onChange={(e) => setUtmeForm({ ...utmeForm, isAlternative: e.target.checked })}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                            />
                            <span>Has Alternatives</span>
                          </label>
                        </div>
                        {utmeForm.isAlternative && (
                          <div>
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Alternative Subjects (comma-separated)</Label>
                            <Input
                              value={utmeForm.alternativeSubjects}
                              onChange={(e) => setUtmeForm({ ...utmeForm, alternativeSubjects: e.target.value })}
                              placeholder="e.g. Biology, Agricultural Science"
                              className="bg-white border-slate-200 rounded-xl font-bold"
                            />
                          </div>
                        )}
                        <Button onClick={handleAddUtmeRequirement} className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest py-3 rounded-xl shadow-md">
                          <Save className="w-4 h-4 mr-2" /> Save Requirement
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {requirements.utmeRequirements.map((req: any) => (
                      <div key={req.id} className="p-5 bg-white/60 border border-white/80 rounded-2xl shadow-sm hover:bg-white/80 transition-colors">
                        {editingUtme === req.id ? (
                          <div className="space-y-3">
                            <Input
                              value={utmeForm.subjectName}
                              onChange={(e) => setUtmeForm({ ...utmeForm, subjectName: e.target.value })}
                              className="bg-white border-slate-200 rounded-xl font-bold"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleUpdateUtmeRequirement(req.id)} className="bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl">
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingUtme(null)} className="rounded-xl border border-slate-200">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 shadow-inner"></div>
                              <div>
                                <p className="font-black text-slate-800 text-sm uppercase tracking-wide">{req.subjectName}</p>
                                <div className="flex gap-2 mt-1.5">
                                  {req.isCompulsory && <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[9px] font-black uppercase tracking-wider">Compulsory</Badge>}
                                  {req.isAlternative && <Badge className="bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[9px] font-black uppercase tracking-wider">Has Alternatives</Badge>}
                                </div>
                                {req.alternativeSubjects && req.alternativeSubjects.length > 0 && (
                                  <p className="text-xs text-slate-500 font-bold mt-2">
                                    Alternatives: <span className="text-indigo-650">{req.alternativeSubjects.join(', ')}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="hover:bg-white/60 rounded-xl w-8 h-8 p-0" onClick={() => {
                                setEditingUtme(req.id);
                                setUtmeForm({
                                  subjectName: req.subjectName,
                                  isCompulsory: req.isCompulsory,
                                  isAlternative: req.isAlternative,
                                  alternativeSubjects: req.alternativeSubjects?.join(', ') || ''
                                });
                              }}>
                                <Edit2 className="w-4 h-4 text-slate-650" />
                              </Button>
                              <Button size="sm" variant="ghost" className="hover:bg-rose-50 rounded-xl w-8 h-8 p-0" onClick={() => handleDeleteUtmeRequirement(req.id)}>
                                <Trash2 className="w-4 h-4 text-rose-500" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* O-Level Requirements */}
              <Card className="border border-white/40 shadow-2xl shadow-slate-200/50 bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-3 text-lg font-black uppercase tracking-wide">
                      <BookOpen className="w-6 h-6" />
                      O-Level Requirements
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setShowOLevelForm(true)}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/20 font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {showOLevelForm && (
                    <div className="p-6 bg-white/80 border border-white/60 rounded-3xl space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">Add O-Level Requirement</h4>
                        <Button size="sm" variant="ghost" onClick={() => setShowOLevelForm(false)} className="rounded-full w-8 h-8 p-0">
                          <X className="w-4 h-4 text-slate-500" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Subject Name</Label>
                          <Input
                            value={oLevelForm.subjectName}
                            onChange={(e) => setOLevelForm({ ...oLevelForm, subjectName: e.target.value })}
                            placeholder="e.g. Mathematics"
                            className="bg-white border-slate-200 rounded-xl font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Minimum Grade</Label>
                            <select
                              value={oLevelForm.minGrade}
                              onChange={(e) => setOLevelForm({ ...oLevelForm, minGrade: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-850 outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                              <option value="A1">A1</option>
                              <option value="B2">B2</option>
                              <option value="B3">B3</option>
                              <option value="C4">C4</option>
                              <option value="C5">C5</option>
                              <option value="C6">C6</option>
                              <option value="D7">D7</option>
                              <option value="E8">E8</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm">
                              <input
                                type="checkbox"
                                checked={oLevelForm.isCompulsory}
                                onChange={(e) => setOLevelForm({ ...oLevelForm, isCompulsory: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                              />
                              <span>Compulsory</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm">
                              <input
                                type="checkbox"
                                checked={oLevelForm.acceptTwoSittings}
                                onChange={(e) => setOLevelForm({ ...oLevelForm, acceptTwoSittings: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                              />
                              <span>Accept 2 Sittings</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm">
                              <input
                                type="checkbox"
                                checked={oLevelForm.sixthSubjectRequired}
                                onChange={(e) => setOLevelForm({ ...oLevelForm, sixthSubjectRequired: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                              />
                              <span>6th Subject Required</span>
                            </label>
                          </div>
                        </div>
                        <Button onClick={handleAddOLevelRequirement} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest py-3 rounded-xl shadow-md">
                          <Save className="w-4 h-4 mr-2" /> Save Requirement
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {requirements.oLevelRequirements.map((req: any) => (
                      <div key={req.id} className="p-5 bg-white/60 border border-white/80 rounded-2xl shadow-sm hover:bg-white/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-inner"></div>
                            <div>
                              <p className="font-black text-slate-800 text-sm uppercase tracking-wide">{req.subjectName}</p>
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                {req.isCompulsory && <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[9px] font-black uppercase tracking-wider">Compulsory</Badge>}
                                <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-250 rounded-lg text-[9px] font-black uppercase tracking-wider">Min: {req.minGrade}</Badge>
                                {req.acceptTwoSittings && <Badge className="bg-amber-100 text-amber-705 border border-amber-200 rounded-lg text-[9px] font-black uppercase tracking-wider">2 Sittings</Badge>}
                                {req.sixthSubjectRequired && <Badge className="bg-slate-100 text-slate-650 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider">6th Subject</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="hover:bg-rose-50 rounded-xl w-8 h-8 p-0" onClick={() => handleDeleteOLevelRequirement(req.id)}>
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
