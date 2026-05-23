"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calculator,
  Settings,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info,
  Eye,
  BookOpen,
  GraduationCap,
  Award,
  TrendingUp
} from "lucide-react";
import {
  getAllProgrammesWithScoring,
  updateProgrammeScoring,
  SCORING_STRATEGIES,
  calculateAdmissionScore
} from "@/actions/admission-scoring";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdmissionScoringPage() {
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Form state
  const [scoringForm, setScoringForm] = useState({
    scoringStrategy: 'JAMB_ONLY',
    utmeWeight: 50,
    postUtmeWeight: 30,
    olevelWeight: 20,
    utmeDivisor: 8,
    postUtmeDivisor: 2,
    minPostUtmeScore: 50,
    utmeMaxScore: 400,
    postUtmeMaxScore: 100,
    customFormula: ''
  });

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const fetchProgrammes = async () => {
    setLoading(true);
    try {
      const result = await getAllProgrammesWithScoring();
      if (result.success && result.programmes) {
        setProgrammes(result.programmes);
        if (result.programmes.length > 0) {
          selectProgramme(result.programmes[0]);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch programmes");
    }
    setLoading(false);
  };

  const selectProgramme = (programme: any) => {
    setSelectedProgramme(programme);
    setTestResult(null);

    // Populate form with current settings
    const config = programme.scoringConfig || {};
    setScoringForm({
      scoringStrategy: programme.scoringStrategy || 'JAMB_ONLY',
      utmeWeight: config.utmeWeight || 50,
      postUtmeWeight: config.postUtmeWeight || 30,
      olevelWeight: config.olevelWeight || 20,
      utmeDivisor: config.utmeDivisor || 8,
      postUtmeDivisor: config.postUtmeDivisor || 2,
      minPostUtmeScore: config.minPostUtmeScore || 50,
      utmeMaxScore: config.utmeMaxScore || 400,
      postUtmeMaxScore: config.postUtmeMaxScore || 100,
      customFormula: config.customFormula || ''
    });
  };

  const handleSaveScoring = async () => {
    if (!selectedProgramme) return;

    setSaving(true);
    try {
      const strategy = scoringForm.scoringStrategy as keyof typeof SCORING_STRATEGIES;
      const config = {
        utmeWeight: scoringForm.utmeWeight,
        postUtmeWeight: scoringForm.postUtmeWeight,
        olevelWeight: scoringForm.olevelWeight,
        utmeDivisor: scoringForm.utmeDivisor,
        postUtmeDivisor: scoringForm.postUtmeDivisor,
        minPostUtmeScore: scoringForm.minPostUtmeScore,
        utmeMaxScore: scoringForm.utmeMaxScore,
        postUtmeMaxScore: scoringForm.postUtmeMaxScore,
        customFormula: scoringForm.customFormula
      };

      const result = await updateProgrammeScoring(selectedProgramme.id, strategy, config);
      if (result.success) {
        toast.success("Scoring configuration saved successfully");
        await fetchProgrammes();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to save scoring configuration");
    }
    setSaving(false);
  };

  const handleTestCalculation = async () => {
    if (!selectedProgramme) return;

    setTesting(true);
    try {
      // Test with sample data: UTME = 280, Post-UTME = 70
      const result = await calculateAdmissionScore("TEST123456", selectedProgramme.id);
      if (result.success) {
        setTestResult(result);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to test calculation");
    }
    setTesting(false);
  };

  const getStrategyBadge = (strategy: string) => {
    const strategyInfo = SCORING_STRATEGIES[strategy as keyof typeof SCORING_STRATEGIES];
    if (!strategyInfo) return <Badge variant="outline">{strategy}</Badge>;

    const colors: { [key: string]: string } = {
      'JAMB_ONLY': 'bg-slate-100 text-slate-700',
      'WEIGHTED_AGGREGATE': 'bg-blue-100 text-blue-700',
      'OLEVEL_POINTS': 'bg-purple-100 text-purple-700',
      'IBADAN_50_50': 'bg-emerald-100 text-emerald-700',
      'UTME_OVER_8_PLUS_POST_UTME_OVER_2': 'bg-indigo-100 text-indigo-700',
      'UTME_PERCENTAGE_PLUS_POST_UTME_PERCENTAGE': 'bg-amber-100 text-amber-700',
      'CUSTOM': 'bg-rose-100 text-rose-700'
    };

    return (
      <Badge className={cn("border-0", colors[strategy] || 'bg-slate-100')}>
        {strategyInfo.name}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic">
            <Calculator className="w-10 h-10 text-indigo-600" />
            ADMISSION SCORING
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
            Configure admission scoring models and criteria
          </p>
        </div>
        <Button onClick={fetchProgrammes} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Programme Selector */}
      <Card className="border-none shadow-xl rounded-[2.5rem] p-6">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Select Programme</h3>
        <div className="flex flex-wrap gap-3">
          {programmes.map((programme) => (
            <Button
              key={programme.id}
              onClick={() => selectProgramme(programme)}
              className={cn(
                "px-6 py-3 rounded-2xl font-bold transition-all",
                selectedProgramme?.id === programme.id
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
              )}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm">{programme.name}</span>
                <span className="text-xs opacity-75 font-normal">
                  {SCORING_STRATEGIES[programme.scoringStrategy as keyof typeof SCORING_STRATEGIES]?.name || programme.scoringStrategy}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </Card>

      {selectedProgramme && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scoring Configuration */}
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                Scoring Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Strategy Selection */}
              <div>
                <Label className="text-sm font-bold text-slate-700">Scoring Strategy</Label>
                <Select
                  value={scoringForm.scoringStrategy}
                  onValueChange={(value) => setScoringForm({ ...scoringForm, scoringStrategy: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SCORING_STRATEGIES).map(([key, strategy]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span className="font-bold">{strategy.name}</span>
                          <span className="text-xs text-slate-500">{strategy.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {scoringForm.scoringStrategy && (
                  <p className="text-xs text-slate-500 mt-2">
                    {SCORING_STRATEGIES[scoringForm.scoringStrategy as keyof typeof SCORING_STRATEGIES]?.description}
                  </p>
                )}
              </div>

              {/* Configuration Fields based on Strategy */}
              {(scoringForm.scoringStrategy === 'IBADAN_50_50' ||
                scoringForm.scoringStrategy === 'UTME_OVER_8_PLUS_POST_UTME_OVER_2') && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-slate-900">University of Ibadan Model Configuration</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-slate-600">UTME Divisor</Label>
                        <Input
                          type="number"
                          value={scoringForm.utmeDivisor}
                          onChange={(e) => setScoringForm({ ...scoringForm, utmeDivisor: parseInt(e.target.value) })}
                          className="mt-1"
                        />
                        <p className="text-xs text-slate-500 mt-1">UTME Score / {scoringForm.utmeDivisor}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-600">Post-UTME Divisor</Label>
                        <Input
                          type="number"
                          value={scoringForm.postUtmeDivisor}
                          onChange={(e) => setScoringForm({ ...scoringForm, postUtmeDivisor: parseInt(e.target.value) })}
                          className="mt-1"
                        />
                        <p className="text-xs text-slate-500 mt-1">Post-UTME Score / {scoringForm.postUtmeDivisor}</p>
                      </div>
                    </div>

                    {scoringForm.scoringStrategy === 'IBADAN_50_50' && (
                      <div>
                        <Label className="text-xs font-bold text-slate-600">Minimum Post-UTME Score</Label>
                        <Input
                          type="number"
                          value={scoringForm.minPostUtmeScore}
                          onChange={(e) => setScoringForm({ ...scoringForm, minPostUtmeScore: parseInt(e.target.value) })}
                          className="mt-1"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Minimum required Post-UTME score (divided by {scoringForm.postUtmeDivisor})
                        </p>
                      </div>
                    )}

                    <div className="p-3 bg-indigo-50 rounded-xl">
                      <p className="text-sm text-indigo-700">
                        <strong>Formula:</strong> (UTME ÷ {scoringForm.utmeDivisor}) + (Post-UTME ÷ {scoringForm.postUtmeDivisor})
                      </p>
                      {scoringForm.scoringStrategy === 'IBADAN_50_50' && (
                        <p className="text-xs text-indigo-600 mt-1">
                          <strong>Requirement:</strong> Post-UTME contribution must be ≥ {scoringForm.minPostUtmeScore}
                        </p>
                      )}
                    </div>
                  </div>
                )}

              {scoringForm.scoringStrategy === 'UTME_PERCENTAGE_PLUS_POST_UTME_PERCENTAGE' && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
                  <h4 className="font-bold text-slate-900">Percentage Model Configuration</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-600">UTME Weight (%)</Label>
                      <Input
                        type="number"
                        value={scoringForm.utmeWeight}
                        onChange={(e) => setScoringForm({ ...scoringForm, utmeWeight: parseInt(e.target.value) })}
                        className="mt-1"
                        max={100}
                        min={0}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-600">Post-UTME Weight (%)</Label>
                      <Input
                        type="number"
                        value={scoringForm.postUtmeWeight}
                        onChange={(e) => setScoringForm({ ...scoringForm, postUtmeWeight: parseInt(e.target.value) })}
                        className="mt-1"
                        max={100}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-600">UTME Maximum Score</Label>
                      <Input
                        type="number"
                        value={scoringForm.utmeMaxScore}
                        onChange={(e) => setScoringForm({ ...scoringForm, utmeMaxScore: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-600">Post-UTME Maximum Score</Label>
                      <Input
                        type="number"
                        value={scoringForm.postUtmeMaxScore}
                        onChange={(e) => setScoringForm({ ...scoringForm, postUtmeMaxScore: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl">
                    <p className="text-sm text-amber-700">
                      <strong>Formula:</strong> (UTME/{scoringForm.utmeMaxScore} × {scoringForm.utmeWeight}%) + (Post-UTME/{scoringForm.postUtmeMaxScore} × {scoringForm.postUtmeWeight}%)
                    </p>
                  </div>
                </div>
              )}

              {(scoringForm.scoringStrategy === 'WEIGHTED_AGGREGATE' || scoringForm.scoringStrategy === 'CUSTOM') && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
                  <h4 className="font-bold text-slate-900">Weighted Aggregate Configuration</h4>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-600">UTME Weight (%)</Label>
                      <Input
                        type="number"
                        value={scoringForm.utmeWeight}
                        onChange={(e) => setScoringForm({ ...scoringForm, utmeWeight: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-600">Post-UTME Weight (%)</Label>
                      <Input
                        type="number"
                        value={scoringForm.postUtmeWeight}
                        onChange={(e) => setScoringForm({ ...scoringForm, postUtmeWeight: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-600">O-Level Weight (%)</Label>
                      <Input
                        type="number"
                        value={scoringForm.olevelWeight}
                        onChange={(e) => setScoringForm({ ...scoringForm, olevelWeight: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-700">
                      Total Weight: {scoringForm.utmeWeight + scoringForm.postUtmeWeight + scoringForm.olevelWeight}%
                      {(scoringForm.utmeWeight + scoringForm.postUtmeWeight + scoringForm.olevelWeight) !== 100 && (
                        <span className="text-rose-600 ml-2">(Should equal 100%)</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Cut-off Mark */}
              <div>
                <Label className="text-sm font-bold text-slate-700">Cut-off Mark</Label>
                <Input
                  type="number"
                  value={selectedProgramme.cutOffMark || 180}
                  onChange={(e) => setSelectedProgramme({ ...selectedProgramme, cutOffMark: parseInt(e.target.value) })}
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">Minimum aggregate score required for admission</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveScoring}
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Configuration
                </Button>
                <Button
                  onClick={handleTestCalculation}
                  disabled={testing}
                  variant="outline"
                  className="flex-1"
                >
                  {testing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                  Test Calculation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Results & Preview */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {testResult ? (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-emerald-50 rounded-2xl">
                      <p className="text-4xl font-black text-emerald-600">{testResult.aggregateScore?.toFixed(2)}</p>
                      <p className="text-sm text-emerald-700 uppercase tracking-widest font-bold mt-2">Aggregate Score</p>
                    </div>

                    {testResult.scoreBreakdown && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-900">Score Breakdown</h4>

                        {testResult.scoreBreakdown.utmeScore !== undefined && (
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                            <div>
                              <p className="font-bold text-slate-900">UTME Score</p>
                              <p className="text-xs text-slate-500">Original: {testResult.scoreBreakdown.utmeScore}</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700">
                              +{testResult.scoreBreakdown.utmeContribution?.toFixed(2)}
                            </Badge>
                          </div>
                        )}

                        {testResult.scoreBreakdown.postUtmeScore !== undefined && (
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                            <div>
                              <p className="font-bold text-slate-900">Post-UTME Score</p>
                              <p className="text-xs text-slate-500">Original: {testResult.scoreBreakdown.postUtmeScore}</p>
                            </div>
                            <Badge className="bg-purple-100 text-purple-700">
                              +{testResult.scoreBreakdown.postUtmeContribution?.toFixed(2)}
                            </Badge>
                          </div>
                        )}

                        {testResult.scoreBreakdown.olevelContribution !== undefined && testResult.scoreBreakdown.olevelContribution > 0 && (
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                            <div>
                              <p className="font-bold text-slate-900">O-Level Points</p>
                            </div>
                            <Badge className="bg-amber-100 text-amber-700">
                              +{testResult.scoreBreakdown.olevelContribution?.toFixed(2)}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4 bg-indigo-50 rounded-xl">
                      <p className="text-sm text-indigo-700">
                        <strong>Strategy:</strong> {SCORING_STRATEGIES[testResult.strategy as keyof typeof SCORING_STRATEGIES]?.name || testResult.strategy}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Click "Test Calculation" to see how the scoring works</p>
                    <p className="text-xs text-slate-400 mt-2">Test data: UTME = 280, Post-UTME = 70</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Configuration Summary */}
            <Card className="border-none shadow-xl rounded-[2.5rem] p-6">
              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                Current Configuration
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Strategy</span>
                  {getStrategyBadge(selectedProgramme.scoringStrategy)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Cut-off Mark</span>
                  <span className="font-bold text-slate-900">{selectedProgramme.cutOffMark || 180}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Programme</span>
                  <span className="font-bold text-slate-900">{selectedProgramme.name}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
