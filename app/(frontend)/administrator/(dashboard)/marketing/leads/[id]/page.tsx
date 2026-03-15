"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  Phone,
  PhoneCall,
  Calendar,
  Linkedin,
  ChevronLeft,
  Send,
  History,
  Zap,
  Loader2,
  CheckCircle2,
  FileText,
  Edit3
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { LeadTimeline } from "@/components/marketing/LeadTimeline";
import { BulkOutreachModal, renderTemplate } from "@/components/marketing/BulkOutreachModal";

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lead, setLead] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab ] = useState<"history" | "outreach">("history");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [templates, setTemplates] = useState<any[]>([]);
  const [showOutreach, setShowOutreach] = useState(false);
  const [showLogCallModal, setShowLogCallModal] = useState(false);
  const [loggingCall, setLoggingCall] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Single Email State
  const [emailMode, setEmailMode] = useState<"template" | "custom">("template");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [sendingSingle, setSendingSingle] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSendSingleEmail = async () => {
      setSendingSingle(true);
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

          const res = await fetch("/api/marketing/send-single", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  leadId: id,
                  templateId,
                  customSubject: finalSubject,
                  customBody: finalBody
              })
          });
          
          if (res.ok) {
              setCustomSubject("");
              setCustomBody("");
              setSelectedTemplate(null);
              setActiveTab("history");
          }
          await fetchActivities(); // Moved outside if (res.ok) to ensure activities are always fetched
      } catch (err) { // Changed 'e' to 'err'
        console.error("Failed to send single email:", err); // Updated error message
      } finally {
          setSendingSingle(false);
      }
  };

  const handleLogCall = async (result: "answered" | "no_answer") => {
    setLoggingCall(true);
    try {
      // 1. Log the call
      const res = await fetch("/api/call-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: id,
          calledAt: new Date().toISOString(),
          result,
        }),
      });

      // 2. Update lead status
      const newStatus = result === "answered" ? "replied" : "no_reply";
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setLead((prev: any) => prev ? ({ ...prev, status: newStatus }) : null);
        setShowLogCallModal(false);
        setActiveTab("history");
        await fetchActivities();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingCall(false);
    }
  };

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/marketing/activities?leadId=${id}`);
      const data = await res.json();
      setActivities(data.docs || []);
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadRes, activityRes, templateRes] = await Promise.all([
          fetch(`/api/leads/${id}`),
          fetch(`/api/marketing/activities?leadId=${id}`),
          fetch(`/api/email-templates`)
        ]);
        
        const leadData = await leadRes.json();
        const activityData = await activityRes.json();
        const templateData = await templateRes.json();

        setLead(leadData);
        setActivities(activityData.docs || []);
        setTemplates(templateData.docs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
    </div>
  );
  if (!lead) return <div className="p-10 text-center">Lead not found.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
            <button 
                onClick={() => router.back()}
                className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
                <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
                <h1 className="text-3xl font-black dark:text-white tracking-tight">Lead <span className="text-indigo-600">Intelligence</span></h1>
                <p className="text-sm text-slate-500 font-medium">Deep dive into {lead.name}&apos;s profile.</p>
            </div>
        </div>
        <div className="flex gap-3">
             <Link href={`/administrator/marketing/leads/${id}/edit`}>
                <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-slate-200">
                    Edit Profile
                </Button>
             </Link>
             <Button 
                onClick={() => setShowLogCallModal(true)}
                variant="outline"
                className="rounded-2xl h-12 px-6 font-black border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 shadow-sm"
             >
                <PhoneCall className="w-4 h-4 mr-2" />
                Log Call
             </Button>
             <Button 
                onClick={() => setShowOutreach(true)}
                className="rounded-2xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-500/20"
             >
                <Zap className="w-4 h-4 mr-2" />
                Send Message
             </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Identity Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-8 border-slate-100 dark:border-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8">
                 <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-28 w-28 rounded-3xl bg-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-indigo-500/40 relative">
                {lead.name ? (
                  lead.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                ) : "LB"}
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black dark:text-white leading-tight">{lead.name}</h2>
                <p className="text-indigo-600 font-black uppercase text-[10px] tracking-widest">{lead.position || lead.company || "Lead Profile"}</p>
                {lead.position && lead.company && (
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase italic">@{lead.company}</p>
                )}
                <div className="flex justify-center pt-1.5">
                    <span className="px-3 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-500 border border-slate-200 dark:border-slate-700">
                        {lead.status?.replace(/_/g, ' ')}
                    </span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <ContactItem icon={Mail} label="Email Address" value={lead.email} />
              <ContactItem icon={Phone} label="Contact Number" value={(!lead.phone || lead.phone === "Encrypted") ? "Not Provided" : lead.phone} />
              <ContactItem icon={Linkedin} label="Professional Network" value={lead.linkedin ? "Connected" : "Not Linked"} href={lead.linkedin} />
              <ContactItem icon={Calendar} label="Acquired On" value={new Date(lead.createdAt).toLocaleDateString()} />
            </div>



            {lead.personalization && (
                <div className="mt-6 p-4 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3 h-3 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Personalization Hook</span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 italic">
                        &quot;{lead.personalization}&quot;
                    </p>
                </div>
            )}

            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lead Score</span>
                    <span className="text-sm font-black text-indigo-600">84/100</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[84%] bg-indigo-600 rounded-full" />
                </div>
            </div>
          </Card>
        </div>

        {/* Right: Activity & Outreach */}
        <div className="lg:col-span-8">
          <Card className="rounded-3xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
            <div className="flex border-b border-slate-100 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-800/50">
              <TabButton 
                active={activeTab === "history"} 
                onClick={() => setActiveTab("history")}
                icon={History}
                label="Intelligence Feed"
              />
              <TabButton 
                active={activeTab === "outreach"} 
                onClick={() => setActiveTab("outreach")}
                icon={Send}
                label="Direct Outreach"
              />
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === "history" ? (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <LeadTimeline activities={activities} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="outreach"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card 
                            onClick={() => setEmailMode("template")}
                            className={cn("p-6 border-slate-200 dark:border-slate-800 transition-all cursor-pointer group", emailMode === "template" ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20" : "bg-slate-50/50 hover:border-indigo-500")}
                        >
                            <FileText className={cn("w-8 h-8 mb-4 group-hover:scale-110 transition-transform", emailMode === "template" ? "text-indigo-600" : "text-indigo-500")} />
                            <h4 className="font-black dark:text-white uppercase text-xs tracking-widest mb-1">Use Template</h4>
                            <p className="text-xs text-slate-500 font-medium">Send a prebuilt strategy.</p>
                        </Card>
                        <Card 
                            onClick={() => setEmailMode("custom")}
                            className={cn("p-6 border-slate-200 dark:border-slate-800 transition-all cursor-pointer group", emailMode === "custom" ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20" : "bg-slate-50/50 hover:border-emerald-500")}
                        >
                            <Edit3 className={cn("w-8 h-8 mb-4 group-hover:scale-110 transition-transform", emailMode === "custom" ? "text-emerald-600" : "text-emerald-500")} />
                            <h4 className="font-black dark:text-white uppercase text-xs tracking-widest mb-1">Custom Message</h4>
                            <p className="text-xs text-slate-500 font-medium">Write on the fly.</p>
                        </Card>
                    </div>

                    <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50">
                         {emailMode === "template" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
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
                                                    ? "border-indigo-600 bg-white dark:bg-slate-800 shadow-md" 
                                                    : "border-slate-100 dark:border-slate-800 hover:border-indigo-200 bg-white/50 dark:bg-slate-900"
                                            )}
                                        >
                                            <div className="font-black text-sm dark:text-white uppercase tracking-tight mb-1">{t.name}</div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate">{t.subject}</p>
                                        </button>
                                    ))}
                                </div>
                                {selectedTemplate && (
                                    <div className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <div className="text-sm font-black text-indigo-600 italic tracking-tight underline border-b border-indigo-100 dark:border-indigo-900 pb-3 mb-3">Subject: {renderTemplate(selectedTemplate.subject, lead)}</div>
                                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderTemplate(selectedTemplate.body, lead) }} />
                                    </div>
                                )}
                            </div>
                        )}

                        {emailMode === "custom" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subject Line</Label>
                                    <Input 
                                        placeholder="Introduce yourself..."
                                        value={customSubject}
                                        onChange={e => setCustomSubject(e.target.value)}
                                        className="h-14 px-5 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-emerald-500/10 font-bold dark:text-white transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Body (Supports HTML)</Label>
                                    <Textarea 
                                        placeholder="Write your custom email..."
                                        value={customBody}
                                        onChange={e => setCustomBody(e.target.value)}
                                        className="min-h-[200px] p-5 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-emerald-500/10 font-medium dark:text-white transition-all resize-y shadow-sm"
                                    />
                                </div>
                                {(customSubject || customBody) && (
                                    <div className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-3">Live Preview</div>
                                        <div className="text-sm font-black text-emerald-600 italic tracking-tight underline border-b border-emerald-100 dark:border-emerald-900 pb-3 mb-3">Subject: {renderTemplate(customSubject, lead)}</div>
                                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderTemplate(customBody, lead) }} />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                            <Button 
                                disabled={sendingSingle || (emailMode === "template" && !selectedTemplate) || (emailMode === "custom" && (!customSubject || !customBody))}
                                onClick={handleSendSingleEmail}
                                className={cn(
                                    "rounded-2xl h-14 px-8 font-black text-white shadow-lg transition-all hover:scale-105 active:scale-95",
                                    emailMode === "template" ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                                )}
                            >
                                {sendingSingle ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Transmitting...</>
                                ) : (
                                    <><Send className="w-5 h-5 mr-2" /> Dispatch Message</>
                                )}
                            </Button>
                        </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Portals / Modals outside stacking context */}
      {mounted && (
        <>
          {showOutreach && (
            <BulkOutreachModal 
                leadIds={[id as string]}
                templates={templates}
                onClose={() => setShowOutreach(false)}
                onSent={() => {
                    setShowOutreach(false);
                    setActiveTab("history");
                    fetchActivities();
                }}
            />
          )}

          {showLogCallModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden p-8"
                >
                    <div className="text-center space-y-6">
                        <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto">
                            <PhoneCall className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black dark:text-white">Call Outcome</h2>
                            <p className="text-sm text-slate-500 font-bold">How did the conversation go?</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                disabled={loggingCall}
                                onClick={() => handleLogCall("answered")}
                                className="aspect-square flex flex-col items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-8 h-8" />
                                <span className="font-black text-sm uppercase tracking-wider">Answered</span>
                            </button>
                            <button 
                                disabled={loggingCall}
                                onClick={() => handleLogCall("no_answer")}
                                className="aspect-square flex flex-col items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20 disabled:opacity-50"
                            >
                                <Phone className="w-8 h-8" />
                                <span className="font-black text-sm uppercase tracking-wider">No Answer</span>
                            </button>
                        </div>

                        <Button 
                            variant="ghost" 
                            onClick={() => setShowLogCallModal(false)}
                            className="w-full h-12 rounded-xl text-slate-400 font-bold hover:text-slate-600"
                        >
                            Cancel
                        </Button>
                    </div>
                </motion.div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface ContactItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  value: string;
  href?: string;
}

function ContactItem({ icon: Icon, label, value, href }: ContactItemProps) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-all border border-slate-100 dark:border-slate-700">
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{label}</p>
                {href ? (
                    <a href={href} target="_blank" className="text-xs font-bold text-indigo-600 hover:underline">{value}</a>
                ) : (
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{value}</p>
                )}
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                active 
                    ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" 
                    : "text-slate-400 hover:text-slate-600"
            )}
        >
            <Icon className={cn("w-4 h-4", active ? "text-indigo-600" : "text-slate-400")} />
            {label}
        </button>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RefreshCw(props: any) { return <Zap {...props} /> }
