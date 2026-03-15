"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays, Clock, User, TrendingUp, Search,
  Plus, X, Check, ChevronLeft, ChevronRight,
  FileText, Send, CircleAlert as AlertCircle, RefreshCw, Ban,
  Calendar, CheckCircle2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────
interface Meeting {
  id: string;
  name: string;
  brand: string;
  email: string;
  phone: string;
  category: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  createdByAdmin: boolean;
  preMeetingNotes: string;
  postMeetingNotes: string;
  meetingAgenda: string;
  sellerProfile: {
    estimatedVolume: string;
    riskScore: string;
    notes: string;
  };
  followUpDate: string;
  followUpAction: string;
  outcome: string;
  createdAt: string;
}

interface AvailabilityEntry {
  id: string;
  date: string;
  isOpen: boolean;
  slots: string[] | null;
  note: string;
}

const DEFAULT_SLOTS = ["10:00 AM", "11:00 AM", "11:30 AM", "2:00 PM", "3:30 PM", "4:30 PM"];
const STATUS_COLORS: Record<string, string> = {
  unconfirmed: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  scheduled: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "in-progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  "no-show": "bg-gray-500/20 text-gray-400 border-gray-500/30",
  rescheduled: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};
const STATUS_LABELS: Record<string, string> = {
  unconfirmed: "⏳ Unconfirmed",
  scheduled: "🟡 Scheduled",
  confirmed: "✅ Confirmed",
  "in-progress": "🔵 In Progress",
  completed: "🟢 Completed",
  cancelled: "🔴 Cancelled",
  "no-show": "⚪ No Show",
  rescheduled: "🟠 Rescheduled",
};
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Main Admin Meetings Page ────────────────────────────
export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [activeTab, setActiveTab] = useState<"meetings" | "availability">("meetings");

  // ─── Fetch meetings ──────────────────────────────
  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "100");
      const res = await fetch(`/api/meetings?${params}`, { credentials: "include" });
      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  // ─── Update meeting ──────────────────────────────
  const updateMeeting = async (meetingId: string, updates: Partial<Meeting>) => {
    try {
      await fetch("/api/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ meetingId, ...updates }),
      });
      fetchMeetings();
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Filtered & searched meetings ────────────────
  const filteredMeetings = meetings.filter((m) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.name?.toLowerCase().includes(q) ||
        m.brand?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ─── Stats ───────────────────────────────────────
  const stats = {
    total: meetings.length,
    unconfirmed: meetings.filter((m) => m.status === "unconfirmed").length,
    upcoming: meetings.filter((m) => ["scheduled", "confirmed"].includes(m.status)).length,
    completed: meetings.filter((m) => m.status === "completed").length,
    noShow: meetings.filter((m) => m.status === "no-show").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-500" />
            Stond Meet™
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage strategy sessions, availability, and seller onboarding calls.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveTab(activeTab === "meetings" ? "availability" : "meetings")}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {activeTab === "meetings" ? (
              <><Clock className="w-4 h-4 mr-2" /> Availability</>
            ) : (
              <><CalendarDays className="w-4 h-4 mr-2" /> Meetings</>
            )}
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Meeting
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: CalendarDays, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" },
          { label: "Needs Confirm", value: stats.unconfirmed, icon: AlertCircle, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
          { label: "Upcoming", value: stats.upcoming, icon: Clock, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" },
        ].map((s, i) => (
          <Card key={i} className="p-4 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "meetings" ? (
          <motion.div
            key="meetings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, brand, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
              >
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <Button variant="outline" onClick={fetchMeetings} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Meeting List */}
            <Card className="border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/30 overflow-hidden">
              {loading ? (
                <div className="text-center py-20">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">Loading meetings...</p>
                </div>
              ) : filteredMeetings.length === 0 ? (
                <div className="text-center py-20">
                  <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400 mb-1">No Meetings Found</h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    {searchQuery ? "Try a different search term." : "Create a meeting or wait for sellers to schedule."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredMeetings.map((meeting) => (
                    <MeetingRow
                      key={meeting.id}
                      meeting={meeting}
                      isExpanded={expandedMeeting === meeting.id}
                      onToggle={() => setExpandedMeeting(expandedMeeting === meeting.id ? null : meeting.id)}
                      onUpdate={updateMeeting}
                    />
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="availability"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AvailabilityManager />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Meeting Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateMeetingModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => { setShowCreateModal(false); fetchMeetings(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Meeting Row Component ───────────────────────────────
function MeetingRow({
  meeting,
  isExpanded,
  onToggle,
  onUpdate,
}: {
  meeting: Meeting;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (id: string, updates: Partial<Meeting>) => void;
}) {
  const [preMeetingNotes, setPreMeetingNotes] = useState(meeting.preMeetingNotes || "");
  const [postMeetingNotes, setPostMeetingNotes] = useState(meeting.postMeetingNotes || "");
  const [meetingAgenda, setMeetingAgenda] = useState(meeting.meetingAgenda || "");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveNotes = async () => {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await onUpdate(meeting.id, { preMeetingNotes, postMeetingNotes, meetingAgenda } as any);
    setSaving(false);
  };

  const reschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) return;
    await onUpdate(meeting.id, {
      date: rescheduleDate,
      time: rescheduleTime,
      status: "rescheduled",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    setShowReschedule(false);
  };

  return (
    <div>
      {/* Summary Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
      >
        <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900 dark:text-white truncate">{meeting.name}</p>
            {meeting.createdByAdmin && (
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold">
                ADMIN
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
            {meeting.brand ? `${meeting.brand} · ` : ""}{meeting.email}
          </p>
        </div>
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {meeting.date ? new Date(meeting.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
          </p>
          <p className="text-xs text-slate-400">{meeting.time}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${STATUS_COLORS[meeting.status] || STATUS_COLORS.scheduled}`}>
          {STATUS_LABELS[meeting.status] || meeting.status}
        </span>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-6 pt-2 border-t border-slate-100 dark:border-slate-700/50 space-y-5">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Category", value: meeting.category || "—" },
                  { label: "Phone", value: meeting.phone || "—" },
                  { label: "Duration", value: `${meeting.duration || 30} min` },
                  { label: "Scheduled", value: meeting.createdAt ? new Date(meeting.createdAt).toLocaleDateString() : "—" },
                ].map((info, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">{info.label}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-0.5">{info.value}</p>
                  </div>
                ))}
              </div>

              {/* Seller RTO Brief */}
              {meeting.sellerProfile?.riskScore && (
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Auto-Generated Seller Brief
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Estimated RTO Risk: <strong>{meeting.sellerProfile.riskScore}</strong>
                  </p>
                  {meeting.sellerProfile.notes && (
                    <p className="text-xs text-amber-600 dark:text-amber-400/70 mt-1">{meeting.sellerProfile.notes}</p>
                  )}
                </div>
              )}

              {/* Notes Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Meeting Agenda
                  </Label>
                  <Textarea
                    value={meetingAgenda}
                    onChange={(e) => setMeetingAgenda(e.target.value)}
                    placeholder="Topics to cover during the call..."
                    className="min-h-[100px] text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Search className="w-3 h-3" /> Pre-Meeting Notes
                  </Label>
                  <Textarea
                    value={preMeetingNotes}
                    onChange={(e) => setPreMeetingNotes(e.target.value)}
                    placeholder="Research, key questions, seller context..."
                    className="min-h-[100px] text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Post-Meeting Notes
                  </Label>
                  <Textarea
                    value={postMeetingNotes}
                    onChange={(e) => setPostMeetingNotes(e.target.value)}
                    placeholder="Outcomes, action items, follow-ups..."
                    className="min-h-[100px] text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none"
                  />
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={saveNotes}
                  disabled={saving}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {saving ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                  Save Notes
                </Button>

                {/* Status quick actions */}
                {(meeting.status === "unconfirmed" || meeting.status === "scheduled") && (
                  <Button size="sm" variant="outline" onClick={() => onUpdate(meeting.id, { status: "confirmed" })}
                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10">
                    <Check className="w-3 h-3 mr-1" /> Confirm
                  </Button>
                )}
                {["unconfirmed", "scheduled", "confirmed"].includes(meeting.status) && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setShowReschedule(!showReschedule)}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-500/30 dark:text-orange-400 dark:hover:bg-orange-500/10">
                      <RefreshCw className="w-3 h-3 mr-1" /> Reschedule
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onUpdate(meeting.id, { status: "cancelled" })}
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10">
                      <Ban className="w-3 h-3 mr-1" /> Cancel
                    </Button>
                  </>
                )}
                {meeting.status === "confirmed" && (
                  <Button size="sm" variant="outline" onClick={() => onUpdate(meeting.id, { status: "completed" })}
                    className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-500/30 dark:text-green-400 dark:hover:bg-green-500/10">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Complete
                  </Button>
                )}
                {["unconfirmed", "scheduled"].includes(meeting.status) && (
                  <Button size="sm" variant="outline" onClick={() => onUpdate(meeting.id, { status: "no-show" })}
                    className="border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700">
                    <Search className="w-3 h-3 mr-1" /> No Show
                  </Button>
                )}
              </div>

              {/* Reschedule Panel */}
              <AnimatePresence>
                {showReschedule && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-orange-50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20 p-4 rounded-xl">
                      <p className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-3">Reschedule Meeting</p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <Label className="text-xs text-orange-600 dark:text-orange-400">New Date</Label>
                          <Input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="mt-1 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-orange-600 dark:text-orange-400">New Time</Label>
                          <select
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            className="w-full h-10 mt-1 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
                          >
                            <option value="">Select time</option>
                            {DEFAULT_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="flex items-end gap-2">
                          <Button size="sm" onClick={reschedule} disabled={!rescheduleDate || !rescheduleTime}
                            className="bg-orange-500 hover:bg-orange-600 text-white">
                            <Check className="w-3 h-3 mr-1" /> Apply
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowReschedule(false)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Create Meeting Modal ────────────────────────────────
function CreateMeetingModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "", brand: "", email: "", phone: "",
    category: "", date: "", time: "",
    preMeetingNotes: "", meetingAgenda: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData, createdByAdmin: true }),
      });
      const data = await res.json();
      if (data.success) onCreated();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Custom Meeting</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Schedule a session and send invite to a seller</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Seller Name *</Label>
              <Input required value={formData.name} onChange={(e) => update("name", e.target.value)}
                placeholder="Full name" className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Brand Name</Label>
              <Input value={formData.brand} onChange={(e) => update("brand", e.target.value)}
                placeholder="Brand / Company" className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email *</Label>
              <Input required type="email" value={formData.email} onChange={(e) => update("email", e.target.value)}
                placeholder="seller@example.com" className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</Label>
              <Input type="tel" value={formData.phone} onChange={(e) => update("phone", e.target.value)}
                placeholder="+91 98765 43210" className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date *</Label>
              <Input required type="date" value={formData.date} onChange={(e) => update("date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Time *</Label>
              <select
                required
                value={formData.time}
                onChange={(e) => update("time", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
              >
                <option value="">Select time</option>
                {DEFAULT_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Meeting Agenda</Label>
            <Textarea
              value={formData.meetingAgenda}
              onChange={(e) => update("meetingAgenda", e.target.value)}
              placeholder="Topics to discuss, goals for the call..."
              className="min-h-[80px] dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pre-Meeting Notes</Label>
            <Textarea
              value={formData.preMeetingNotes}
              onChange={(e) => update("preMeetingNotes", e.target.value)}
              placeholder="Seller research, context, key questions to prepare..."
              className="min-h-[80px] dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 dark:border-slate-700 dark:text-slate-300">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              {submitting ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Create & Save</>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Availability Manager ────────────────────────────────
function AvailabilityManager() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [editSlots, setEditSlots] = useState<string[]>(DEFAULT_SLOTS);
  const [editNote, setEditNote] = useState("");
  const [editOpen, setEditOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/availability?month=${monthStr}`);
      const data = await res.json();
      setAvailability(data.availability || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const getAvailForDate = (dateStr: string) =>
    availability.find((a) => a.date === dateStr);

  const selectDay = (dateStr: string) => {
    setSelectedDay(dateStr);
    const existing = getAvailForDate(dateStr);
    if (existing) {
      setEditOpen(existing.isOpen);
      setEditSlots(existing.slots || DEFAULT_SLOTS);
      setEditNote(existing.note || "");
    } else {
      setEditOpen(true);
      setEditSlots([...DEFAULT_SLOTS]);
      setEditNote("");
    }
  };

  const saveAvailability = async () => {
    if (!selectedDay) return;
    setSaving(true);
    try {
      await fetch("/api/meetings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: selectedDay,
          isOpen: editOpen,
          slots: editSlots,
          note: editNote,
        }),
      });
      await fetchAvailability();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleSlot = (slot: string) => {
    setEditSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  // Calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2 p-6 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/30">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} className="aspect-square" />;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const avail = getAvailForDate(dateStr);
            const dayOfWeek = new Date(viewYear, viewMonth, day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isClosed = avail ? !avail.isOpen : isWeekend;
            const isSelected = selectedDay === dateStr;
            const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

            return (
              <button
                key={dateStr}
                onClick={() => selectDay(dateStr)}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative w-full
                  ${isSelected
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105"
                    : isClosed
                      ? "bg-red-50 dark:bg-red-500/5 text-red-400/60 dark:text-red-400/30"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }
                  ${isToday && !isSelected ? "ring-2 ring-indigo-400/40" : ""}
                `}
              >
                <span>{day}</span>
                {avail && !isSelected && (
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${avail.isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Closed</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-2 ring-indigo-400/40 inline-block" /> Today</span>
        </div>
      </Card>

      {/* Day Editor */}
      <Card className="p-6 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/30">
        {selectedDay ? (
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                {new Date(selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Configure availability for this day</p>
            </div>

            {/* Open/Closed Toggle */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{editOpen ? "Open for Meetings" : "Closed"}</p>
                <p className="text-xs text-slate-400">{editOpen ? "Sellers can book slots" : "No meetings accepted"}</p>
              </div>
              <button
                onClick={() => setEditOpen(!editOpen)}
                className={`w-12 h-7 rounded-full transition-colors relative ${editOpen ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
              >
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${editOpen ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>

            {/* Time Slots */}
            {editOpen && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Available Slots
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {DEFAULT_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => toggleSlot(slot)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                        editSlots.includes(slot)
                          ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 line-through"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Day Note (optional)
              </Label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="e.g., Out for conference"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
              />
            </div>

            <Button
              onClick={saveAvailability}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Check className="w-4 h-4 mr-2" /> Save Availability</>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-10">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Select a Day</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Click on any date to manage availability
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
