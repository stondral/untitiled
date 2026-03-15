"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, XCircle, Zap, RefreshCw, Plus, ChevronLeft, ChevronRight, Linkedin } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const renderTemplate = (text: string, lead: any) => {
    let rendered = text || "";
    // Smart Greeting
    const firstName = lead.name?.split(" ")[0] || "";
    const greeting = firstName ? `Hi ${firstName}` : "Hi there";
    rendered = rendered.replace(/Hi {Name}|Hello {Name}|Hey {Name}/gi, greeting);
    
    // Variables
    rendered = rendered.replace(/{Name}/g, lead.name || "");
    rendered = rendered.replace(/{Company}/g, lead.company || "your company");
    rendered = rendered.replace(/{College}/g, lead.college || "your university");
    rendered = rendered.replace(/{Industry}/g, lead.industry || "your industry");
    rendered = rendered.replace(/{Personalization}/g, lead.personalization || "");
    rendered = rendered.replace(/{Position}/g, lead.position || "your role");
    return rendered;
};

interface BulkOutreachModalProps {
    leadIds: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    templates: any[];
    onClose: () => void;
    onSent: () => void;
}

export function BulkOutreachModal({ leadIds, templates, onClose, onSent }: BulkOutreachModalProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [sending, setSending] = useState(false);
    const [previewLeadIndex, setPreviewLeadIndex] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [previewLeads, setPreviewLeads] = useState<any[]>([]);

    useEffect(() => {
        const fetchPreviewLeads = async () => {
            if (leadIds.length === 0) return;
            // Fetch basic lead info for preview
            const res = await fetch(`/api/leads?limit=100&where[id][in]=${leadIds.join(",")}`);
            const data = await res.json();
            setPreviewLeads(data.docs || []);
        };
        fetchPreviewLeads();
    }, [leadIds]);

    const handleSend = async () => {
        if (!selectedTemplate) return;
        setSending(true);
        try {
            const res = await fetch("/api/marketing/send-bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    leadIds, 
                    templateId: selectedTemplate.id 
                }),
            });
            if (res.ok) onSent();
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const currentLead = previewLeads[previewLeadIndex];

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100000] flex items-center justify-center p-4 sm:p-6 md:p-10">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_0_100px_rgba(79,70,229,0.2)] border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/10"
            >
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 rotate-3">
                            <Mail className="w-8 h-8 text-white -rotate-3" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black dark:text-white tracking-tighter italic">Campaign <span className="text-indigo-600">Pilot</span></h2>
                                <span className="px-3 py-1 bg-indigo-500/10 text-[10px] font-black text-indigo-500 rounded-full border border-indigo-500/20 uppercase tracking-widest">v2.1 Ready</span>
                            </div>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">Blasting {leadIds.length} leads with premium outreach strategy</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-12 w-12 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all group">
                        <XCircle className="w-8 h-8 text-slate-300 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left: Template Selection */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Strategy Selection</Label>
                            <div className="grid grid-cols-1 gap-3">
                                {templates.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTemplate(t)}
                                        className={cn(
                                            "p-5 rounded-3xl border-2 text-left transition-all group relative overflow-hidden",
                                            selectedTemplate?.id === t.id 
                                                ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-xl shadow-indigo-500/10 scale-[1.02]" 
                                                : "border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-black text-sm dark:text-white uppercase tracking-tight">{t.name}</span>
                                            {selectedTemplate?.id === t.id && (
                                                <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                                    <Zap className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate">{t.subject}</p>
                                    </button>
                                ))}
                                <Link 
                                    href="/administrator/marketing/templates" 
                                    className="p-5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center gap-2 group transition-all"
                                >
                                    <Plus className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-all group-hover:rotate-90" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">Expand Library</span>
                                </Link>
                            </div>
                        </div>

                        <Card className="p-8 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-t-4 border-t-indigo-600">
                            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Rocket className="w-3 h-3" /> Flight Parameters
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                        <span>SMTP Health Check</span>
                                        <span className="text-emerald-500">Optimum (100%)</span>
                                    </div>
                                    <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full w-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    </div>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest text-center">
                                        Estimated Flight Time: <span className="text-indigo-600 font-black">12m 42s</span>
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right: Smart Preview */}
                    <div className="lg:col-span-8 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Transmission Preview</Label>
                            {previewLeads.length > 1 && (
                                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-2xl">
                                    <button 
                                        onClick={() => setPreviewLeadIndex(i => Math.max(0, i - 1))}
                                        className="p-1 hover:text-indigo-500 text-slate-400 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-[10px] font-black text-slate-500 tracking-tighter">{previewLeadIndex + 1} of {previewLeads.length}</span>
                                    <button 
                                        onClick={() => setPreviewLeadIndex(i => Math.min(previewLeads.length - 1, i + 1))}
                                        className="p-1 hover:text-indigo-500 text-slate-400 transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-10 relative overflow-hidden group shadow-inner">
                            {!selectedTemplate ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="h-24 w-24 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-xl dark:shadow-none animate-pulse">
                                        <Mail className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">No Strategy Selected</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select a template on the left to begin <br/>real-time personalization preview.</p>
                                    </div>
                                </div>
                            ) : currentLead ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest w-16">Recipient:</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                                                    {currentLead.name?.[0]}
                                                </div>
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{currentLead.name}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest w-16">Subject:</span>
                                            <span className="text-sm font-black text-indigo-600 italic tracking-tight underline decoration-indigo-200 underline-offset-4">{renderTemplate(selectedTemplate.subject, currentLead)}</span>
                                        </div>
                                    </div>
                                    <div className="h-px bg-slate-200 dark:bg-slate-800 w-full" />
                                    <div 
                                        className="text-base leading-relaxed text-slate-700 dark:text-slate-300 prose dark:prose-invert max-w-none font-medium p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm min-h-[200px]"
                                        dangerouslySetInnerHTML={{ __html: renderTemplate(selectedTemplate.body || selectedTemplate.html || selectedTemplate.content, currentLead) }}
                                    />
                                    
                                    <div className="flex flex-wrap gap-2 pt-4">
                                        <Badge icon={Linkedin} label="LinkedIn Targeted" color="blue" />
                                        <Badge icon={Zap} label="Personalized Hook" color="indigo" />
                                        {currentLead.college && <Badge label={currentLead.college} color="slate" />}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center">
                                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Processing Intelligence...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
                        <div>
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block leading-none">System Status</span>
                           <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-tighter">All Systems Operational</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button 
                            variant="ghost" 
                            onClick={onClose} 
                            className="rounded-2xl font-black h-16 px-10 text-slate-500 tracking-widest uppercase hover:bg-slate-100 hover:text-red-500 transition-all text-xs"
                        >
                            Abort Mission
                        </Button>
                        <Button 
                            disabled={!selectedTemplate || sending} 
                            onClick={handleSend}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black h-16 px-16 shadow-[0_10px_40px_rgba(79,70,229,0.5)] transition-all hover:scale-[1.05] active:scale-[0.98] uppercase tracking-widest text-sm flex items-center gap-3"
                        >
                            {sending ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Engaging...
                                </>
                            ) : (
                                <>
                                    <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    Launch Outreach
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Badge({ icon: Icon, label, color }: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colors: any = {
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        indigo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        slate: "bg-slate-500/10 text-slate-500 border-slate-500/20",
        emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    };
    return (
        <span className={cn("px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-2", colors[color] || colors.slate)}>
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </span>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Rocket(props: any) { return <Zap {...props} /> }
