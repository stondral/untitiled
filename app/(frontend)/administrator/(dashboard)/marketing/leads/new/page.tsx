"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    ChevronLeft, 
    Save, 
    UserPlus,
    Briefcase, 
    GraduationCap, 
    Calendar,
    Zap,
    CircleAlert as AlertCircle,
    CheckCircle2,
    RefreshCw,
    FileText,
    Edit3,
    Send
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { renderTemplate } from "@/components/marketing/BulkOutreachModal";

export default function NewLeadPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    
    // Outreach State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [templates, setTemplates] = useState<any[]>([]);
    const [emailMode, setEmailMode] = useState<"none" | "template" | "custom">("none");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [customSubject, setCustomSubject] = useState("");
    const [customBody, setCustomBody] = useState("");

    React.useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await fetch("/api/email-templates");
                const data = await res.json();
                setTemplates(data.docs || []);
            } catch (e) { console.error(e); }
        };
        fetchTemplates();
    }, []);
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        phone: "",
        linkedin: "",
        source: "manual",
        status: "not_mailed",
        college: "",
        industry: "",
        notes: "",
        followUpDate: ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = "Name is required";
        if (!formData.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setSubmitting(true);
        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                const newLeadData = await res.json();
                
                if (emailMode !== "none") {
                    try {
                        let finalSubject = "";
                        let finalBody = "";
                        let templateId = undefined;
                        
                        if (emailMode === "template" && selectedTemplate) {
                            templateId = selectedTemplate.id;
                        } else if (emailMode === "custom") {
                            finalSubject = customSubject;
                            finalBody = customBody;
                        }

                        await fetch("/api/marketing/send-single", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                leadId: newLeadData.doc.id,
                                templateId,
                                customSubject: finalSubject,
                                customBody: finalBody
                            })
                        });
                    } catch (e) {
                         console.error("Failed to send initial email: ", e);
                    }
                }

                setSaved(true);
                setTimeout(() => router.push("/administrator/marketing"), 1500);
            } else {
                const data = await res.json();
                if (data.errors?.[0]?.message?.includes("unique")) {
                    setErrors({ email: "This email already exists in the CRM." });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        className="rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Create <span className="text-indigo-600">Lead</span></h1>
                        <p className="text-sm text-slate-500 font-medium">Add a new prospect to your high-speed pipeline.</p>
                    </div>
                </div>
                
                {saved && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Saved Successfully
                    </motion.div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {/* Left Column: Personal & Company */}
                <div className="md:col-span-2 space-y-8">
                    <Card className="p-8 border-slate-200 dark:border-slate-700/50 shadow-2xl shadow-indigo-500/5 rounded-[2rem] overflow-hidden">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <UserPlus className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-lg font-black dark:text-white uppercase tracking-wider">Contact Identity</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name *</Label>
                                <div className="relative">
                                    <Input 
                                        required
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className={cn(
                                            "h-14 px-5 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 font-bold dark:text-white transition-all",
                                            errors.name && "border-red-500 focus:ring-red-500/10"
                                        )}
                                    />
                                    {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.name}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address *</Label>
                                <div className="relative">
                                    <Input 
                                        required
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        className={cn(
                                            "h-14 px-5 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 font-bold dark:text-white transition-all",
                                            errors.email && "border-red-500 focus:ring-red-500/10"
                                        )}
                                    />
                                    {errors.email && (
                                        <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold mt-1 ml-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.email}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Company</Label>
                                <Input 
                                    placeholder="Acme Inc."
                                    value={formData.company}
                                    onChange={e => setFormData({...formData, company: e.target.value})}
                                    className="h-14 px-5 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 font-bold dark:text-white transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">LinkedIn URL</Label>
                                <Input 
                                    placeholder="linkedin.com/in/..."
                                    value={formData.linkedin}
                                    onChange={e => setFormData({...formData, linkedin: e.target.value})}
                                    className="h-14 px-5 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 font-bold dark:text-white transition-all"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 border-slate-200 dark:border-slate-700/50 shadow-2xl shadow-indigo-500/5 rounded-[2rem] overflow-hidden">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="h-8 w-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-lg font-black dark:text-white uppercase tracking-wider">Contextual Data</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">College/University</Label>
                                <div className="relative">
                                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input 
                                        placeholder="Stanford University"
                                        value={formData.college}
                                        onChange={e => setFormData({...formData, college: e.target.value})}
                                        className="h-14 pl-12 pr-5 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 font-bold dark:text-white transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Industry</Label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input 
                                        placeholder="Web3 / AI"
                                        value={formData.industry}
                                        onChange={e => setFormData({...formData, industry: e.target.value})}
                                        className="h-14 pl-12 pr-5 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 font-bold dark:text-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 space-y-2">
                             <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Discovery Notes</Label>
                             <Textarea 
                                placeholder="Describe the lead, their pain points, or how you found them..."
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                className="min-h-[120px] p-5 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 font-medium dark:text-white transition-all resize-none"
                             />
                        </div>
                    </Card>

                    {/* NEW CARD: Initial Outreach */}
                    <Card className="p-8 border-slate-200 dark:border-slate-700/50 shadow-2xl shadow-indigo-500/5 rounded-[2rem] overflow-hidden">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="h-8 w-8 bg-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                                <Send className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-lg font-black dark:text-white uppercase tracking-wider">Initial Outreach</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl w-fit">
                                <button
                                    type="button"
                                    onClick={() => setEmailMode("none")}
                                    className={cn("px-4 py-2 rounded-xl text-xs font-black transition-all", emailMode === "none" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")}
                                >
                                    Don&apos;t Send
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEmailMode("template")}
                                    className={cn("px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2", emailMode === "template" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")}
                                >
                                    <FileText className="w-3.5 h-3.5" /> Template
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEmailMode("custom")}
                                    className={cn("px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2", emailMode === "custom" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")}
                                >
                                    <Edit3 className="w-3.5 h-3.5" /> Custom
                                </button>
                            </div>

                            {emailMode === "template" && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Select Strategy Template</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {templates.map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setSelectedTemplate(t)}
                                                className={cn(
                                                    "p-4 rounded-2xl border-2 text-left transition-all",
                                                    selectedTemplate?.id === t.id 
                                                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10" 
                                                        : "border-slate-100 dark:border-slate-800 hover:border-indigo-200"
                                                )}
                                            >
                                                <div className="font-black text-sm dark:text-white uppercase tracking-tight mb-1">{t.name}</div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate">{t.subject}</p>
                                            </button>
                                        ))}
                                    </div>
                                    {selectedTemplate && (
                                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="text-sm font-black text-indigo-600 italic tracking-tight underline border-b border-indigo-100 dark:border-indigo-900 pb-2 mb-2">Subject: {renderTemplate(selectedTemplate.subject, formData)}</div>
                                            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderTemplate(selectedTemplate.body, formData) }} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {emailMode === "custom" && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subject Line</Label>
                                        <Input 
                                            placeholder="Introduce yourself..."
                                            value={customSubject}
                                            onChange={e => setCustomSubject(e.target.value)}
                                            className="h-14 px-5 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 font-bold dark:text-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Body (Supports HTML)</Label>
                                        <Textarea 
                                            placeholder="Write your custom email..."
                                            value={customBody}
                                            onChange={e => setCustomBody(e.target.value)}
                                            className="min-h-[160px] p-5 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 font-medium dark:text-white transition-all resize-y"
                                        />
                                    </div>
                                    {(customSubject || customBody) && (
                                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Live Preview</div>
                                            <div className="text-sm font-black text-indigo-600 italic tracking-tight underline border-b border-indigo-100 dark:border-indigo-900 pb-2 mb-2">Subject: {renderTemplate(customSubject, formData)}</div>
                                            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderTemplate(customBody, formData) }} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Status & Strategy */}
                <div className="space-y-8">
                     <Card className="p-8 border-slate-200 dark:border-slate-700/50 shadow-2xl shadow-indigo-500/5 rounded-[2rem] overflow-hidden">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="h-8 w-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-lg font-black dark:text-white uppercase tracking-wider">Strategy</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Pipeline Status</Label>
                                <select 
                                    value={formData.status}
                                    onChange={e => setFormData({...formData, status: e.target.value})}
                                    className="w-full h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-sm font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                                >
                                    <option value="not_mailed">Not Mailed</option>
                                    <option value="awaiting_reply">Awaiting Reply</option>
                                    <option value="no_reply">No Reply</option>
                                    <option value="replied">Replied</option>
                                    <option value="interested">Interested</option>
                                    <option value="not_interested">Not Interested</option>
                                    <option value="converted">Converted</option>
                                    <option value="follow_up">Follow Up</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Engagement Source</Label>
                                <select 
                                    value={formData.source}
                                    onChange={e => setFormData({...formData, source: e.target.value})}
                                    className="w-full h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-sm font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                                >
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="cold_email">Cold Email</option>
                                    <option value="event">Event</option>
                                    <option value="referral">Referral</option>
                                    <option value="website">Website</option>
                                    <option value="manual">Manual Entry</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-orange-500 flex items-center gap-2">
                                    <Calendar className="w-3.3 h-3.3" /> Scheduled Follow-up
                                </Label>
                                <Input 
                                    type="date"
                                    value={formData.followUpDate}
                                    onChange={e => setFormData({...formData, followUpDate: e.target.value})}
                                    className="h-14 px-5 rounded-2xl border-slate-200 dark:border-slate-700 bg-orange-500/5 dark:bg-orange-500/5 focus:ring-4 focus:ring-orange-500/10 font-bold dark:text-white transition-all text-orange-600"
                                />
                            </div>
                        </div>
                     </Card>

                    <div className="sticky top-8 space-y-4">
                        <Button 
                            type="submit" 
                            disabled={submitting || saved}
                            className="w-full h-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-2xl shadow-indigo-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                                    Committing...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-3" />
                                    Launch Lead
                                </>
                            )}
                        </Button>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => router.back()}
                            className="w-full h-14 rounded-2xl font-bold text-slate-500"
                        >
                            Discard Changes
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}


