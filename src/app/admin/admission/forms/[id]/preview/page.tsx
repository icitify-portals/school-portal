"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { getFormTemplate } from "@/actions/admission_v2";
import { COUNTRY_NAMES } from "@/lib/countries";
// @ts-expect-error - TS7016: Auto-suppressed for build
import naija from 'naija-state-local-government';
import PhotoCapture from "@/components/forms/PhotoCapture";
import OLevelSubmission from "@/components/forms/OLevelSubmission";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import QRCode from 'qrcode';

function RenderField({ field, value, onChange, errors, allValues, currentSection }: { field: any; value: any; onChange: (key: string, val: any) => void; errors: Record<string, string>; allValues: Record<string, any>; currentSection?: any }) {
    const options = field.options ? field.options.split(/[,\n]/).map((o: string) => o.trim()).filter(Boolean) : [];
    const isHalf = field.width === 'half' && field.type !== 'file' && field.type !== 'olevel_result';
    const error = errors[field.label];

    const handleChange = (val: any) => {
        onChange(field.label, val);
        if (error) {
            const newErrors = { ...errors };
            delete newErrors[field.label];
        }
    };

    return (
        <div className={cn("space-y-2", isHalf ? "col-span-1" : "col-span-2")}>
            <label className="text-sm font-semibold text-gray-700">
                {field.label} {field.isRequired && <span className="text-rose-500">*</span>}
            </label>
            {field.helpText && <p className="text-xs text-gray-400 px-1">{field.helpText}</p>}
            {error && <p className="text-xs text-rose-600 font-medium px-1">{error}</p>}

            {(field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number' || field.type === 'date' || field.type === 'time' || field.type === 'url') && (
                <input
                    type={field.type}
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    className={cn(
                        "w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all",
                        error ? "border-rose-300 bg-rose-50" : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    )}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                />
            )}

            {field.type === 'textarea' && (
                <textarea
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    className={cn(
                        "w-full border rounded-xl px-4 py-3 text-sm min-h-[100px] outline-none transition-all",
                        error ? "border-rose-300 bg-rose-50" : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    )}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                />
            )}

            {field.type === 'select' && (
                <select
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    className={cn(
                        "w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all",
                        error ? "border-rose-300 bg-rose-50" : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    )}
                >
                    <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
                    {options.map((opt: string, i: number) => (
                        <option key={i} value={opt}>{opt}</option>
                    ))}
                </select>
            )}

            {field.type === 'blood_group' && (
                <select
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    className={cn(
                        "w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all",
                        error ? "border-rose-300 bg-rose-50" : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    )}
                >
                    <option value="">Select Blood Group</option>
                    {(field.options || "A+, A-, B+, B-, AB+, AB-, O+, O-").split(/[,\n]/).map((o: string) => o.trim()).filter(Boolean).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            )}

            {field.type === 'phenotype' && (
                <select
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    className={cn(
                        "w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all",
                        error ? "border-rose-300 bg-rose-50" : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    )}
                >
                    <option value="">Select Phenotype</option>
                    {(field.options || "AA, AS, AC, SS, SC, CC").split(/[,\n]/).map((o: string) => o.trim()).filter(Boolean).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            )}

            {field.type === 'gender' && (
                <select
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    className={cn(
                        "w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all",
                        error ? "border-rose-300 bg-rose-50" : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    )}
                >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            )}

            {field.type === 'nationality' && (
                <select
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    className={cn(
                        "w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all",
                        error ? "border-rose-300 bg-rose-50" : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    )}
                >
                    <option value="">Select Nationality</option>
                    {COUNTRY_NAMES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            )}

            {field.type === 'state' && (
                <select
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    className={cn(
                        "w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all",
                        error ? "border-rose-300 bg-rose-50" : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    )}
                >
                    <option value="">Select State</option>
                    {naija.states().map((s: string) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            )}

            {field.type === 'lga' && (
                <select
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    className={cn(
                        "w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all",
                        error ? "border-rose-300 bg-rose-50" : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    )}
                >
                    <option value="">Select L.G.A</option>
                    {(() => {
                        try {
                            const stateField = currentSection?.fields?.find((f: any) => f.type === 'state');
                            const selectedState = stateField ? allValues[stateField.label] : null;
                            if (selectedState) {
                                return naija.lgas(selectedState).lgas.map((l: string) => (
                                    <option key={l} value={l}>{l}</option>
                                ));
                            }
                            return null;
                        } catch { return null; }
                    })()}
                </select>
            )}

            {field.type === 'radio' && (
                <div className="flex flex-wrap gap-4">
                    {options.map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="radio"
                                name={field.label}
                                checked={value === opt}
                                onChange={() => handleChange(opt)}
                                className="accent-indigo-600"
                            />
                            {opt}
                        </label>
                    ))}
                </div>
            )}

            {field.type === 'checkbox' && (
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => handleChange(e.target.checked)}
                        className="accent-indigo-600"
                    />
                    {field.placeholder || "Yes"}
                </label>
            )}

            {field.type === 'checkbox_group' && (
                <div className="flex flex-wrap gap-4">
                    {options.map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={(value || []).includes(opt)}
                                onChange={(e) => {
                                    const current = value || [];
                                    const next = e.target.checked
                                        ? [...current, opt]
                                        : current.filter((v: string) => v !== opt);
                                    handleChange(next);
                                }}
                                className="accent-indigo-600"
                            />
                            {opt}
                        </label>
                    ))}
                </div>
            )}

            {field.type === 'file' && (
                <PhotoCapture
                    value={value || ""}
                    onChange={(val) => handleChange(val)}
                    label={field.label}
                />
            )}

            {field.type === 'image' && field.options && (
                <div className="rounded-xl overflow-hidden">
                    <img src={field.options} alt={field.label} className="max-w-full h-auto max-h-48 object-contain mx-auto" />
                </div>
            )}

            {field.type === 'olevel_result' && (
                <OLevelSubmission
                    value={value || []}
                    onChange={(val) => handleChange(val)}
                    examBodies={[
                        { id: 1, name: "WAEC" },
                        { id: 2, name: "NECO" },
                        { id: 3, name: "NABTEB" },
                        { id: 4, name: "GCE" },
                    ]}
                />
            )}
        </div>
    );
}

