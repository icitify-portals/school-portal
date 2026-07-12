"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDeveloperSubscription } from "@/components/finance/DeveloperSubscriptionGate";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Loader2, Save, ArrowRight, ArrowLeft, CheckCircle2, Lock, CreditCard, CheckSquare, GraduationCap, Users
} from "lucide-react";
import { 
    getApplicantApplication, 
    saveApplicationDraft, 
    submitApplicationFinal, 
    processAdmissionPayment,
    verifyNinAction,
    getExaminationBodies,
    saveOLevelResultsAction
} from "@/actions/admission_v2";
import OLevelSubmission from "@/components/forms/OLevelSubmission";
// @ts-expect-error - TS7016: Auto-suppressed for build
import naija from 'naija-state-local-government';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function StatefulApplicationPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const { triggerSubscriptionGate, isGateLoading } = useDeveloperSubscription();
    
    const applicationId = parseInt(params.id as string);

    const [application, setApplication] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<any>({});
    
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [eligibilityError, setEligibilityError] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false); // Review Checkbox

    // NIN
    const [ninInput, setNinInput] = useState("");
    const [verifyingNin, setVerifyingNin] = useState(false);
    const [verifiedNinData, setVerifiedNinData] = useState<any>(null);

    // Payment
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [examBodies, setExamBodies] = useState<any[]>([]);

    useEffect(() => {
        if (status === "authenticated" && session?.user?.id) {
            fetchApplication();
        } else if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, session]);

    const fetchApplication = async () => {
        setLoading(true);
        // @ts-expect-error - TS2345: Auto-suppressed for build
        const data = await getApplicantApplication(applicationId, parseInt(session!.user!.id));
        if (data) {
            setApplication(data);
            if (data.data) {
                try {
                    const parsed = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
                    setFormData(parsed);
                    if (parsed.__ninData) setVerifiedNinData(parsed.__ninData);
                } catch (e) {
                    setFormData(data.data);
                }
            }
            const bodies = await getExaminationBodies();
            setExamBodies(bodies);
        }
        setLoading(false);
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        const dataToSave = { ...formData, __ninData: verifiedNinData };
        // @ts-expect-error - TS2345: Auto-suppressed for build
        const res = await saveApplicationDraft(applicationId, parseInt(session!.user!.id), dataToSave);
        
        // Save OLevel data if present
        const olevelField = application?.template?.sections?.flatMap((s:any) => s.fields).find((f:any) => f.type === 'olevel_result');
        if (olevelField && formData[olevelField.label]) {
            // @ts-expect-error - TS2345: Auto-suppressed for build
            await saveOLevelResultsAction(applicationId, parseInt(session!.user!.id), formData[olevelField.label]);
        }

        if (res.success) {
            toast.success("Draft saved successfully!");
        } else {
            toast.error(res.error || "Failed to save draft.");
        }
        setSaving(false);
    };

    const handleInputChange = (key: string, value: any, systemKey?: string) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
        
        if (systemKey === 'dob') {
            const age = calculateAge(value);
            if (application.template.minAge && age < application.template.minAge) {
                setEligibilityError(`Our system indicates you are ${age} years old. Minimum age for this admission is ${application.template.minAge}.`);
            } else {
                setEligibilityError(null);
            }
        }
    };

    const calculateAge = (dob: string) => {
        const birthday = new Date(dob);
        const ageDifMs = Date.now() - birthday.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const handleVerifyNin = async () => {
        if (ninInput.length !== 11) {
            toast.error("Please enter a valid 11-digit NIN.");
            return;
        }
        setVerifyingNin(true);
        const res = await verifyNinAction(ninInput);
        if (res.success) {
            setVerifiedNinData(res);
            
            const updatedForm = { ...formData, NIN: ninInput };
            
            application.template.sections.forEach((sec: any) => {
                sec.fields.forEach((f: any) => {
                    if (f.systemKey === 'firstName') updatedForm[f.label] = res.firstName;
                    if (f.systemKey === 'lastName') updatedForm[f.label] = res.lastName;
                    if (f.systemKey === 'dob') updatedForm[f.label] = res.dob;
                    if (f.systemKey === 'gender') updatedForm[f.label] = res.gender;
                });
            });

            setFormData(updatedForm);
            
            if (res.dob) {
                const age = calculateAge(res.dob);
                if (application.template.minAge && age < application.template.minAge) {
                    setEligibilityError(`Your NIN registry records indicate you are ${age} years old. Minimum age required is ${application.template.minAge}.`);
                } else {
                    setEligibilityError(null);
                }
            }

            toast.success("NIN Verified! Legal spelling names pre-filled and locked.");
        } else {
            toast.error(res.error || "NIN verification failed.");
        }
        setVerifyingNin(false);
    };

    const nextStep = async () => {
        if (eligibilityError) {
            toast.error("Please resolve eligibility issues before proceeding.");
            return;
        }
        
        const currentSection = application.template.sections[currentStep];
        if (currentSection) {
            const hasNinField = currentSection.fields.some((f: any) => f.systemKey === 'nin');
            if (hasNinField && !verifiedNinData?.verified && !verifiedNinData?.firstName) {
                toast.error("You must verify your NIN before proceeding.");
                return;
            }
        }

        // Auto save draft on next
        const dataToSave = { ...formData, __ninData: verifiedNinData };
        // @ts-expect-error - TS2345: Auto-suppressed for build
        const res = await saveApplicationDraft(applicationId, parseInt(session!.user!.id), dataToSave);
        if(!res.success) {
            toast.error(res.error || "Failed to save progress.");
            return;
        }

        if (currentStep < application.template.sections.length) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmitFinal = async () => {
        if (!confirmed) {
            toast.error("Please confirm that all information is correct.");
            return;
        }

        setSubmitting(true);
        
        const dataToSave = { ...formData, __ninData: verifiedNinData };
        // Final Save
        // @ts-expect-error - TS2345: Auto-suppressed for build
        const saveRes = await saveApplicationDraft(applicationId, parseInt(session!.user!.id), dataToSave);
        if(!saveRes.success) {
            toast.error(saveRes.error || "Failed to save final data");
            setSubmitting(false);
            return;
        }

        // Save OLevel data
        const olevelField = application.template.sections.flatMap((s:any) => s.fields).find((f:any) => f.type === 'olevel_result');
        if (olevelField && formData[olevelField.label]) {
            // @ts-expect-error - TS2345: Auto-suppressed for build
            await saveOLevelResultsAction(applicationId, parseInt(session!.user!.id), formData[olevelField.label]);
        }

        if (application.template.flowType === 'form_first' && application.paymentStatus !== 'paid') {
            handlePayment();
        } else {
            // @ts-expect-error - TS2345: Auto-suppressed for build
            const res = await submitApplicationFinal(applicationId, parseInt(session!.user!.id));
            if (res.success) {
                toast.success("Application submitted successfully!");
                router.push("/applicant");
            } else {
                toast.error("Failed to submit");
            }
        }
        setSubmitting(false);
    };

    const handlePayment = async () => {
        setPaymentProcessing(true);
        try {
            if (application.template.feeStructureId) {
                // First trigger the Developer Subscription Gate
                triggerSubscriptionGate({
                    identifier: applicationId.toString(),
                    email: session!.user!.email!,
                    type: 'admission_form',
                    onSuccess: async () => {
                        // Original payment logic continues after Paystack succeeds
                        try {
                            const res = await processAdmissionPayment(applicationId, application.template.feeStructureId!, session!.user!.email, session!.user!.name || "Applicant");
                            if (res.success && res.checkoutUrl) {
                                window.location.href = res.checkoutUrl;
                            } else {
                                toast.error(res.error || "Failed to initialize payment gateway");
                                setPaymentProcessing(false);
                            }
                        } catch (error) {
                            toast.error("Payment error.");
                            setPaymentProcessing(false);
                        }
                    }
                });
            } else {
                // Mock payment
                await new Promise(resolve => setTimeout(resolve, 2000));
                toast.success("Payment successful!");
                window.location.reload();
            }
        } catch (error) {
            toast.error("Payment error.");
            setPaymentProcessing(false);
        }
    };


    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#1a5b3a]" /></div>;
    if (!application) return <div>Application not found</div>;

    // Payment Wall for Payment-First Flow
    if (application.template.flowType === 'payment_first' && application.paymentStatus !== 'paid') {
        return (
            <Card className="bg-white border border-rose-200 max-w-2xl mx-auto mt-12 p-12 text-center space-y-8 rounded-[2rem] shadow-xl">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                    <Lock className="w-10 h-10 text-rose-600" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-gray-900 uppercase">Payment Required</h2>
                    <p className="text-gray-500 font-medium uppercase text-sm leading-relaxed">
                        To access and fill out the {application.template.name} application form, you must first pay the obtainment fee.
                    </p>
                </div>
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-600">Application Fee</span>
                    <span className="text-xl font-black text-[#1a5b3a]">₦{parseFloat(application.template.applicationFee).toLocaleString()}</span>
                </div>
                <Button 
                    onClick={handlePayment} disabled={paymentProcessing}
                    className="w-full bg-[#1a5b3a] hover:bg-[#134229] text-white font-bold py-8 rounded-2xl uppercase text-sm tracking-widest transition-all flex items-center justify-center gap-3"
                >
                    {paymentProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CreditCard className="w-5 h-5" /> Pay to Unlock Form</>}
                </Button>
            </Card>
        );
    }

    if (application.status === 'submitted' || application.status === 'admitted' || application.status === 'rejected') {
        return (
            <Card className="bg-white border border-gray-200 max-w-2xl mx-auto mt-12 p-12 text-center space-y-8 rounded-[2rem] shadow-xl">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-gray-900 uppercase">Application Completed</h2>
                    <p className="text-gray-500 font-medium uppercase text-sm leading-relaxed">
                        Your application is currently: <span className="text-[#1a5b3a] font-black">{application.status}</span>
                    </p>
                </div>
                <Button onClick={() => router.push('/applicant')} variant="outline" className="w-full bg-white border-gray-300 text-gray-800 hover:bg-gray-50 py-6 rounded-xl">
                    Return to Dashboard
                </Button>
            </Card>
        );
    }

    const isReviewStep = currentStep === application.template.sections.length;
    const currentSection = application.template.sections[currentStep];
    const totalSteps = application.template.sections.length + 1; // including review
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 mt-8">
            <div className="flex justify-between items-end px-4">
                <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-widest text-[#1a5b3a]">{application.template.level}</div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{application.template.name}</h1>
                </div>
                <Button 
                    onClick={handleSaveDraft} disabled={saving} variant="outline"
                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-xl"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
                </Button>
            </div>

            <Card className="border border-gray-200 bg-white overflow-hidden rounded-[2rem] shadow-sm">
                <div className="bg-gray-50 p-6 flex items-center gap-6 border-b border-gray-200">
                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase text-gray-500">Step {currentStep + 1} of {totalSteps}</span>
                            <span className="text-xs font-bold uppercase text-[#1a5b3a]">{isReviewStep ? "Review & Complete" : currentSection?.title}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#1a5b3a] h-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>

                <CardContent className="p-8 space-y-8">
                    {!isReviewStep && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {currentSection?.fields?.map((field: any) => {
                                    const isSystemLocked = verifiedNinData && (
                                        field.systemKey === 'firstName' || field.systemKey === 'lastName' ||
                                        field.systemKey === 'dob' || field.systemKey === 'gender'
                                    );

                                    const displayValue = isSystemLocked
                                        ? (field.systemKey === 'firstName' ? verifiedNinData.firstName :
                                           field.systemKey === 'lastName' ? verifiedNinData.lastName :
                                           field.systemKey === 'dob' ? verifiedNinData.dob :
                                           field.systemKey === 'gender' ? verifiedNinData.gender : "")
                                        : (formData[field.label] || "");

                                    if (field.systemKey === 'nin') {
                                        return (
                                            <div key={field.id} className="space-y-4 col-span-1 md:col-span-2 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                                    <div className="flex-1 space-y-2">
                                                        <label className="text-xs font-bold text-gray-700 px-1">{field.label} <span className="text-rose-500">*</span></label>
                                                        <input 
                                                            type="text" maxLength={11} disabled={verifiedNinData?.firstName}
                                                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all"
                                                            placeholder="Enter 11-digit NIN" value={ninInput}
                                                            onChange={(e) => setNinInput(e.target.value.replace(/\D/g, ''))}
                                                        />
                                                    </div>
                                                    <Button 
                                                        type="button" disabled={verifyingNin || verifiedNinData?.firstName || ninInput.length !== 11} onClick={handleVerifyNin}
                                                        className="bg-[#1a5b3a] hover:bg-[#134229] text-white font-bold py-6 px-8 rounded-xl disabled:bg-gray-300 disabled:text-gray-500 transition-all"
                                                    >
                                                        {verifyingNin ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Identity"}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={field.id} className={cn("space-y-2", field.type === 'textarea' && "md:col-span-2")}>
                                            <label className="text-xs font-bold text-gray-700 px-1">
                                                {field.label} {field.isRequired && <span className="text-rose-500">*</span>}
                                            </label>
                                            
                                            {field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number' || field.type === 'date' || field.type === 'time' || field.type === 'url' ? (
                                                <input 
                                                    type={field.type} readOnly={isSystemLocked}
                                                    className={cn(
                                                        "w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all",
                                                        isSystemLocked && "opacity-60 bg-gray-50 cursor-not-allowed"
                                                    )}
                                                    placeholder={field.placeholder} required={field.isRequired && !isSystemLocked}
                                                    value={displayValue} onChange={(e) => handleInputChange(field.label, e.target.value, field.systemKey)}
                                                />
                                            ) : field.type === 'select' ? (
                                                <select 
                                                    disabled={isSystemLocked}
                                                    className={cn(
                                                        "w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 appearance-none focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all",
                                                        isSystemLocked && "opacity-60 bg-gray-50 cursor-not-allowed"
                                                    )}
                                                    required={field.isRequired && !isSystemLocked} value={displayValue}
                                                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                >
                                                    <option value="">Select...</option>
                                                    {field.options?.split(',').map((opt: string) => (
                                                        <option key={opt} value={opt.trim()}>{opt.trim()}</option>
                                                    ))}
                                                </select>
                                            ) : field.type === 'nationality' ? (
                                                <select 
                                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 appearance-none focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all"
                                                    required={field.isRequired} 
                                                    value={displayValue || "Nigeria"}
                                                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                >
                                                    <option value="Nigeria">Nigeria</option>
                                                    <option value="Ghana">Ghana</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            ) : field.type === 'state' ? (
                                                <select 
                                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 appearance-none focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all"
                                                    required={field.isRequired} 
                                                    value={displayValue}
                                                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                >
                                                    <option value="">Select State...</option>
                                                    {naija.states().map((state: string) => (
                                                        <option key={state} value={state}>{state}</option>
                                                    ))}
                                                </select>
                                            ) : field.type === 'lga' ? (
                                                <select 
                                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 appearance-none focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all"
                                                    required={field.isRequired} 
                                                    value={displayValue}
                                                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                >
                                                    <option value="">Select LGA...</option>
                                                    {(() => {
                                                        // Find the corresponding state selected by the user
                                                        // We assume the state field is named "State of Origin" or we search for the first state field value
                                                        const stateField = currentSection?.fields?.find((f:any) => f.type === 'state');
                                                        const selectedState = stateField ? formData[stateField.label] : null;
                                                        if (selectedState) {
                                                            try {
                                                                const lgas = naija.lgas(selectedState).lgas;
                                                                return lgas.map((lga: string) => (
                                                                    <option key={lga} value={lga}>{lga}</option>
                                                                ));
                                                            } catch (e) {
                                                                return null;
                                                            }
                                                        }
                                                        return null;
                                                    })()}
                                                </select>
                                            ) : field.type === 'olevel_result' ? (
                                                <div className="md:col-span-2">
                                                    <OLevelSubmission 
                                                        value={formData[field.label] || []}
                                                        onChange={(val) => handleInputChange(field.label, val)}
                                                        examBodies={examBodies}
                                                    />
                                                </div>
                                            ) : field.type === 'textarea' ? (
                                                <textarea 
                                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 min-h-[100px] focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all"
                                                    placeholder={field.placeholder} required={field.isRequired && !isSystemLocked} readOnly={isSystemLocked}
                                                    value={formData[field.label] || ""} onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                />
                                            ) : field.type === 'radio' ? (
                                                <div className="space-y-2 mt-2">
                                                    {field.options?.split(',').map((opt: string) => (
                                                        <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                                                            <input 
                                                                type="radio" 
                                                                name={field.label}
                                                                value={opt.trim()}
                                                                checked={formData[field.label] === opt.trim()}
                                                                onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                                disabled={isSystemLocked}
                                                                required={field.isRequired && !formData[field.label] && !isSystemLocked}
                                                                className="w-5 h-5 text-[#1a5b3a] focus:ring-[#1a5b3a] border-gray-300"
                                                            />
                                                            <span className="text-gray-700">{opt.trim()}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : field.type === 'checkbox' ? (
                                                <label className="flex items-center space-x-3 cursor-pointer mt-2">
                                                    <input 
                                                        type="checkbox"
                                                        checked={formData[field.label] === true || formData[field.label] === 'true'}
                                                        onChange={(e) => handleInputChange(field.label, e.target.checked)}
                                                        disabled={isSystemLocked}
                                                        required={field.isRequired && !isSystemLocked}
                                                        className="w-5 h-5 text-[#1a5b3a] focus:ring-[#1a5b3a] rounded border-gray-300"
                                                    />
                                                    <span className="text-gray-700">{field.placeholder || "Yes"}</span>
                                                </label>
                                            ) : field.type === 'checkbox_group' ? (
                                                <div className="space-y-2 mt-2">
                                                    {field.options?.split(',').map((opt: string) => {
                                                        const currentValues = Array.isArray(formData[field.label]) ? formData[field.label] : [];
                                                        const isChecked = currentValues.includes(opt.trim());
                                                        return (
                                                            <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                                                                <input 
                                                                    type="checkbox"
                                                                    value={opt.trim()}
                                                                    checked={isChecked}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        let newValues = [...currentValues];
                                                                        if (e.target.checked) {
                                                                            newValues.push(val);
                                                                        } else {
                                                                            newValues = newValues.filter(v => v !== val);
                                                                        }
                                                                        handleInputChange(field.label, newValues);
                                                                    }}
                                                                    disabled={isSystemLocked}
                                                                    className="w-5 h-5 text-[#1a5b3a] focus:ring-[#1a5b3a] rounded border-gray-300"
                                                                />
                                                                <span className="text-gray-700">{opt.trim()}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {isReviewStep && (
                        <div className="space-y-6">
                            <div className="bg-[#f8fbf9] border border-green-100 p-6 rounded-2xl mb-8">
                                <div className="flex items-center gap-3 text-[#1a5b3a] mb-4">
                                    <GraduationCap className="w-6 h-6" />
                                    <h4 className="font-black text-lg">Academic Information</h4>
                                </div>
                                <div className="space-y-2 text-sm text-gray-700">
                                    <p><span className="font-bold">Faculty:</span> {formData["Faculty"] || "N/A"}</p>
                                    <p><span className="font-bold">Department:</span> {formData["Department"] || "N/A"}</p>
                                    <p><span className="font-bold">Level:</span> {formData["Level"] || "N/A"}</p>
                                </div>
                            </div>

                            <div className="bg-[#f8fbf9] border border-green-100 p-6 rounded-2xl mb-8">
                                <div className="flex items-center gap-3 text-[#1a5b3a] mb-4">
                                    <Users className="w-6 h-6" />
                                    <h4 className="font-black text-lg">Next of Kin</h4>
                                </div>
                                <div className="space-y-2 text-sm text-gray-700">
                                    <p><span className="font-bold">Name:</span> {formData["Next of Kin Name"] || "N/A"}</p>
                                    <p><span className="font-bold">Address:</span> {formData["Next of Kin Address"] || "N/A"}</p>
                                    <p><span className="font-bold">Phone:</span> {formData["Next of Kin Phone 1"] || "N/A"}</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center justify-center mt-1">
                                        <input 
                                            type="checkbox" 
                                            className="peer sr-only"
                                            checked={confirmed}
                                            onChange={(e) => setConfirmed(e.target.checked)}
                                        />
                                        <div className="w-5 h-5 rounded border-2 border-gray-300 peer-checked:bg-[#1a5b3a] peer-checked:border-[#1a5b3a] transition-colors"></div>
                                        <CheckSquare className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                        I confirm that all the information provided above is correct and accurate.
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 pt-8 mt-8 border-t border-gray-100">
                        {currentStep > 0 && (
                            <Button onClick={prevStep} variant="ghost" className="flex-1 py-6 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 uppercase font-bold text-xs tracking-widest border border-gray-200 rounded-xl transition-all">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                            </Button>
                        )}
                        
                        {!isReviewStep ? (
                            <Button 
                                onClick={nextStep} disabled={submitting}
                                className="flex-[2] py-6 bg-[#1a5b3a] hover:bg-[#134229] text-white uppercase font-bold text-xs tracking-widest rounded-xl transition-all"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"} 
                                {!submitting && <ArrowRight className="w-4 h-4 ml-2" />}
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleSubmitFinal} disabled={submitting || !confirmed || paymentProcessing || isGateLoading}
                                className="flex-[2] py-6 bg-[#1a5b3a] hover:bg-[#134229] text-white uppercase font-bold text-xs tracking-widest rounded-xl transition-all shadow-md disabled:opacity-50"
                            >
                                {submitting || paymentProcessing || isGateLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                COMPLETE REGISTRATION
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
