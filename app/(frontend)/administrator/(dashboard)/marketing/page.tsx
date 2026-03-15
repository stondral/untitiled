"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Users,
  Search,
  Plus,
  Mail,
  MailX,
  Calendar,
  ChevronRight,
  ChevronDown,
  Clock,
  ExternalLink,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  CheckCircle2,
  UserPlus,
  Zap,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Timer,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { BulkOutreachModal } from "@/components/marketing/BulkOutreachModal";

// Outreach-focused Status Mappings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  not_mailed: { label: "Not Mailed", color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: MailX },
  awaiting_reply: { label: "Awaiting Reply", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Timer },
  no_reply: { label: "No Reply", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: Clock },
  replied: { label: "Replied", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Mail },
  interested: { label: "Interested", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: ThumbsUp },
  not_interested: { label: "Not Interested", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: ThumbsDown },
  converted: { label: "Converted", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: Trophy },
  follow_up: { label: "Follow Up", color: "bg-violet-500/10 text-violet-500 border-violet-500/20", icon: RefreshCw },
  // Fallback for legacy 'new' status
  new: { label: "Not Mailed", color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: MailX },
  contacted: { label: "Awaiting Reply", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Timer },
};

const STATUS_OPTIONS = [
  { value: "not_mailed", label: "Not Mailed" },
  { value: "awaiting_reply", label: "Awaiting Reply" },
  { value: "no_reply", label: "No Reply" },
  { value: "replied", label: "Replied" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "converted", label: "Converted" },
  { value: "follow_up", label: "Follow Up" },
];

