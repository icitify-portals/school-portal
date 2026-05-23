"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  addPostUtmeScore,
  approvePostUtmeScore,
  getCandidatePostUtmeScores,
  calculateAdmissionScore,
  calculateAdmissionDecision,
  SCORING_STRATEGIES
} from "@/actions/admission-scoring";
import { useRouter } from "next/navigation";
import { Loader2, Save, Send, XCircle, Calculator, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  applicationId: number;
  jambRegNo: string;
  programmeId: number;
  utmeScore: number;
  currentStatus: string;
  scoringStrategy: string;
  cutOffMark: number;
}

export default function EnhancedScoringForm({
  applicationId,
  jambRegNo,
  programmeId,
  utmeScore,
  currentStatus,
  scoringStrategy,
  cutOffMark
}: Props) {
  const [postUtmeScore, setPostUtmeScore] = useState<string>("");
  const [examType, setExamType] = useState<string>("Post-UTME");
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [existingScores, setExistingScores] = useState<any[]>([]);
  const [calculatedResult, setCalculatedResult] = useState<any>(null);
  const [admissionDecision, setAdmissionDecision] = useState<any>(null);
  const router = useRouter();

  const strategyInfo = SCORING_STRATEGIES[scoringStrategy as keyof typeof SCORING_STRATEGIES];

  useEffect(() => {
    fetchExistingScores();
  }, [jambRegNo]);

  const fetchExistingScores = async () => {
    const result = await getCandidatePostUtmeScores(jambRegNo);
    if (result.success && result.scores) {
      setExistingScores(result.scores);
    }
  };

  const handleAddScore = async () => {
    if (!postUtmeScore || !examType || !examDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const result = await addPostUtmeScore(
      jambRegNo,
      programmeId,
      parseInt(postUtmeScore),
      examType,
      examDate
    );

    if (result.success) {
      toast.success("Post-UTME score added successfully");
      setPostUtmeScore("");
      await fetchExistingScores();
      await calculateScores();
    } else {
      toast.error(result.error || "Failed to add score");
    }
    setLoading(false);
  };

  const handleApproveScore = async (scoreId: number) => {
    setLoading(true);
    const result = await approvePostUtmeScore(scoreId);
    if (result.success) {
      toast.success("Score approved");
      await fetchExistingScores();
      await calculateScores();
    } else {
      toast.error(result.error || "Failed to approve score");
    }
    setLoading(false);
  };

  const calculateScores = async () => {
    setCalculating(true);
    const result = await calculateAdmissionScore(jambRegNo, programmeId);
    if (result.success) {
      setCalculatedResult(result);
    } else {
      toast.error(result.error || "Failed to calculate score");
    }
    setCalculating(false);
  };

  const handleCalculateDecision = async () => {
    setCalculating(true);
    const result = await calculateAdmissionDecision(jambRegNo, programmeId);
    if (result.success && 'decision' in result) {
      setAdmissionDecision(result);
      toast.success(`Admission decision: ${result.decision}`);
    } else {
      toast.error((result as any).error || "Failed to calculate decision");
    }
    setCalculating(false);
  };

  const getStrategyDisplay = () => {
    if (!strategyInfo) return scoringStrategy;
    return (
      <div className="space-y-1">
        <p className="font-bold text-indigo-900">{strategyInfo.name}</p>
        <p className="text-xs text-indigo-600">{strategyInfo.description}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Scoring Strategy Info */}
      <Card className="bg-indigo-50 border-indigo-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-indigo-700">
            <Calculator className="h-4 w-4" /> Scoring Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getStrategyDisplay()}
          {scoringStrategy === 'IBADAN_50_50' && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-700">
                <strong>UI Model:</strong> UTME/8 + Post-UTME/2 (Min Post-UTME: 50)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current UTME Score */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground uppercase font-semibold">UTME Score</p>
          <p className="text-2xl font-bold text-slate-900">{utmeScore}</p>
        </div>
        {(strategyInfo as any)?.config?.utmeDivisor && (
          <div className="text-right">
            <p className="text-xs text-slate-500">Contribution</p>
            <p className="text-lg font-bold text-indigo-600">
              {(utmeScore / (strategyInfo as any).config.utmeDivisor).toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Add Post-UTME Score */}
      <div className="space-y-4">
        <h4 className="font-bold text-slate-900">Add Post-UTME Score</h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="postUtmeScore">Post-UTME Score</Label>
            <Input
              id="postUtmeScore"
              type="number"
              value={postUtmeScore}
              onChange={(e) => setPostUtmeScore(e.target.value)}
              placeholder="e.g. 70"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="examType">Exam Type</Label>
            <select
              id="examType"
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              disabled={loading}
            >
              <option value="Post-UTME">Post-UTME</option>
              <option value="Screening Test">Screening Test</option>
              <option value="Interview">Interview</option>
              <option value="Aptitude Test">Aptitude Test</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="examDate">Exam Date</Label>
            <Input
              id="examDate"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <Button
          onClick={handleAddScore}
          disabled={loading || !postUtmeScore}
          className="w-full"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Add Score
        </Button>
      </div>

      {/* Existing Scores */}
      {existingScores.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900">Existing Post-UTME Scores</h4>
          <div className="space-y-2">
            {existingScores.map((score) => (
              <div key={score.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-bold text-slate-900">{score.score}</p>
                  <p className="text-xs text-slate-500">{score.examType} - {new Date(score.examDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {score.isApproved ? (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="outline">Pending</Badge>
                      <Button
                        size="sm"
                        onClick={() => handleApproveScore(score.id)}
                        disabled={loading}
                      >
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculate Button */}
      <Button
        onClick={calculateScores}
        disabled={calculating || existingScores.length === 0}
        variant="outline"
        className="w-full"
      >
        {calculating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
        Calculate Aggregate Score
      </Button>

      {/* Calculated Result */}
      {calculatedResult && (
        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
              <Calculator className="h-4 w-4" /> Calculated Aggregate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-4xl font-black text-emerald-600">
                {calculatedResult.aggregateScore?.toFixed(2)}
              </p>
              <p className="text-sm text-emerald-700">Aggregate Score</p>
            </div>

            {calculatedResult.scoreBreakdown && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">UTME Contribution:</span>
                  <span className="font-bold">{calculatedResult.scoreBreakdown.utmeContribution?.toFixed(2)}</span>
                </div>
                {calculatedResult.scoreBreakdown.postUtmeContribution > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Post-UTME Contribution:</span>
                    <span className="font-bold">{calculatedResult.scoreBreakdown.postUtmeContribution?.toFixed(2)}</span>
                  </div>
                )}
                {calculatedResult.scoreBreakdown.olevelContribution > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">O-Level Contribution:</span>
                    <span className="font-bold">{calculatedResult.scoreBreakdown.olevelContribution?.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Cut-off Comparison */}
            <div className="mt-4 pt-4 border-t border-emerald-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Cut-off Mark:</span>
                <span className="font-bold">{cutOffMark}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-slate-600">Difference:</span>
                <span className={calculatedResult.aggregateScore >= cutOffMark ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>
                  {(calculatedResult.aggregateScore - cutOffMark).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admission Decision */}
      {admissionDecision && (
        <Card className={admissionDecision.decision === 'admitted' ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm flex items-center gap-2 ${admissionDecision.decision === 'admitted' ? "text-emerald-700" : "text-rose-700"}`}>
              {admissionDecision.decision === 'admitted' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              Admission Decision: {admissionDecision.decision === 'admitted' ? 'ADMITTED' : 'NOT ADMITTED'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Aggregate Score: <strong>{admissionDecision.aggregateScore?.toFixed(2)}</strong>
              {admissionDecision.decision === 'admitted'
                ? ` (exceeds cut-off by ${admissionDecision.difference?.toFixed(2)} points)`
                : ` (below cut-off by ${Math.abs(admissionDecision.difference)?.toFixed(2)} points)`
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Decision Actions */}
      <div className="pt-6 border-t space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-bold">Final Decision</Label>
          <Button
            onClick={handleCalculateDecision}
            disabled={calculating || !calculatedResult}
            variant="outline"
            size="sm"
          >
            {calculating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
            Calculate Decision
          </Button>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={loading || currentStatus === 'admitted' || (admissionDecision && admissionDecision.decision !== 'admitted')}
          >
            <Send className="mr-2 h-4 w-4" /> Admit Candidate
          </Button>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            disabled={loading || currentStatus === 'admitted'}
          >
            <XCircle className="mr-2 h-4 w-4" /> Reject Candidate
          </Button>
        </div>
        {currentStatus === 'admitted' && (
          <div className="mt-2 flex items-center gap-2 text-emerald-600 text-sm font-medium">
            <Badge className="bg-emerald-600">ADMITTED</Badge>
            Decision has been finalized.
          </div>
        )}
      </div>
    </div>
  );
}
