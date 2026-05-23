"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    CheckCircle2, 
    ArrowRight, 
    ArrowLeft, 
    User, 
    ShieldCheck, 
    HeartPulse, 
    Camera,
    AlertTriangle,
    Loader2,
    Check
} from "lucide-react";
import { getPublicFormTemplate, submitAdmissionApplication } from "@/actions/admission_v2";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PublicAdmissionPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<any>({});
    const [photo, setPhoto] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [eligibilityError, setEligibilityError] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplate();
    }, [slug]);

    const fetchTemplate = async () => {
        setLoading(true);
        const data = await getPublicFormTemplate(slug);
        if (data) {
            setTemplate(data);
        }
        setLoading(false);
    };

    const handleInputChange = (key: string, value: any, systemKey?: string) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
        
        if (systemKey === 'dob') {
            const age = calculateAge(value);
            if (template.minAge && age < template.minAge) {
                setEligibilityError(`Our system indicates you are ${age} years old. Minimum age for this admission is ${template.minAge}.`);
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

    const nextStep = () => {
        if (eligibilityError) {
            toast.error("Please resolve eligibility issues before proceeding.");
            return;
        }
        if (currentStep < template.sections.length - 1) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        } else {
            handleSubmit();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        
        const dobField = template.sections.flatMap((s: any) => s.fields).find((f: any) => f.systemKey === 'dob');
        const age = dobField ? calculateAge(formData[dobField.label]) : null;

        const res = await submitAdmissionApplication({
            templateId: template.id,
            formData,
            applicantPhoto: photo,
            ageAtAdmission: age
        });

        if (res.success) {
            setSubmitted(true);
            toast.success("Application submitted successfully!");
        } else {
            toast.error(res.error || "Failed to submit application");
        }
        setSubmitting(false);
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (!template) return <div className="min-h-screen flex justify-center items-center font-black text-2xl italic uppercase text-slate-300">Form Not Found</div>;

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <Card className="max-w-xl w-full border-none shadow-2xl rounded-[3rem] p-12 text-center space-y-8 bg-white">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-slate-900 italic uppercase">Submission Received!</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Your application for {template.name} has been logged.</p>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Next Steps</p>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                            Please proceed to make a payment of <span className="text-indigo-600 font-black">₦{template.applicationFee.toLocaleString()}</span> to complete your application. 
                            You can pay via the online gateway or visit the school bursary with your application ID.
                        </p>
                    </div>
                    <Button className="w-full bg-slate-900 text-white font-black py-8 rounded-2xl uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl">
                        Proceed to Payment
                    </Button>
                </Card>
            </div>
        );
    }

    const currentSection = template.sections[currentStep];
    const progress = ((currentStep + 1) / template.sections.length) * 100;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-slate-900 text-white py-20 px-8">
                <div className="max-w-4xl mx-auto space-y-4">
                    <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic">
                        {template.level} Admission Portal
                    </span>
                    <h1 className="text-6xl font-black italic uppercase leading-tight">{template.name}</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs max-w-2xl leading-relaxed">
                        {template.description || "Welcome to our digital intake system. Please fill out the form below carefully to begin your academic journey with us."}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="max-w-4xl mx-auto -mt-10 px-8">
                <Card className="border-none shadow-2xl rounded-[2rem] p-8 bg-white flex items-center gap-8">
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Page {currentStep + 1} of {template.sections.length}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{currentSection.title}</p>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Form Content */}
            <div className="max-w-4xl mx-auto mt-12 px-8">
                <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white">
                    <CardContent className="p-12 space-y-10">
                        {/* Step Icon/Identity */}
                        <div className="flex items-center gap-6 pb-10 border-b border-slate-50">
                            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white">
                                {currentStep === 0 ? <User className="w-8 h-8" /> : 
                                 currentStep === 1 ? <ShieldCheck className="w-8 h-8" /> : <HeartPulse className="w-8 h-8" />}
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 italic uppercase">{currentSection.title}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Enter information accurately as per your documents</p>
                            </div>
                        </div>

                        {/* Fields Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {currentSection.fields.map((field: any) => (
                                <div key={field.id} className={cn("space-y-3", field.type === 'textarea' && "md:col-span-2")}>
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-1">
                                        {field.label} {field.isRequired && <span className="text-rose-500">*</span>}
                                    </label>
                                    
                                    {field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number' ? (
                                        <input 
                                            type={field.type}
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                            placeholder={field.placeholder}
                                            required={field.isRequired}
                                            value={formData[field.label] || ""}
                                            onChange={(e) => handleInputChange(field.label, e.target.value, field.systemKey)}
                                        />
                                    ) : field.type === 'date' ? (
                                        <input 
                                            type="date"
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                            required={field.isRequired}
                                            value={formData[field.label] || ""}
                                            onChange={(e) => handleInputChange(field.label, e.target.value, field.systemKey)}
                                        />
                                    ) : field.type === 'select' ? (
                                        <select 
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none"
                                            required={field.isRequired}
                                            value={formData[field.label] || ""}
                                            onChange={(e) => handleInputChange(field.label, e.target.value)}
                                        >
                                            <option value="">Select option...</option>
                                            {field.options?.split(',').map((opt: string) => (
                                                <option key={opt} value={opt.trim()}>{opt.trim()}</option>
                                            ))}
                                        </select>
                                    ) : field.type === 'textarea' ? (
                                        <textarea 
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm min-h-[120px]"
                                            placeholder={field.placeholder}
                                            required={field.isRequired}
                                            value={formData[field.label] || ""}
                                            onChange={(e) => handleInputChange(field.label, e.target.value)}
                                        />
                                    ) : field.type === 'file' ? (
                                        <div className="relative group">
                                            <input 
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                required={field.isRequired}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setPhoto(reader.result as string);
                                                            handleInputChange(field.label, "file_uploaded");
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                            <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center transition-all group-hover:border-indigo-400 group-hover:bg-indigo-50">
                                                {photo ? (
                                                    <div className="space-y-4">
                                                        <img src={photo} alt="Preview" className="w-24 h-24 rounded-2xl object-cover mx-auto shadow-lg" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center justify-center gap-2">
                                                            <Check className="w-4 h-4" /> Photo Uploaded
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <Camera className="w-10 h-10 text-slate-300 mx-auto group-hover:text-indigo-400 transition-colors" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Click or drag to upload</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>

                        {eligibilityError && (
                            <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex gap-4 animate-in fade-in zoom-in duration-300">
                                <AlertTriangle className="w-8 h-8 text-rose-500 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-rose-700 uppercase tracking-widest">Eligibility Warning</h4>
                                    <p className="text-xs font-bold text-rose-600 leading-relaxed italic">{eligibilityError}</p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-4 pt-10">
                            {currentStep > 0 && (
                                <Button 
                                    onClick={prevStep}
                                    variant="ghost" 
                                    className="flex-1 py-10 rounded-2xl font-black uppercase text-xs tracking-[0.2em] border-none shadow-sm bg-slate-50 hover:bg-slate-100 transition-all"
                                >
                                    <ArrowLeft className="w-5 h-5 mr-3" /> Previous
                                </Button>
                            )}
                            <Button 
                                onClick={nextStep}
                                disabled={submitting}
                                className={cn(
                                    "flex-[2] py-10 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl",
                                    currentStep === template.sections.length - 1 ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                                )}
                            >
                                {submitting ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        {currentStep === template.sections.length - 1 ? "Complete Submission" : "Next Page"} 
                                        <ArrowRight className="w-5 h-5 ml-3" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Secure Badge */}
                <div className="mt-12 flex justify-center items-center gap-6 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    <div className="h-[1px] w-12 bg-slate-300" />
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">256-bit Secure Encryption Portal</span>
                    </div>
                    <div className="h-[1px] w-12 bg-slate-300" />
                </div>
            </div>
        </div>
    );
}