export default function MarketingDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [templates, setTemplates] = useState<any[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [dailyStats] = useState({ sent: 37, total: 100 }); // Mocked until API ready
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Quick Add State
  const [quickAdd, setQuickAdd] = useState({ name: "", email: "", company: "" });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads?limit=1000&sort=-createdAt");
      const data = await res.json();
      setLeads(data.docs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/email-templates");
      const data = await res.json();
      setTemplates(data.docs || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchTemplates();
  }, [fetchLeads, fetchTemplates]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      
      if (e.key === "a") { e.preventDefault(); window.location.href = "/administrator/marketing/leads/new"; }
      if (e.key === "t" && selectedLeadIds.length > 0) { e.preventDefault(); setShowBulkModal(true); }
      if (e.key === "i") { e.preventDefault(); window.location.href = "/administrator/marketing/import"; }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLeadIds]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAdd.name || !quickAdd.email) return;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...quickAdd, status: "new", source: "manual" }),
      });
      if (res.ok) {
        setQuickAdd({ name: "", email: "", company: "" });
        fetchLeads();
      }
    } catch (e) { console.error(e); }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSeed = async () => {
    setLoading(true);
    const demoLeads = [
        { name: "Sarah Chen", email: "sarah@techflow.ai", company: "TechFlow AI", status: "new", industry: "Artificial Intelligence", college: "Stanford", leadScore: 85 },
        { name: "Marcus Thorne", email: "m.thorne@vanguard.com", company: "Vanguard Systems", status: "contacted", industry: "Cybersecurity", college: "MIT", leadScore: 45 },
        { name: "Elena Rodriguez", email: "elena@nexus.io", company: "Nexus Design", status: "replied", industry: "Creative Tech", college: "RISD", leadScore: 92 },
        { name: "Julian Kwok", email: "j.kwok@quantum.edu", company: "Quantum Labs", status: "follow_up", industry: "Education", college: "UC Berkeley", leadScore: 12 },
        { name: "Aria Sterling", email: "aria@bloom.co", company: "Bloom Health", status: "converted", industry: "Healthcare", college: "Harvard", leadScore: 100 }
    ];
    try {
        await Promise.all(demoLeads.map(l => 
            fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...l, source: "manual" })
            })
        ));
        fetchLeads();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         l.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         l.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "not-mailed") return matchesSearch && (l.status === "not_mailed" || l.status === "new");
    if (activeTab === "awaiting") return matchesSearch && (l.status === "awaiting_reply" || l.status === "contacted");
    if (activeTab === "no-reply") return matchesSearch && l.status === "no_reply";
    if (activeTab === "replied") return matchesSearch && l.status === "replied";
    if (activeTab === "interested") return matchesSearch && l.status === "interested";
    if (activeTab === "follow-up") return matchesSearch && l.status === "follow_up";
    return matchesSearch;
  });

  const stats = {
    total: leads.length,
    notMailed: leads.filter(l => l.status === "not_mailed" || l.status === "new").length,
    awaiting: leads.filter(l => l.status === "awaiting_reply" || l.status === "contacted").length,
    noReply: leads.filter(l => l.status === "no_reply").length,
    replied: leads.filter(l => l.status === "replied").length,
    interested: leads.filter(l => l.status === "interested").length,
    followUp: leads.filter(l => l.status === "follow_up").length,
  };

  return (
    <div className="space-y-8 pb-24 text-slate-900 dark:text-white">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-500 font-bold uppercase tracking-widest text-xs">
            <Zap className="w-3 h-3" /> Outreach Workspace
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Marketing <span className="text-indigo-600">Leads</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Manage your high-performance outreach pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <Card className="px-4 py-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex items-center gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Daily SMTP Limit</span>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(dailyStats.sent/dailyStats.total)*100}%` }}
                                className="h-full bg-emerald-500" 
                            />
                        </div>
                        <span className="text-xs font-black">{dailyStats.sent}/{dailyStats.total}</span>
                    </div>
                </div>
            </Card>
            <Link href="/administrator/marketing/leads/new">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-12 rounded-2xl shadow-xl shadow-indigo-500/20 font-bold">
                    <UserPlus className="w-5 h-5 mr-2" />
                    New Lead
                </Button>
            </Link>
            <Link href="/administrator/marketing/import">
                <Button 
                    variant="outline" 
                    className="h-12 w-12 rounded-2xl border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                >
                    <Upload className="w-5 h-5" />
                </Button>
            </Link>
            {selectedLeadIds.length > 0 && (
                <Button 
                    onClick={() => setShowBulkModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-12 rounded-2xl shadow-xl shadow-indigo-500/20 font-black animate-in fade-in zoom-in"
                >
                    <Zap className="w-4 h-4 mr-2" />
                    Send Bulk Message ({selectedLeadIds.length})
                </Button>
            )}
        </div>
      </div>

      {/* Quick Entry Row */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-1 px-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm overflow-hidden rounded-[1.25rem]">
            <form onSubmit={handleQuickAdd} className="flex flex-col md:flex-row items-center gap-1">
                <div className="flex-[1.5] w-full relative group">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        placeholder="Lead Name"
                        value={quickAdd.name}
                        onChange={e => setQuickAdd({...quickAdd, name: e.target.value})}
                        className="w-full h-12 pl-[3.25rem] pr-4 bg-transparent outline-none text-sm font-bold dark:text-white"
                    />
                </div>
                <div className="w-[1px] h-8 bg-slate-100 dark:bg-slate-800 hidden md:block" />
                <div className="flex-1 w-full relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="email"
                        placeholder="Email Address"
                        value={quickAdd.email}
                        onChange={e => setQuickAdd({...quickAdd, email: e.target.value})}
                        className="w-full h-12 pl-[3.25rem] pr-4 bg-transparent outline-none text-sm font-semibold dark:text-white"
                    />
                </div>
                <div className="w-[1px] h-8 bg-slate-100 dark:bg-slate-800 hidden md:block" />
                <div className="flex-1 w-full relative group">
                    <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        placeholder="Company"
                        value={quickAdd.company}
                        onChange={e => setQuickAdd({...quickAdd, company: e.target.value})}
                        className="w-full h-12 pl-[3.25rem] pr-4 bg-transparent outline-none text-sm font-semibold dark:text-white"
                    />
                </div>
                <Button 
                    type="submit" 
                    className="w-full md:w-auto h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 m-1"
                >
                    Quick Add
                </Button>
            </form>
        </Card>
      </motion.div>

      {/* Pro Table UI */}
      <Card className="border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xl shadow-indigo-500/5">
        {/* Table Tabs/Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 gap-4">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl overflow-x-auto no-scrollbar">
                {[
                    { id: "all", label: "All Leads", icon: Users, count: stats.total },
                    { id: "not-mailed", label: "Not Mailed", icon: MailX, count: stats.notMailed },
                    { id: "awaiting", label: "Awaiting Reply", icon: Timer, count: stats.awaiting },
                    { id: "no-reply", label: "No Reply", icon: Clock, count: stats.noReply },
                    { id: "replied", label: "Replied", icon: Mail, count: stats.replied },
                    { id: "interested", label: "Interested", icon: ThumbsUp, count: stats.interested },
                    { id: "follow-up", label: "Follow Up", icon: RefreshCw, count: stats.followUp },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap",
                            activeTab === tab.id 
                                ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" 
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={cn(
                                "ml-1 px-1.5 py-0.5 rounded-md text-[10px]",
                                activeTab === tab.id ? "bg-indigo-50 dark:bg-indigo-500/20" : "bg-slate-200 dark:bg-slate-800"
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    placeholder="Search in list..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
            </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto relative min-h-[400px]">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-md z-20">
                    <tr>
                        <th className="px-6 py-4 w-10">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-600"
                                checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                                onChange={() => {
                                    if (selectedLeadIds.length === filteredLeads.length) setSelectedLeadIds([]);
                                    else setSelectedLeadIds(filteredLeads.map(l => l.id));
                                }}
                            />
                        </th>
                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">Name & Company</th>
                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">Email Address</th>
                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">Outreach Status</th>
                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider text-center">Score</th>
                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">Last Activity</th>
                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">Follow-up</th>
                        <th className="p-4 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                        <tr className="animate-pulse">
                            <td colSpan={8} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-20" />
                                Synchronizing Intelligence...
                            </td>
                        </tr>
                    ) : filteredLeads.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="p-32 text-center">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div className="max-w-md mx-auto space-y-6">
                                        <div className="relative inline-block">
                                        <div className="h-24 w-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4">
                                            <Users className="w-10 h-10 text-indigo-500 opacity-40" />
                                        </div>
                                        <motion.div 
                                            animate={{ scale: [1, 1.2, 1] }} 
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute -top-1 -right-1 h-6 w-6 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900"
                                        >
                                            <Plus className="w-3 h-3 text-white" />
                                        </motion.div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black dark:text-white">Workspace Empty</h3>
                                        <p className="text-sm text-slate-500 font-medium">Your outreach pipeline is hungry. Ready to launch your first high-performance campaign?</p>
                                    </div>
                                        <Link href="/administrator/marketing/leads/new" className="w-full sm:w-auto">
                                            <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-200 dark:border-slate-700 font-bold px-8">
                                                Manual Entry
                                            </Button>
                                        </Link>
                                    </div>
                                </motion.div>
                            </td>
                        </tr>
                    ) : (
                        filteredLeads.map((lead) => (
                            <tr 
                                key={lead.id} 
                                className={cn(
                                    "group transition-colors",
                                    selectedLeadIds.includes(lead.id) 
                                        ? "bg-indigo-50/50 dark:bg-indigo-500/5" 
                                        : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                                )}
                            >
                                <td className="p-4">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-600"
                                        checked={selectedLeadIds.includes(lead.id)}
                                        onChange={() => {
                                            setSelectedLeadIds(prev => prev.includes(lead.id) ? prev.filter(i => i !== lead.id) : [...prev, lead.id]);
                                        }}
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-indigo-500 text-xs">
                                            {lead.name?.[0] || "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{lead.name}</p>
                                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-tight">{lead.company || "-"}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 group/email">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">{lead.email}</span>
                                        <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover/email:opacity-100 transition-opacity" />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <StatusDropdown status={lead.status} onStatusChange={(newStatus) => handleStatusChange(lead.id, newStatus)} />
                                </td>
                                <td className="p-4 text-center">
                                    <div className={cn(
                                        "inline-flex items-center justify-center h-8 w-8 rounded-full font-black text-xs",
                                        (lead.leadScore || 0) > 50 ? "bg-emerald-100 text-emerald-600" :
                                        (lead.leadScore || 0) > 20 ? "bg-amber-100 text-amber-600" :
                                        "bg-slate-100 text-slate-400"
                                    )}>
                                        {lead.leadScore || 0}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                            {lead.lastEmailed ? new Date(lead.lastEmailed).toLocaleDateString() : "-"}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {lead.replied ? "Replied" : "No Activity"}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-slate-300" />
                                        <span className={cn(
                                            "text-xs font-bold",
                                            lead.followUpDate && new Date(lead.followUpDate) <= new Date() 
                                                ? "text-red-500" 
                                                : "text-slate-500 dark:text-slate-400"
                                        )}>
                                            {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : "-"}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Link href={`/administrator/marketing/leads/${lead.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600">
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </Card>

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedLeadIds.length > 0 && (
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-3xl px-4"
            >
                <Card className="bg-slate-900 border-indigo-500/30 shadow-2xl shadow-indigo-500/40 p-3 flex items-center justify-between rounded-3xl overflow-hidden ring-4 ring-indigo-500/10">
                    <div className="flex items-center gap-4 px-4 border-r border-slate-700">
                        <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-black">
                            {selectedLeadIds.length}
                        </div>
                        <span className="text-sm font-bold text-white hidden sm:inline">Leads Selected</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={() => setShowBulkModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 px-6 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Send Campaign</span>
                        </Button>
                        
                        <Button 
                            variant="ghost" 
                            className="bg-slate-800 hover:bg-slate-700 text-white font-black h-12 px-6 rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-slate-700"
                        >
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span>FOLLOW UP MAIL</span>
                        </Button>

                        <div className="w-[1px] h-8 bg-slate-800 mx-2" />

                        <Button variant="ghost" className="text-slate-400 hover:text-white h-10 w-10 p-0 rounded-2xl">
                             <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" className="text-slate-400 hover:text-white h-10 w-10 p-0 rounded-2xl">
                             <Download className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Portals / Modals outside stacking context */}
      {mounted && showBulkModal && (
        <BulkOutreachModal 
            leadIds={selectedLeadIds}
            templates={templates}
            onClose={() => setShowBulkModal(false)}
            onSent={() => {
                setShowBulkModal(false);
                setSelectedLeadIds([]);
                fetchLeads();
            }}
        />
      )}
    </div>
  );
}

function StatusDropdown({ status, onStatusChange }: { status: string; onStatusChange: (s: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_mailed;
  const Icon = config.icon;

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase border tracking-wider transition-all hover:shadow-md",
          config.color
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
        <ChevronDown className={cn("w-3 h-3 opacity-60 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/30 p-1.5 min-w-[180px]"
          >
            {STATUS_OPTIONS.map(opt => {
              const optConfig = STATUS_CONFIG[opt.value];
              const OptIcon = optConfig?.icon;
              const isActive = status === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onStatusChange(opt.value); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left",
                    isActive 
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600" 
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {OptIcon && <OptIcon className="w-3.5 h-3.5 shrink-0" />}
                  {opt.label}
                  {isActive && <CheckCircle2 className="w-3 h-3 ml-auto text-indigo-500" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

