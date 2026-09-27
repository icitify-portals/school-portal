"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    BadgeCheck,
    CheckCircle2,
    Clock,
    Loader2,
    RefreshCw,
    ShieldAlert,
    UserCheck,
    Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
    getRegistrationPreview,
    runRegistration,
    type PromotionCandidate,
    type PromotionPreview,
    type RegistrationRunResult,
} from "@/actions/admission-registration-runner";
import { cn } from "@/lib/utils";

function money(value: string | null) {
    if (!value) return "-";
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString("en-NG") : value;
}

function CandidateTable({
    rows,
    empty,
    showStale = false,
}: {
    rows: PromotionCandidate[];
    empty: string;
    showStale?: boolean;
}) {
    if (rows.length === 0) {
        return <p className="text-sm text-muted-foreground py-6 text-center">{empty}</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                        <th className="p-2">Form no.</th>
                        <th className="p-2">Applicant</th>
                        <th className="p-2">Programme</th>
                        <th className="p-2">Acceptance</th>
                        <th className="p-2">School fee</th>
                        {showStale && <th className="p-2">Discarded evidence</th>}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((c) => (
                        <tr key={c.applicationId} className="border-b last:border-0">
                            <td className="p-2 font-mono text-xs">{c.formNumber ?? `#${c.applicationId}`}</td>
                            <td className="p-2">
                                <div>{c.applicantName ?? "—"}</div>
                                {c.applicantEmail && (
                                    <div className="text-xs text-muted-foreground">{c.applicantEmail}</div>
                                )}
                            </td>
                            <td className="p-2 text-xs">
                                {c.programmeName ?? "—"}
                                {c.blockedReason && (
                                    <div className="text-amber-600">{c.blockedReason}</div>
                                )}
                            </td>
                            <td className="p-2">
                                {c.verification.acceptancePaid ? (
                                    <span className="text-green-600">
                                        {money(c.verification.acceptanceEvidence[0]?.amount ?? null)}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">not verified</span>
                                )}
                                {c.verification.flagContradicted && (
                                    <div className="text-xs text-amber-600">
                                        flag says &quot;paid&quot; — no payment found
                                    </div>
                                )}
                            </td>
                            <td className="p-2">
                                {c.verification.schoolFeePaid ? (
                                    <span className="text-green-600">
                                        {money(c.verification.schoolFeeEvidence[0]?.amount ?? null)}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">outstanding</span>
                                )}
                            </td>
                            {showStale && (
                                <td className="p-2 text-xs text-muted-foreground">
                                    {c.verification.staleEvidence.length === 0
                                        ? "—"
                                        : c.verification.staleEvidence.map((e, i) => (
                                              <div key={i}>{e.ignoredReason ?? e.purpose}</div>
                                          ))}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function RegistrationRunnerPage() {
    const [preview, setPreview] = useState<PromotionPreview | null>(null);
    const [run, setRun] = useState<RegistrationRunResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getRegistrationPreview();
        if (res.success && res.preview) {
            setPreview(res.preview);
        } else {
            toast.error(res.error ?? "Could not load the registration preview.");
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function promote() {
        if (!preview || preview.eligible.length === 0) return;
        setRunning(true);
        const res = await runRegistration({ sessionId: preview.sessionId ?? undefined });
        if (res.success && res.run) {
            setRun(res.run);
            if (res.run.promoted > 0) {
                toast.success(`Registered ${res.run.promoted} applicant(s).`);
            }
            if (res.run.failed > 0) {
                toast.error(`${res.run.failed} registration(s) failed — see the log.`);
            }
            if (res.run.promoted === 0 && res.run.failed === 0) {
                toast.info("Nothing to register.");
            }
            setConfirming(false);
            await load();
        } else {
            toast.error(res.error ?? "Registration run failed.");
        }
        setRunning(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Registration Runner</h1>
                    <p className="text-sm text-muted-foreground">
                        Registers admitted applicants as ND 1 / HND 1 once their acceptance fee
                        and their Remita school fee for the session are both verified.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={load} disabled={running}>
                        <RefreshCw className={cn("h-4 w-4", running && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setConfirming(true)}
                        disabled={running || !preview || preview.eligible.length === 0}
                    >
                        <UserCheck className="h-4 w-4" />
                        Register {preview?.eligible.length ?? 0} eligible
                    </Button>
                </div>
            </div>

            <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="p-4 text-sm flex gap-3">
                    <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <p className="font-medium">Payment policy in force</p>
                        <p className="text-muted-foreground">
                            School fees are paid annually, so only a <strong>completed Remita
                            payment naming {preview?.sessionName ?? "the target session"}</strong>{" "}
                            confers standing for this session. Legacy school-fee receipts and
                            payments made for an earlier session are discarded. Acceptance may be
                            paid through any gateway.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {preview && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<BadgeCheck className="h-4 w-4" />}
                        label="Eligible now"
                        value={preview.eligible.length}
                        tone="green"
                    />
                    <StatCard
                        icon={<Clock className="h-4 w-4" />}
                        label="Awaiting school fee"
                        value={preview.awaitingSchoolFee.length}
                        tone="amber"
                    />
                    <StatCard
                        icon={<AlertTriangle className="h-4 w-4" />}
                        label="Flag contradicts payment"
                        value={preview.flagContradicted.length}
                        tone="amber"
                    />
                    <StatCard
                        icon={<UserCheck className="h-4 w-4" />}
                        label="Already registered"
                        value={preview.alreadyRegisteredCount}
                        tone="muted"
                    />
                </div>
            )}

            {preview && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Eligible — both fees verified
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CandidateTable
                                rows={preview.eligible}
                                empty="Nobody is eligible right now. Applicants appear here as soon as their Remita school fee lands."
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Wallet className="h-4 w-4 text-amber-600" />
                                Awaiting Remita school fee
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CandidateTable
                                rows={preview.awaitingSchoolFee}
                                showStale
                                empty="No applicant is waiting on a school fee."
                            />
                        </CardContent>
                    </Card>

                    {preview.blocked.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    Blocked — no qualifying payment
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CandidateTable
                                    rows={preview.blocked}
                                    showStale
                                    empty="Nothing blocked."
                                />
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {run && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Last run</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p>
                            attempted <strong>{run.attempted}</strong> · promoted{" "}
                            <strong className="text-green-600">{run.promoted}</strong> · skipped{" "}
                            <strong>{run.skipped}</strong> · failed{" "}
                            <strong className="text-red-600">{run.failed}</strong>
                        </p>
                        {run.results.length > 0 && (
                            <ul className="space-y-1">
                                {run.results.map((r) => (
                                    <li key={r.applicationId} className="text-xs">
                                        <span className="font-mono">{r.formNumber ?? `#${r.applicationId}`}</span>{" "}
                                        · {r.applicantName ?? "—"} ·{" "}
                                        <span
                                            className={cn(
                                                r.outcome === "promoted" && "text-green-600",
                                                r.outcome === "failed" && "text-red-600"
                                            )}
                                        >
                                            {r.outcome}: {r.detail}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            )}

            {confirming && preview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="text-base">Confirm registration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm">
                                This will register <strong>{preview.eligible.length}</strong> applicant(s)
                                as level 1 students in session{" "}
                                <strong>{preview.sessionName}</strong>. Each one is re-checked
                                against the payment records immediately before being written.
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setConfirming(false)} disabled={running}>
                                    Cancel
                                </Button>
                                <Button onClick={promote} disabled={running}>
                                    {running ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <UserCheck className="h-4 w-4" />
                                    )}
                                    Register
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    tone,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    tone: "green" | "amber" | "muted";
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {icon}
                    {label}
                </div>
                <p
                    className={cn(
                        "mt-1 text-3xl font-bold",
                        tone === "green" && "text-green-600",
                        tone === "amber" && "text-amber-600"
                    )}
                >
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}
