"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    ChevronLeft, 
    Save, 
    Calendar,
    Zap,
    CheckCircle2,
    RefreshCw
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function EditLeadPage() {
    const router = useRouter();
    const { id } = useParams();
    const [submitting, setSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        phone: "",
        linkedin: "",
        position: "",
        source: "manual",
        status: "new",
        college: "",
        industry: "",
        personalization: "",
        notes: "",
        followUpDate: ""
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchLead = async () => {
            try {
                const res = await fetch(`/api/leads/${id}`);
                const data = await res.json();
                setFormData({
                    name: data.name || "",
                    email: data.email || "",
                    company: data.company || "",
                    phone: data.phone || "",
                    linkedin: data.linkedin || "",
                    position: data.position || "",
                    source: data.source || "manual",
                    status: data.status || "new",
                    college: data.college || "",
                    industry: data.industry || "",
                    personalization: data.personalization || "",
                    notes: data.notes || "",
                    followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString().split('T')[0] : ""
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLead();
    }, [id]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = "Name is required";
        if (!formData.email) newErrors.email = "Email is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setSubmitting(true);
        try {
            const res = await fetch(`/api/leads/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => router.push(`/administrator/marketing/leads/${id}`), 1000);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-4 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Edit <span className="text-indigo-600">Lead</span></h1>
                        <p className="text-sm text-slate-500 font-medium">Refining the intelligence for {formData.name}.</p>
                    </div>
                </div>
                {saved && (
                    <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 animate-in fade-in scale-in">
                        <CheckCircle2 className="w-4 h-4" />
                        Updates Saved
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-4">
                    <Card className="p-6 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-indigo-500/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 font-bold dark:text-white" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</Label>
                                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 font-bold dark:text-white" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company</Label>
                                <Input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 font-bold dark:text-white" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LinkedIn URL</Label>
                                <Input value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 font-bold dark:text-white" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Position / Job Title</Label>
                                <Input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} placeholder="e.g. Founder, Marketing Head" className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 font-bold dark:text-white" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-indigo-500/5">
                        <div className="space-y-1.5">
                             <Label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Zap className="w-3 h-3" /> Outreach Personalization
                             </Label>
                             <Textarea value={formData.personalization} onChange={e => setFormData({...formData, personalization: e.target.value})} placeholder="e.g. Loved your recent LinkedIn post about AI..." className="min-h-[80px] p-4 rounded-xl border-slate-200 dark:border-slate-700 bg-indigo-500/5 dark:bg-indigo-900/10 font-bold dark:text-white transition-all resize-none shadow-inner" />
                        </div>
                    </Card>

                    <Card className="p-6 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-indigo-500/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-indigo-500 flex items-center gap-2">
                                     Education / College
                                </Label>
                                <Input value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 font-bold dark:text-white" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-blue-500 flex items-center gap-2">
                                     Industry Cluster
                                </Label>
                                <Input value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 font-bold dark:text-white" />
                            </div>
                        </div>
                        <div className="mt-6 space-y-1.5">
                             <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Intelligence Notes</Label>
                             <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="min-h-[100px] p-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 font-medium dark:text-white transition-all resize-none" />
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="p-6 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-indigo-500/5">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pipeline Status</Label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-xs font-black focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white">
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

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-orange-500 flex items-center gap-2">
                                    <Calendar className="w-3.3 h-3.3" /> Follow-up Date
                                </Label>
                                <Input type="date" value={formData.followUpDate} onChange={e => setFormData({...formData, followUpDate: e.target.value})} className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-orange-500/5 dark:bg-orange-500/5 focus:ring-4 focus:ring-orange-500/10 font-bold dark:text-white transition-all text-orange-600" />
                            </div>
                        </div>
                    </Card>

                    <Button type="submit" disabled={submitting || saved} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-2xl shadow-indigo-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        {submitting ? <RefreshCw className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
                        Update Intelligence
                    </Button>
                </div>
            </form>
        </div>
    );
}
