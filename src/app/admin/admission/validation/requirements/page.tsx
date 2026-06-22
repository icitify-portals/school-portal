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
  applyOLevelTemplate,
  UTME_SUBJECT_TEMPLATES,
  OLEVEL_SUBJECT_TEMPLATES
} from "@/actions/programme-requirements";
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
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic">
            <Settings className="w-10 h-10 text-indigo-600" />
            PROGRAMME REQUIREMENTS
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
            Configure UTME and O-Level requirements for each programme
          </p>
        </div>
      </div>

      {/* Programme Selector */}
      <Card className="border-none shadow-xl rounded-[2.5rem] p-6">
        <div className="flex flex-wrap gap-3">
          {programmes.map((programme) => (
            <Button
              key={programme.id}
              onClick={() => selectProgramme(programme.id)}
              className={cn(
                "px-6 py-3 rounded-2xl font-bold transition-all",
                selectedProgramme?.id === programme.id
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
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
          <Card className="border-none shadow-xl rounded-[2.5rem] p-6">
            <h3 className="text-lg font-black text-slate-900 mb-4">Quick Setup Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> UTME Templates
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(UTME_SUBJECT_TEMPLATES).map((template) => (
                    <Button
                      key={template}
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyTemplate('utme', template as any)}
                      className="text-xs"
                    >
                      {template.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> O-Level Templates
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(OLEVEL_SUBJECT_TEMPLATES).map((template) => (
                    <Button
                      key={template}
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyTemplate('olevel', template as any)}
                      className="text-xs"
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
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    UTME Subject Requirements
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setShowUtmeForm(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {showUtmeForm && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900">Add UTME Requirement</h4>
                      <Button size="sm" variant="ghost" onClick={() => setShowUtmeForm(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-bold text-slate-600">Subject Name</Label>
                        <Input
                          value={utmeForm.subjectName}
                          onChange={(e) => setUtmeForm({ ...utmeForm, subjectName: e.target.value })}
                          placeholder="e.g. Mathematics"
                        />
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={utmeForm.isCompulsory}
                            onChange={(e) => setUtmeForm({ ...utmeForm, isCompulsory: e.target.checked })}
                          />
                          <span className="text-sm">Compulsory</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={utmeForm.isAlternative}
                            onChange={(e) => setUtmeForm({ ...utmeForm, isAlternative: e.target.checked })}
                          />
                          <span className="text-sm">Has Alternatives</span>
                        </label>
                      </div>
                      {utmeForm.isAlternative && (
                        <div>
                          <Label className="text-xs font-bold text-slate-600">Alternative Subjects (comma-separated)</Label>
                          <Input
                            value={utmeForm.alternativeSubjects}
                            onChange={(e) => setUtmeForm({ ...utmeForm, alternativeSubjects: e.target.value })}
                            placeholder="e.g. Biology, Agricultural Science"
                          />
                        </div>
                      )}
                      <Button onClick={handleAddUtmeRequirement} className="w-full">
                        <Save className="w-4 h-4 mr-2" /> Save Requirement
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {requirements.utmeRequirements.map((req: any) => (
                    <div key={req.id} className="p-4 bg-white border border-slate-200 rounded-2xl">
                      {editingUtme === req.id ? (
                        <div className="space-y-3">
                          <Input
                            value={utmeForm.subjectName}
                            onChange={(e) => setUtmeForm({ ...utmeForm, subjectName: e.target.value })}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdateUtmeRequirement(req.id)}>
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingUtme(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <div>
                              <p className="font-bold text-slate-900">{req.subjectName}</p>
                              <div className="flex gap-2 mt-1">
                                {req.isCompulsory && <Badge variant="secondary">Compulsory</Badge>}
                                {req.isAlternative && <Badge variant="outline">Has Alternatives</Badge>}
                              </div>
                              {req.alternativeSubjects && req.alternativeSubjects.length > 0 && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Alternatives: {req.alternativeSubjects.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => {
                              setEditingUtme(req.id);
                              setUtmeForm({
                                subjectName: req.subjectName,
                                isCompulsory: req.isCompulsory,
                                isAlternative: req.isAlternative,
                                alternativeSubjects: req.alternativeSubjects?.join(', ') || ''
                              });
                            }}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteUtmeRequirement(req.id)}>
                              <Trash2 className="w-4 h-4" />
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
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    O-Level Requirements
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setShowOLevelForm(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {showOLevelForm && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900">Add O-Level Requirement</h4>
                      <Button size="sm" variant="ghost" onClick={() => setShowOLevelForm(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-bold text-slate-600">Subject Name</Label>
                        <Input
                          value={oLevelForm.subjectName}
                          onChange={(e) => setOLevelForm({ ...oLevelForm, subjectName: e.target.value })}
                          placeholder="e.g. Mathematics"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-bold text-slate-600">Minimum Grade</Label>
                          <select
                            value={oLevelForm.minGrade}
                            onChange={(e) => setOLevelForm({ ...oLevelForm, minGrade: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
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
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={oLevelForm.isCompulsory}
                              onChange={(e) => setOLevelForm({ ...oLevelForm, isCompulsory: e.target.checked })}
                            />
                            <span className="text-sm">Compulsory</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={oLevelForm.acceptTwoSittings}
                              onChange={(e) => setOLevelForm({ ...oLevelForm, acceptTwoSittings: e.target.checked })}
                            />
                            <span className="text-sm">Accept 2 Sittings</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={oLevelForm.sixthSubjectRequired}
                              onChange={(e) => setOLevelForm({ ...oLevelForm, sixthSubjectRequired: e.target.checked })}
                            />
                            <span className="text-sm">6th Subject Required</span>
                          </label>
                        </div>
                      </div>
                      <Button onClick={handleAddOLevelRequirement} className="w-full">
                        <Save className="w-4 h-4 mr-2" /> Save Requirement
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {requirements.oLevelRequirements.map((req: any) => (
                    <div key={req.id} className="p-4 bg-white border border-slate-200 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <div>
                            <p className="font-bold text-slate-900">{req.subjectName}</p>
                            <div className="flex gap-2 mt-1">
                              {req.isCompulsory && <Badge variant="secondary">Compulsory</Badge>}
                              <Badge variant="outline">Min: {req.minGrade}</Badge>
                              {req.acceptTwoSittings && <Badge variant="outline">2 Sittings</Badge>}
                              {req.sixthSubjectRequired && <Badge variant="outline">6th Subject</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteOLevelRequirement(req.id)}>
                            <Trash2 className="w-4 h-4" />
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
  );
}
