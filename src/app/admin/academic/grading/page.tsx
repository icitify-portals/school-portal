"use client";

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Save, 
  ChevronRight, 
  Settings2, 
  ListChecks, 
  GraduationCap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Hash,
  Scale
} from 'lucide-react';
import { createGradingSystem } from '@/actions/result-management';

export default function GradingSystemConfigurator() {
  const [name, setName] = useState('');
  const [scale, setScale] = useState(5);
  const [description, setDescription] = useState('');
  const [grades, setGrades] = useState<any[]>([
    { letterGrade: 'A', minMark: 70, maxMark: 100, points: 5, description: 'Excellent' },
    { letterGrade: 'B', minMark: 60, maxMark: 69, points: 4, description: 'Very Good' },
    { letterGrade: 'C', minMark: 50, maxMark: 59, points: 3, description: 'Good' },
    { letterGrade: 'D', minMark: 45, maxMark: 49, points: 2, description: 'Pass' },
    { letterGrade: 'F', minMark: 0, maxMark: 44, points: 0, description: 'Fail' }
  ]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const addGrade = () => {
    setGrades([...grades, { letterGrade: '', minMark: 0, maxMark: 0, points: 0, description: '' }]);
  };

  const removeGrade = (index: number) => {
    setGrades(grades.filter((_, i) => i !== index));
  };

  const updateGrade = (index: number, field: string, value: any) => {
    const newGrades = [...grades];
    newGrades[index] = { ...newGrades[index], [field]: value };
    setGrades(newGrades);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    const res = await createGradingSystem({ name, scale, description, grades });
    setSaving(false);
    
    if (res.success) {
      setStatus({ type: 'success', text: 'Institutional grading system successfully deployed.' });
    } else {
      // @ts-expect-error - TS2339: Auto-suppressed for build
      setStatus({ type: 'error', text: res.error || 'Failed to save grading system.' });
    }
  };

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <Trophy size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Grading Intelligence Configurator</h1>
            <p className="text-slate-500 font-medium text-lg">Define institutional scales and academic standing rules</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: General Settings */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Settings2 size={14} />
              System Properties
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. NUC 5.0 Standard"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">GPA Scale</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold transition-all"
                    value={scale}
                    onChange={(e) => setScale(parseInt(e.target.value))}
                  />
                  <Scale size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">Usually 4.0 or 5.0 for Tertiary institutions.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
                <textarea 
                  placeholder="Notes about this grading system..."
                  className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={saving || !name}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                saving ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
              }`}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Deploy Grading System
            </button>
            
            {status && (
              <div className={`p-4 rounded-xl flex items-center gap-3 font-semibold text-sm animate-in fade-in zoom-in-95 ${
                status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {status.text}
              </div>
            )}
          </div>
        </div>

        {/* Right: Grade Definitions */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-indigo-600">
                  <ListChecks size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Grade Point Definitions</h3>
                  <p className="text-slate-500 text-sm">Configure marks-to-grade mappings and weighted points</p>
                </div>
              </div>
              <button 
                onClick={addGrade}
                className="bg-white border border-slate-200 p-2 px-4 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add Grade
              </button>
            </div>

            <div className="p-8 space-y-4">
               <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="col-span-2">Letter</div>
                  <div className="col-span-2 text-center">Min Mark</div>
                  <div className="col-span-2 text-center">Max Mark</div>
                  <div className="col-span-2 text-center">Points</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-1"></div>
               </div>

               <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {grades.map((grade, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100 items-center group hover:border-indigo-200 transition-all">
                      <div className="col-span-2">
                        <input 
                          type="text" 
                          className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-black text-indigo-600"
                          value={grade.letterGrade}
                          onChange={(e) => updateGrade(index, 'letterGrade', e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="col-span-2">
                         <input 
                            type="number" 
                            className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold text-sm"
                            value={grade.minMark}
                            onChange={(e) => updateGrade(index, 'minMark', parseInt(e.target.value))}
                          />
                      </div>
                      <div className="col-span-2">
                         <input 
                            type="number" 
                            className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold text-sm"
                            value={grade.maxMark}
                            onChange={(e) => updateGrade(index, 'maxMark', parseInt(e.target.value))}
                          />
                      </div>
                      <div className="col-span-2">
                         <div className="relative">
                           <input 
                              type="number" 
                              step="0.1"
                              className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold text-sm text-emerald-600"
                              value={grade.points}
                              onChange={(e) => updateGrade(index, 'points', parseFloat(e.target.value))}
                            />
                            <Hash size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300" />
                         </div>
                      </div>
                      <div className="col-span-3">
                         <input 
                            type="text" 
                            placeholder="e.g. Pass"
                            className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                            value={grade.description}
                            onChange={(e) => updateGrade(index, 'description', e.target.value)}
                          />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button onClick={() => removeGrade(index)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-8 bg-indigo-50/50 border-t border-slate-50 flex items-start gap-3">
               <GraduationCap size={20} className="text-indigo-600 shrink-0 mt-0.5" />
               <p className="text-xs text-slate-500 leading-relaxed">
                 <span className="font-bold text-indigo-700">Institutional Rule:</span> These definitions will be used globally for result computation. Ensure mark ranges are contiguous and non-overlapping. The <span className="font-bold">Points</span> defined here will serve as the multiplier for credit units in GPA calculation.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
