"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getFormTemplate } from "@/actions/admission_v2";
import { COUNTRY_NAMES } from "@/lib/countries";
// @ts-expect-error - TS7016: Auto-suppressed for build
import naija from 'naija-state-local-government';
import PhotoCapture from "@/components/forms/PhotoCapture";
import OLevelSubmission from "@/components/forms/OLevelSubmission";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function RenderField({ field, value, onChange, errors }: { field: any; value: any; onChange: (key: string, val: any) => void; errors: Record<string, string> }) {
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
                            const firstState = naija.states()[0];
                            return naija.lgas(firstState).lgas.map((l: string) => (
                                <option key={l} value={l}>{l}</option>
                            ));
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

    useEffect(() => {
        const fetchTemplate = async () => {
            setLoading(true);
            const data = await getFormTemplate(templateId);
            setTemplate(data);
            setLoading(false);
        };
        fetchTemplate();
    }, [templateId]);

    const evaluateCondition = (field: any) => {
        if (!field.conditionalVisibility?.enabled) return true;
        const depValue = formData[field.conditionalVisibility.dependsOn];
        return field.conditionalVisibility.values?.includes(depValue);
    };

    const validateSection = () => {
        const errors: Record<string, string> = {};
        if (!currentSection) return true;
        currentSection.fields.forEach((field: any) => {
            if (field.isRequired) {
                const val = formData[field.label];
                if (!val || (typeof val === 'string' && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
                    errors[field.label] = `${field.label} is required`;
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
                    <Card className="border-none shadow-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Review Your Application</CardTitle>
                            <p className="text-sm text-gray-500">This is what applicants will see before submitting.</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {sections.map((sec: any) => (
                                <div key={sec.id} className="border border-gray-200 rounded-xl p-4">
                                    <h3 className="font-bold text-gray-900 mb-3">{sec.title}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(sec.fields || []).map((field: any) => {
                                            if (!evaluateCondition(field)) return null;
                                            const val = formData[field.label];
                                            const displayVal = Array.isArray(val) ? val.join(', ') : val || '—';
                                            return (
                                                <div key={field.id} className="space-y-1">
                                                    <p className="text-xs text-gray-400 uppercase">{field.label}</p>
                                                    <p className="text-sm text-gray-700 font-medium">{displayVal}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            {submitted && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                    <p className="text-green-700 font-bold text-lg">Form submitted successfully!</p>
                                    <p className="text-green-600 text-sm mt-1">This simulates the post-submission confirmation.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
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