export default function FormPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const templateId = parseInt(params.id as string);
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<any>({});
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [formNumber] = useState(() => "FSS/" + new Date().getFullYear() + "/" + String(Math.floor(Math.random() * 90000) + 10000));
    const [qrDataUrl, setQrDataUrl] = useState<string>("");

    useEffect(() => {
        const fetchTemplate = async () => {
            setLoading(true);
            const data = await getFormTemplate(templateId);
            setTemplate(data);
            setLoading(false);
        };
        fetchTemplate();
    }, [templateId]);

    useEffect(() => {
        QRCode.toDataURL(JSON.stringify({ fn: formNumber, preview: true }), { width: 160, margin: 2, color: { dark: "#1e1b4b", light: "#ffffff" } })
            .then((url: string) => setQrDataUrl(url))
            .catch(() => {});
    }, [formNumber]);

    const evaluateCondition = (field: any): boolean => {
        if (!field.conditionalLogic) return true;
        
        try {
            const logic = typeof field.conditionalLogic === 'string' ? JSON.parse(field.conditionalLogic) : field.conditionalLogic;
            if (!logic.enabled || !logic.sourceField) return true;

            const sourceValue = formData[logic.sourceField];
            const targetValue = logic.value;

            switch (logic.operator) {
                case 'equals':
                    return String(sourceValue).toLowerCase() === String(targetValue).toLowerCase();
                case 'notEquals':
                    return String(sourceValue).toLowerCase() !== String(targetValue).toLowerCase();
                case 'contains':
                    return String(sourceValue).toLowerCase().includes(String(targetValue).toLowerCase());
                case 'notEmpty':
                    return sourceValue !== undefined && sourceValue !== null && String(sourceValue).trim() !== '';
                case 'lessThan':
                    return Number(sourceValue) < Number(targetValue);
                case 'greaterThan':
                    return Number(sourceValue) > Number(targetValue);
                default:
                    return true;
            }
        } catch {
            return true;
        }
    };

    const validateSection = () => {
        const errors: Record<string, string> = {};
        if (!currentSection) return true;
        currentSection.fields.forEach((field: any) => {
            const val = formData[field.label];
            if (field.isRequired) {
                if (!val || (typeof val === 'string' && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
                    errors[field.label] = `${field.label} is required`;
                    return;
                }
            }
            if (val && typeof val === 'string' && val.trim()) {
                if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
                    errors[field.label] = `${field.label} must be a valid email address`;
                }
                if (field.type === 'url' && !/^https?:\/\/.+/.test(val.trim())) {
                    errors[field.label] = `${field.label} must be a valid URL`;
                }
            }
        });
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const nextStep = () => {
        if (!validateSection()) {
            toast.error("Please fix validation errors before proceeding.");
            return;
        }
        setCurrentStep(Math.min(totalSteps - 1, currentStep + 1));
    };

    const prevStep = () => {
        setCurrentStep(Math.max(0, currentStep - 1));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!template) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500">Template not found.</p>
                <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
            </div>
        );
    }

    const sections = template.sections || [];
    const isReviewStep = currentStep === sections.length;
    const currentSection = sections[currentStep];
    const totalSteps = sections.length + 1;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => router.push(`/admin/admission/forms/${templateId}`)}
                            variant="ghost"
                            size="sm"
                            className="flex gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Builder
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">{template.name}</h1>
                            <p className="text-xs text-amber-600 font-semibold uppercase">TEST MODE — Fill fields to preview behavior</p>
                        </div>
                    </div>
                    <span className="text-sm font-bold text-gray-400">
                        Step {currentStep + 1} of {totalSteps}
                    </span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {sections.length > 0 && (
                    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                        {sections.map((sec: any, i: number) => (
                            <button
                                key={sec.id}
                                onClick={() => setCurrentStep(i)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                                    i === currentStep
                                        ? "bg-indigo-600 text-white"
                                        : i < currentStep
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-500"
                                )}
                            >
                                {sec.title}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentStep(sections.length)}
                            className={cn(
                                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                                isReviewStep
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 text-gray-500"
                            )}
                        >
                            Review
                        </button>
                    </div>
                )}

                {sections.length === 0 ? (
                    <Card className="border-none shadow-sm rounded-2xl">
                        <CardContent className="p-12 text-center text-gray-400">
                            No sections added yet. Go to the builder to add sections and fields.
                        </CardContent>
                    </Card>
                ) : isReviewStep ? (
                    <div className="bg-white border border-gray-300 shadow-sm rounded-2xl overflow-hidden">
                        <div className="border-b-2 border-indigo-900 bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-800 px-8 py-6 flex items-center gap-6">
                            <img src="/fss_logo.png" alt="School Logo" className="w-20 h-20 rounded-full border-2 border-white/30 object-contain bg-white p-1" />
                            <div className="text-white flex-1">
                                <h1 className="text-2xl font-black tracking-tight">FEDERAL SCHOOL OF STATISTICS</h1>
                                <p className="text-indigo-200 text-sm font-medium mt-1">Along Ajibode Shasha road, Behind NISER, Shasha-Ojoo</p>
                                <p className="text-indigo-300 text-xs mt-0.5">Ibadan, Oyo State</p>
                                <div className="mt-3 pt-3 border-t border-indigo-700/50">
                                    <p className="text-white font-bold text-sm tracking-wide">2026/2027 APPLICATION FORM</p>
                                    <p className="text-indigo-300 text-[10px] font-mono mt-0.5">Form No: {formNumber}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-20 h-20 rounded-lg bg-white p-1" />}
                                <div className="flex items-center gap-1 text-indigo-200 text-[10px] font-bold">
                                    <ShieldCheck className="w-3 h-3" /> Secured
                                </div>
                            </div>
                            {(() => {
                                const photoField = sections.flatMap((s: any) => s.fields).find((f: any) => f.type === 'file');
                                const photoVal = photoField ? formData[photoField.label] : null;
                                if (photoVal && typeof photoVal === 'string' && photoVal.startsWith('data:image')) {
                                    return <img src={photoVal} alt="Passport" className="w-24 h-28 rounded-lg border-2 border-white/40 object-cover shrink-0 bg-white" />;
                                }
                                return null;
                            })()}
                        </div>
                        <div className="p-8 space-y-6">
                            {sections.map((sec: any) => {
                                const visibleFields = (sec.fields || []).filter((f: any) => evaluateCondition(f) && f.type !== 'file');
                                if (visibleFields.length === 0) return null;
                                return (
                                    <div key={sec.id}>
                                        <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest border-b border-indigo-200 pb-2 mb-4">{sec.title}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                            {visibleFields.map((field: any) => {
                                                const val = formData[field.label];
                                                if (field.type === 'olevel_result') {
                                                    const EXAM_BODIES: Record<string, string> = { '1': 'WAEC', '2': 'NECO', '3': 'NABTEB', '4': 'GCE' };
                                                    return (
                                                        <div key={field.id} className="col-span-2">
                                                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{field.label}</p>
                                                            {Array.isArray(val) && val.map((sitting: any, si: number) => (
                                                                <div key={si} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50/50">
                                                                    <p className="text-sm font-bold text-gray-800 mb-1">Sitting {si + 1}: {EXAM_BODIES[sitting.examBodyId] || `Body #${sitting.examBodyId}`} — {sitting.examYear || '—'} — Exam No: {sitting.examNumber || '—'}</p>
                                                                    {Array.isArray(sitting.subjects) && sitting.subjects.filter((s: any) => s.subjectName).map((sub: any, subIdx: number) => (
                                                                        <span key={subIdx} className="inline-block bg-white rounded px-2 py-0.5 mr-1 mb-1 border text-xs text-gray-700">
                                                                            {sub.subjectName}: <span className="font-semibold">{sub.grade || '—'}</span>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                            {(!val || (Array.isArray(val) && val.length === 0)) && <p className="text-sm text-gray-400">—</p>}
                                                        </div>
                                                    );
                                                }
                                                const displayVal = Array.isArray(val) ? val.join(', ') : val || '—';
                                                return (
                                                    <div key={field.id} className="space-y-0.5">
                                                        <p className="text-xs text-gray-400 uppercase tracking-wider">{field.label}</p>
                                                        <p className="text-sm text-gray-800 font-medium">{displayVal}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                            {submitted && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                    <p className="text-green-700 font-bold text-lg">Form submitted successfully!</p>
                                    <p className="text-green-600 text-sm mt-1">This simulates the post-submission confirmation.</p>
                                </div>
                            )}
                            <div className="border-t border-gray-200 pt-4 flex items-center justify-between text-[10px] text-gray-400">
                                <span className="font-mono">Form No: {formNumber}</span>
                                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Tamper-proof document — Verify at portal.fssibadan.edu.ng/verify/{formNumber}</span>
                            </div>
                        </div>
                    </div>
                ) : currentSection ? (
                    <Card className="border-none shadow-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">{currentSection.title}</CardTitle>
                            {currentSection.description && (
                                <p className="text-sm text-gray-500">{currentSection.description}</p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                {(currentSection.fields || []).map((field: any) => {
                                    if (!evaluateCondition(field)) return null;
                                    return (
                                        <RenderField
                                            key={field.id}
                                            field={field}
                                            value={formData[field.label]}
                                            onChange={(key, val) => {
                                                setFormData((prev: any) => ({ ...prev, [key]: val }));
                                                setValidationErrors((prev: any) => {
                                                    const next = { ...prev };
                                                    delete next[key];
                                                    return next;
                                                });
                                            }}
                                            errors={validationErrors}
                                            allValues={formData}
                                            currentSection={currentSection}
                                        />
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                {sections.length > 0 && !isReviewStep && (
                    <div className="flex justify-between mt-8">
                        <Button
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            variant="outline"
                            className="flex gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </Button>
                        <Button
                            onClick={nextStep}
                            className="flex gap-2 bg-indigo-600 hover:bg-indigo-700"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {isReviewStep && (
                    <div className="flex justify-between mt-8">
                        <Button
                            onClick={prevStep}
                            variant="outline"
                            className="flex gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </Button>
                        <Button
                            onClick={() => {
                                setSubmitted(true);
                                toast.success("Form submitted successfully! (test mode)");
                            }}
                            className="flex gap-2 bg-green-600 hover:bg-green-700"
                        >
                            Submit (Test)
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
