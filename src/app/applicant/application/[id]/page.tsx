"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDeveloperSubscription } from "@/components/finance/DeveloperSubscriptionGate";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Loader2, Save, ArrowRight, ArrowLeft, CheckCircle2, Lock, CreditCard, CheckSquare, GraduationCap, Users, Printer, AlertCircle, Check
} from "lucide-react";
import { 
    getApplicantApplication, 
    saveApplicationDraft, 
    submitApplicationFinal, 
    processAdmissionPayment,
    verifyNinAction,
    getExaminationBodies,
    saveOLevelResultsAction,
    getTemplateProgrammes
} from "@/actions/admission_v2";
import OLevelSubmission from "@/components/forms/OLevelSubmission";
import PhotoCapture from "@/components/forms/PhotoCapture";
// @ts-expect-error - TS7016: Auto-suppressed for build
import naija from 'naija-state-local-government';
import { COUNTRY_NAMES } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function FieldError({ error }: { error?: string }) {
    if (!error) return null;
    return <p className="text-xs text-rose-600 font-medium px-1 mt-1">{error}</p>;
}

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
    // Instructions/mode selection is now handled upfront on the dedicated
    // /admission/[slug]/instructions page, so this in-wizard step is skipped by default.
    const [hasAcknowledgedInstructions, setHasAcknowledgedInstructions] = useState(true);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // NIN
    const [ninInput, setNinInput] = useState("");
    const [verifyingNin, setVerifyingNin] = useState(false);
    const [verifiedNinData, setVerifiedNinData] = useState<any>(null);

    // Payment
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [examBodies, setExamBodies] = useState<any[]>([]);
    const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());

    // Programme Selection
    const [templateProgrammes, setTemplateProgrammes] = useState<any[]>([]);
    const [selectedProgrammeId, setSelectedProgrammeId] = useState<number | null>(null);
    const [savingProgramme, setSavingProgramme] = useState(false);

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
            // Always compute locked name fields from user account data
            const locked = new Set<string>();
            const userNameParts = data._userNameParts;
            const labelLower = (s: string) => s?.toLowerCase().replace(/[-_\s]/g, '');
            data.template?.sections?.forEach((sec: any) => {
                sec.fields?.forEach((field: any) => {
                    const sk = (field.systemKey || '').toLowerCase();
                    const ll = labelLower(field.label);
                    if ((sk === 'firstname' || ll === 'firstname' || ll === 'firstname') && userNameParts?.firstName) {
                        locked.add(field.label);
                    } else if ((sk === 'lastname' || sk === 'surname' || ll === 'lastname' || ll === 'surname' || ll === 'lastname') && userNameParts?.surname) {
                        locked.add(field.label);
                    } else if ((sk === 'middlename' || ll === 'middlename' || ll === 'middlename') && userNameParts?.middleName) {
                        locked.add(field.label);
                    }
                });
            });
            setLockedFields(locked);
            if (data.data) {
                try {
                    const parsed = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
                    setFormData(parsed);
                    if (parsed.__ninData) setVerifiedNinData(parsed.__ninData);
                } catch (e) {
                    setFormData(data.data);
                }
            } else {
                // Pre-fill name fields from user account, then apply template defaults
                const defaults: any = {};
                data.template?.sections?.forEach((sec: any) => {
                    sec.fields?.forEach((field: any) => {
                        if (locked.has(field.label)) {
                            const userNameParts = data._userNameParts;
                            const sk = (field.systemKey || '').toLowerCase();
                            const ll = labelLower(field.label);
                            if (sk === 'firstname' || ll === 'firstname') {
                                defaults[field.label] = userNameParts.firstName;
                            } else if (sk === 'lastname' || sk === 'surname' || ll === 'lastname' || ll === 'surname') {
                                defaults[field.label] = userNameParts.surname;
                            } else if (sk === 'middlename' || ll === 'middlename') {
                                defaults[field.label] = userNameParts.middleName;
                            }
                        } else if (field.defaultValue) {
                            defaults[field.label] = field.defaultValue;
                        }
                    });
                });
                if (Object.keys(defaults).length > 0) {
                    setFormData(defaults);
                }
            }
            const bodies = await getExaminationBodies();
            setExamBodies(bodies);

            // Load linked programmes and pre-select if already assigned
            if (data.template?.id) {
                const progs = await getTemplateProgrammes(data.template.id);
                setTemplateProgrammes(progs);
            }
            if (data.programmeId) {
                setSelectedProgrammeId(data.programmeId);
            }
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

    const validateField = (field: any, value: any): string | null => {
        // Required validation
        if (field.isRequired && (!value || (typeof value === 'string' && value.trim() === ''))) {
            return `${field.label} is required`;
        }

        // Skip further validation if empty and not required
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return null;
        }

        // Parse validation rules
        let rules: any = {};
        try {
            rules = typeof field.validationRules === 'string' ? JSON.parse(field.validationRules) : (field.validationRules || {});
        } catch {
            return null;
        }

        const strValue = String(value);

        // Min length
        if (rules.minLength && strValue.length < rules.minLength) {
            return `${field.label} must be at least ${rules.minLength} characters`;
        }

        // Max length
        if (rules.maxLength && strValue.length > rules.maxLength) {
            return `${field.label} must be no more than ${rules.maxLength} characters`;
        }

        // Min value (for numbers)
        if (rules.min !== undefined && !isNaN(Number(value)) && Number(value) < rules.min) {
            return `${field.label} must be at least ${rules.min}`;
        }

        // Max value (for numbers)
        if (rules.max !== undefined && !isNaN(Number(value)) && Number(value) > rules.max) {
            return `${field.label} must be no more than ${rules.max}`;
        }

        // Pattern (regex)
        if (rules.pattern) {
            try {
                const regex = new RegExp(rules.pattern);
                if (!regex.test(strValue)) {
                    return rules.patternMessage || `${field.label} does not match the required format`;
                }
            } catch {
                // Invalid regex, skip
            }
        }

        // Email validation
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
            return `${field.label} must be a valid email address`;
        }

        // Phone validation
        if (field.type === 'phone' && !/^[\d\s\-+()]{7,20}$/.test(strValue)) {
            return `${field.label} must be a valid phone number`;
        }

        // URL validation
        if (field.type === 'url' && strValue && !/^https?:\/\/.+/.test(strValue)) {
            return `${field.label} must be a valid URL starting with http:// or https://`;
        }

        return null;
    };

    const validateCurrentSection = (): boolean => {
        if (!application?.template?.sections?.[currentStep]) return true;
        
        const section = application.template.sections[currentStep];
        const errors: Record<string, string> = {};

        for (const field of section.fields) {
            // Skip NIN field if verification is disabled
            if (field.systemKey === 'nin' && application?.ninVerificationMode === 'disabled') continue;
            
            const error = validateField(field, formData[field.label]);
            if (error) {
                errors[field.id] = error;
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

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
                default:
                    return true;
            }
        } catch {
            return true;
        }
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
            
            // Only overwrite the applicant's answers with NIN registry data if
            // the template's "Auto-fill from NIN" setting is enabled (default: on).
            if (application?.ninAutoFill !== false) {
                application.template.sections.forEach((sec: any) => {
                    sec.fields.forEach((f: any) => {
                        if (f.systemKey === 'firstName') updatedForm[f.label] = res.firstName;
                        if (f.systemKey === 'lastName') updatedForm[f.label] = res.lastName;
                        if (f.systemKey === 'dob') updatedForm[f.label] = res.dob;
                        if (f.systemKey === 'gender') updatedForm[f.label] = res.gender;
                    });
                });
            }

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
        
        // Validate current section
        if (!validateCurrentSection()) {
            toast.error("Please fix the validation errors before proceeding.");
            return;
        }
        
        const currentSection = application.template.sections[currentStep];
        if (currentSection) {
            const hasNinField = currentSection.fields.some((f: any) => f.systemKey === 'nin');
            const ninIsRequired = application?.ninRequired !== false;
            if (hasNinField && ninIsRequired && application?.ninVerificationMode !== 'disabled' && !verifiedNinData?.verified && !verifiedNinData?.firstName) {
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
            setValidationErrors({});
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

        if (eligibilityError) {
            toast.error("Please resolve eligibility issues before submitting.");
            return;
        }

        // Validate all sections
        const allErrors: Record<string, string> = {};
        for (const section of application.template.sections) {
            for (const field of section.fields) {
                if (field.systemKey === 'nin' && application?.ninVerificationMode === 'disabled') continue;
                const error = validateField(field, formData[field.label]);
                if (error) {
                    allErrors[field.id] = error;
                }
            }
        }
        
        if (Object.keys(allErrors).length > 0) {
            setValidationErrors(allErrors);
            toast.error("Please fix all validation errors before submitting.");
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
            setSubmitting(false);
        } else {
            // Application fee is paid or not required first.
            // Stage 2: Enforce Paystack processing fee sequentially
            triggerSubscriptionGate({
                identifier: applicationId.toString(),
                email: session!.user!.email!,
                type: 'admission_form',
                onSuccess: async () => {
                    // @ts-expect-error - TS2345: Auto-suppressed for build
                    const res = await submitApplicationFinal(applicationId, parseInt(session!.user!.id));
                    if (res.success) {
                        toast.success("Application submitted successfully!");
                        router.push("/applicant");
                    } else {
                        toast.error("Failed to submit");
                        setSubmitting(false);
                    }
                },
                onError: () => {
                    setSubmitting(false);
                }
            });
        }
    };

    const handlePayment = async () => {
        setPaymentProcessing(true);
        try {
            if (application.template.feeStructureId) {
                // Proceed directly to payment
                try {
                    const res = await processAdmissionPayment(applicationId, application.template.feeStructureId!, session!.user!.email, session!.user!.name || "Applicant");
                    if (res.success && res.checkoutUrl) {
                        window.location.href = res.checkoutUrl;
                    } else if (res.success && res.rrr) {
                        // Remita payment redirection — pass the applicant's real identity through
                        // so the inline checkout widget doesn't use dummy demo values
                        const amount = application.template.calculatedFee || parseFloat(application.template.applicationFee);
                        const nameParts = (session!.user!.name || "Applicant").trim().split(/\s+/);
                        const firstName = encodeURIComponent(nameParts[0] || "Applicant");
                        const lastName = encodeURIComponent(nameParts.slice(1).join(" ") || nameParts[0] || "Applicant");
                        const email = encodeURIComponent(session!.user!.email || "");
                        window.location.href = `/finance/checkout/simulate?gateway=remita&reference=${res.reference}&amount=${amount}&rrr=${res.rrr}&email=${email}&firstName=${firstName}&lastName=${lastName}`;
                    } else {
                        toast.error(res.error || "Failed to initialize payment gateway");
                        setPaymentProcessing(false);
                    }
                } catch (error) {
                    toast.error("Payment error.");
                    setPaymentProcessing(false);
                }
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

    const handleProcessingFee = () => {
        const processingFee = parseFloat(application?.template?.processingFee || "0");
        triggerSubscriptionGate({
            identifier: applicationId.toString(),
            email: session!.user!.email!,
            type: 'admission_form',
            customAmount: processingFee > 0 ? processingFee : undefined,
            onSuccess: async () => {
                toast.success("Processing fee paid successfully!");
                window.location.reload();
            }
        });
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#1a5b3a]" /></div>;
    if (!application) return <div>Application not found</div>;

    // Instructions Step (Always First)
    if (!hasAcknowledgedInstructions) {
        const minAge = application.template.minAge || 15;
        const isUnderage = formData.date_of_birth && calculateAge(formData.date_of_birth) < minAge;
        const applicantAge = formData.date_of_birth ? calculateAge(formData.date_of_birth) : null;

        return (
            <Card className="bg-white max-w-3xl mx-auto mt-8 p-10 space-y-8 rounded-[2rem] shadow-xl border-none">
                <div className="space-y-4 text-center">
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Application Instructions</h1>
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest">
                        {application.template.name}
                    </div>
                </div>

                {eligibilityError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{eligibilityError}</span>
                    </div>
                )}
                
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-slate-700 text-sm leading-relaxed space-y-4">
                    {application.template.description ? (
                        <div dangerouslySetInnerHTML={{ __html: application.template.description.replace(/\n/g, '<br/>') }} />
                    ) : (
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Please ensure all information provided is accurate and verifiable.</li>
                            <li>Upload required documents in the specified format and size limits.</li>
                            <li>Payment of the application fee is required to unlock the full form.</li>
                            <li>You must be at least <strong>{minAge} years old</strong> to apply for this programme.</li>
                            <li>You can save your progress at any time and return later.</li>
                        </ul>
                    )}
                </div>

                <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest">
                        Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.date_of_birth || ''}
                        onChange={(e) => {
                            const dob = e.target.value;
                            const age = calculateAge(dob);
                            setFormData((prev: any) => ({ ...prev, date_of_birth: dob }));
                            if (age < minAge) {
                                setEligibilityError(`Our system indicates you are ${age} years old. Minimum age required is ${minAge}. You are not eligible for this programme.`);
                            } else {
                                setEligibilityError(null);
                            }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-[#1a5b3a] transition-colors text-sm font-medium"
                        required
                    />
                    {applicantAge && applicantAge >= minAge && (
                        <p className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> You are {applicantAge} years old — eligible to apply
                        </p>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <Button 
                        onClick={() => {
                            if (!formData.date_of_birth) {
                                toast.error("Please enter your date of birth to continue.");
                                return;
                            }
                            if (calculateAge(formData.date_of_birth) < minAge) {
                                toast.error("You are not eligible for this programme due to age requirement.");
                                return;
                            }
                            setHasAcknowledgedInstructions(true);
                        }}
                        disabled={!!eligibilityError || !formData.date_of_birth}
                        className="w-full bg-[#1a5b3a] hover:bg-[#134229] text-white font-bold py-6 rounded-xl uppercase text-sm tracking-widest transition-all shadow-md disabled:opacity-50"
                    >
                        I understand, proceed to {application.template.flowType === 'payment_first' ? 'payment' : 'form'}
                    </Button>
                </div>
            </Card>
        );
    }

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
                    <span className="text-xl font-black text-[#1a5b3a]">₦{(application.template.calculatedFee || parseFloat(application.template.applicationFee)).toLocaleString()}</span>
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

    // Secondary Payment Wall: Processing Fee
    if (application.paymentStatus === 'paid' && !application.isProcessingFeePaid) {
        return (
            <Card className="bg-white border border-rose-200 max-w-2xl mx-auto mt-12 p-12 text-center space-y-8 rounded-[2rem] shadow-xl">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                    <Lock className="w-10 h-10 text-rose-600" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-gray-900 uppercase">Processing Fee Required</h2>
                    <p className="text-gray-500 font-medium uppercase text-sm leading-relaxed">
                        Your form fee was successful! To finalize your access to the application portal, please pay the mandatory processing fee via Paystack.
                    </p>
                </div>
                <Button 
                    onClick={handleProcessingFee} disabled={isGateLoading}
                    className="w-full bg-[#1a5b3a] hover:bg-[#134229] text-white font-bold py-8 rounded-2xl uppercase text-sm tracking-widest transition-all flex items-center justify-center gap-3"
                >
                    {isGateLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CreditCard className="w-5 h-5" /> Pay Processing Fee</>}
                </Button>
            </Card>
        );
    }

    // Programme Selection Step (after both fees paid)
    if (templateProgrammes.length > 0 && !selectedProgrammeId) {
        const handleSelectProgramme = async (progId: number) => {
            setSavingProgramme(true);
            try {
                const res = await fetch(`/api/applicant/application/${applicationId}/programme`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ programmeId: progId })
                });
                const data = await res.json();
                if (data.success) {
                    setSelectedProgrammeId(progId);
                    toast.success("Programme selected!");
                    window.location.reload();
                } else {
                    toast.error(data.error || "Failed to save programme selection");
                }
            } catch {
                toast.error("Failed to save programme selection");
            }
            setSavingProgramme(false);
        };

        return (
            <Card className="bg-white max-w-2xl mx-auto mt-12 p-12 text-center space-y-8 rounded-[2rem] shadow-xl border border-indigo-100">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                    <GraduationCap className="w-10 h-10 text-indigo-600" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-gray-900 uppercase">Select Programme</h2>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed">
                        Choose the programme you wish to apply for.
                    </p>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {templateProgrammes.map((prog: any) => (
                        <div
                            key={prog.id}
                            onClick={() => !savingProgramme && handleSelectProgramme(prog.id)}
                            className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all text-left flex items-center gap-4"
                        >
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                                <GraduationCap className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{prog.name}</p>
                                <p className="text-xs text-gray-500">{prog.code || ''} {prog.durationYears ? `(${prog.durationYears} yrs)` : ''}</p>
                            </div>
                        </div>
                    ))}
                </div>
                {savingProgramme && <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />}
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
                <div className="flex gap-4">
                    <Button onClick={() => router.push(`/applicant/application/${applicationId}/slip`)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-xl uppercase font-bold text-xs tracking-widest shadow-xl">
                        <Printer className="w-4 h-4 mr-2" /> Print Slip
                    </Button>
                    <Button onClick={() => router.push('/applicant')} variant="outline" className="flex-1 bg-white border-gray-300 text-gray-800 hover:bg-gray-50 py-6 rounded-xl uppercase font-bold text-xs tracking-widest">
                        Return to Dashboard
                    </Button>
                </div>
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
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#1a5b3a]">{application.template.level}</span>
                        {application.applicationMode && (
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border",
                                application.applicationMode === 'full_time'
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                            )}>
                                {application.applicationMode === 'full_time' ? 'Full-Time' : 'Part-Time'}
                                {application.jambRegNumber ? ` · JAMB: ${application.jambRegNumber}` : ''}
                            </span>
                        )}
                    </div>
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
                                    // Check conditional logic
                                    if (!evaluateCondition(field)) return null;

                                    const isNameLocked = lockedFields.has(field.label);
                                    const isSystemLocked = isNameLocked || (application?.ninVerificationMode !== 'disabled' && application?.ninAutoFill !== false && verifiedNinData && (
                                        field.systemKey === 'firstName' || field.systemKey === 'lastName' ||
                                        field.systemKey === 'dob' || field.systemKey === 'gender'
                                    ));

                                    const displayValue = isSystemLocked
                                        ? (field.systemKey === 'firstName' ? verifiedNinData.firstName :
                                           field.systemKey === 'lastName' ? verifiedNinData.lastName :
                                           field.systemKey === 'dob' ? verifiedNinData.dob :
                                           field.systemKey === 'gender' ? verifiedNinData.gender : "")
                                        : (formData[field.label] || "");

                                    if (field.systemKey === 'nin' && application?.ninVerificationMode !== 'disabled') {
                                        const ninIsRequired = application?.ninRequired !== false;
                                        return (
                                            <div key={field.id} className="space-y-4 col-span-1 md:col-span-2 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                                    <div className="flex-1 space-y-2">
                                                        <label className="text-xs font-bold text-gray-700 px-1">
                                                            {field.label} {ninIsRequired ? <span className="text-rose-500">*</span> : <span className="text-gray-400 normal-case">(Optional)</span>}
                                                        </label>
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
                                                {!ninIsRequired && !verifiedNinData?.firstName && (
                                                    <p className="text-[11px] text-gray-500">NIN verification is optional for this form — you may skip this and continue.</p>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={field.id} className={cn("space-y-2", field.width === 'half' ? "col-span-1" : "col-span-1 md:col-span-2")}>
                                            <label className="text-xs font-bold text-gray-700 px-1 flex items-center gap-1.5">
                                                {field.label} {field.isRequired && <span className="text-rose-500">*</span>}
                                                {isNameLocked && <Lock className="w-3 h-3 text-gray-400" />}
                                            </label>
                                            {field.helpText && (
                                                <p className="text-[11px] text-gray-500 px-1">{field.helpText}</p>
                                            )}
                                            
                                            {field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number' || field.type === 'date' || field.type === 'time' || field.type === 'url' ? (
                                                <>
                                                    <input 
                                                        type={field.type} readOnly={isSystemLocked}
                                                        className={cn(
                                                            "w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all",
                                                            isSystemLocked && "opacity-60 bg-gray-50 cursor-not-allowed",
                                                            validationErrors[field.id] && "border-rose-300 focus:ring-rose-500"
                                                        )}
                                                        placeholder={field.placeholder} required={field.isRequired && !isSystemLocked}
                                                        value={displayValue} onChange={(e) => handleInputChange(field.label, e.target.value, field.systemKey)}
                                                    />
                                                    <FieldError error={validationErrors[field.id]} />
                                                </>
                                            ) : field.type === 'select' ? (
                                                <>
                                                    <select 
                                                        disabled={isSystemLocked}
                                                        className={cn(
                                                            "w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 appearance-none focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all",
                                                            isSystemLocked && "opacity-60 bg-gray-50 cursor-not-allowed",
                                                            validationErrors[field.id] && "border-rose-300 focus:ring-rose-500"
                                                        )}
                                                        required={field.isRequired && !isSystemLocked} value={displayValue}
                                                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                    >
                                                        <option value="">Select...</option>
                                                        {field.options?.split(',').map((opt: string) => (
                                                            <option key={opt} value={opt.trim()}>{opt.trim()}</option>
                                                        ))}
                                                    </select>
                                                    <FieldError error={validationErrors[field.id]} />
                                                </>
                                            ) : field.type === 'gender' ? (
                                                <select
                                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 appearance-none focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all"
                                                    required={field.isRequired}
                                                    value={displayValue || ""}
                                                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                >
                                                    <option value="">Select Sex...</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            ) : field.type === 'blood_group' ? (
                                                <select
                                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 appearance-none focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all"
                                                    required={field.isRequired}
                                                    value={displayValue || ""}
                                                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                >
                                                    <option value="">Select Blood Group...</option>
                                                    {(field.options || "A+, A-, B+, B-, AB+, AB-, O+, O-").split(/[,\n]/).map((o: string) => o.trim()).filter(Boolean).map((opt: string) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : field.type === 'phenotype' ? (
                                                <select
                                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 appearance-none focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all"
                                                    required={field.isRequired}
                                                    value={displayValue || ""}
                                                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                >
                                                    <option value="">Select Phenotype...</option>
                                                    {(field.options || "AA, AS, AC, SS, SC, CC").split(/[,\n]/).map((o: string) => o.trim()).filter(Boolean).map((opt: string) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : field.type === 'nationality' ? (
                                                <select 
                                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 appearance-none focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all"
                                                    required={field.isRequired} 
                                                    value={displayValue || ""}
                                                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                >
                                                    <option value="">Select Nationality...</option>
                                                    {COUNTRY_NAMES.map((country) => (
                                                        <option key={country} value={country}>{country}</option>
                                                    ))}
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
                                            ) : field.type === 'image' ? (
                                                <div className="md:col-span-2">
                                                    {field.options && (
                                                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                                                            <img
                                                                src={field.options}
                                                                alt={field.label}
                                                                className="max-w-full h-auto max-h-64 rounded-lg object-contain mx-auto"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : field.type === 'olevel_result' ? (
                                                <div className="md:col-span-2">
                                                    <OLevelSubmission 
                                                        value={formData[field.label] || []}
                                                        onChange={(val) => handleInputChange(field.label, val)}
                                                        examBodies={examBodies}
                                                    />
                                                </div>
                                            ) : field.type === 'file' ? (
                                                <div className="md:col-span-2">
                                                    <PhotoCapture 
                                                        value={formData[field.label] || ""}
                                                        onChange={(val) => handleInputChange(field.label, val)}
                                                        label={field.label}
                                                    />
                                                </div>
                                            ) : field.type === 'textarea' ? (
                                                <>
                                                    <textarea 
                                                        className={cn(
                                                            "w-full bg-white border border-gray-300 rounded-xl px-4 py-3 font-medium text-gray-900 min-h-[100px] focus:ring-2 focus:ring-[#1a5b3a] focus:border-transparent outline-none transition-all",
                                                            validationErrors[field.id] && "border-rose-300 focus:ring-rose-500"
                                                        )}
                                                        placeholder={field.placeholder} required={field.isRequired && !isSystemLocked} readOnly={isSystemLocked}
                                                        value={formData[field.label] || ""} onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                    />
                                                    <FieldError error={validationErrors[field.id]} />
                                                </>
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
                            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl mb-6">
                                <div className="flex items-center gap-3 text-blue-700 mb-4">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <h4 className="font-black text-lg">Review Your Application</h4>
                                </div>
                                <p className="text-sm text-blue-600">Please review all your information before submitting. Click on any section to make changes.</p>
                            </div>

                            {application.template.sections.map((section: any, sectionIndex: number) => (
                                <div key={section.id} className="bg-[#f8fbf9] border border-green-100 p-6 rounded-2xl mb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3 text-[#1a5b3a]">
                                            <div className="w-8 h-8 bg-[#1a5b3a] text-white rounded-full flex items-center justify-center text-sm font-black">
                                                {sectionIndex + 1}
                                            </div>
                                            <h4 className="font-black text-lg">{section.title}</h4>
                                        </div>
                                        <Button 
                                            type="button"
                                            onClick={() => setCurrentStep(sectionIndex)}
                                            variant="ghost" 
                                            className="text-[#1a5b3a] hover:bg-green-50 text-xs font-bold uppercase"
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        {section.fields.map((field: any) => {
                                            // Skip conditional fields that shouldn't show
                                            if (!evaluateCondition(field)) return null;
                                            
                                            const value = formData[field.label];
                                            const displayValue = Array.isArray(value) ? value.join(', ') 
                                                : field.type === 'checkbox' ? (value ? 'Yes' : 'No')
                                                : field.type === 'olevel_result' ? null
                                                : field.type === 'file' ? (value ? 'Uploaded' : 'Not uploaded')
                                                : value || 'N/A';

                                            if (field.type === 'olevel_result') {
                                                if (Array.isArray(value) && value.length > 0) {
                                                    return (
                                                        <div key={field.id} className="md:col-span-2 space-y-3">
                                                            <span className="text-xs font-bold text-gray-500 uppercase">{field.label}</span>
                                                            {value.map((sitting: any, sIdx: number) => (
                                                                <div key={sIdx} className="bg-gray-50 rounded-xl p-4 space-y-2">
                                                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                                                                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px]">{sIdx + 1}</span>
                                                                        <span>{sitting.examBodyId ? examBodies.find((b: any) => b.id.toString() === sitting.examBodyId.toString())?.name || 'N/A' : 'N/A'}</span>
                                                                        <span>|</span>
                                                                        <span>{sitting.examYear || 'N/A'}</span>
                                                                        <span>|</span>
                                                                        <span>Reg: {sitting.examNumber || 'N/A'}</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                                                                        {(sitting.subjects || []).filter((s: any) => s.subjectName).map((sub: any, subIdx: number) => (
                                                                            <div key={subIdx} className="flex items-center gap-2 text-[11px]">
                                                                                <span className="font-semibold text-gray-700">{sub.subjectName}</span>
                                                                                <span className="font-black text-indigo-600">{sub.grade}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={field.id} className="md:col-span-2 flex flex-col">
                                                        <span className="text-xs font-bold text-gray-500 uppercase">{field.label}</span>
                                                        <span className="text-gray-400 italic text-sm">Not submitted</span>
                                                    </div>
                                                );
                                            }

                                            if (field.type === 'image') {
                                                return null;
                                            }
                                            
                                            return (
                                                <div key={field.id} className={field.type === 'olevel_result' ? "" : "flex flex-col"}>
                                                    {field.type === 'olevel_result' ? null : (
                                                        <>
                                                            <span className="text-xs font-bold text-gray-500 uppercase">{field.label}</span>
                                                            <span className="text-gray-800 font-medium">{displayValue}</span>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

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
                                onClick={handleSubmitFinal} disabled={submitting || !confirmed || paymentProcessing || isGateLoading || !!eligibilityError}
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
