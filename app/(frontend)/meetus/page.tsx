"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  User,
  Globe,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Send,
  CalendarDays,
  Mail,
  Phone,
  Building2,
  Tag,
} from "lucide-react";

// ─── Glass Card (replaces Card component to avoid bg-card override) ──
const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.14)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.22)",
  borderRadius: "16px",
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
};

// ─── Constants ───────────────────────────────────────────
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DEFAULT_SLOTS = ["10:00 AM","11:00 AM","11:30 AM","2:00 PM","3:30 PM","4:30 PM"];

// ─── Date Helpers ────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function isPast(year: number, month: number, day: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(year, month, day) < today;
}
function isToday(year: number, month: number, day: number) {
  const t = new Date();
  return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
}
function formatDateDisplay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── Availability Hook ───────────────────────────────────
interface AvailEntry { date: string; isOpen: boolean; slots: string[] | null; }

function useAvailability(year: number, month: number) {
  const [avail, setAvail] = useState<AvailEntry[]>([]);
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  useEffect(() => {
    fetch(`/api/meetings/availability?month=${monthStr}`)
      .then((r) => r.json())
      .then((d) => setAvail(d.availability || []))
      .catch(() => {});
  }, [monthStr]);

  const getDay = useCallback(
    (dateStr: string) => avail.find((a) => a.date === dateStr),
    [avail]
  );

  return { avail, getDay };
}

// ─── Calendar Grid ───────────────────────────────────────
function CalendarGrid({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const { getDay } = useAvailability(viewYear, viewMonth);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const prevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const cells = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [firstDay, daysInMonth]);

  const selectedParsed = selectedDate ? new Date(selectedDate + "T00:00:00") : null;

  return (
    <div style={{ userSelect: "none" }}>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          style={{
            padding: "8px", borderRadius: "8px", border: "none", background: "transparent", cursor: canGoPrev ? "pointer" : "not-allowed",
            color: canGoPrev ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
          }}
        >
          <ChevronLeft style={{ width: "20px", height: "20px" }} />
        </button>
        <h4 style={{ fontSize: "16px", fontWeight: 600, color: "white", letterSpacing: "0.03em", margin: 0 }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h4>
        <button
          onClick={nextMonth}
          style={{ padding: "8px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}
        >
          <ChevronRight style={{ width: "20px", height: "20px" }} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "8px" }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} />;

          const dateStr = toDateStr(viewYear, viewMonth, day);
          const past = isPast(viewYear, viewMonth, day);
          const todayCell = isToday(viewYear, viewMonth, day);

          // Only block past dates or admin-closed days
          const dayAvail = getDay(dateStr);
          let disabled: boolean;
          if (dayAvail) {
            disabled = !dayAvail.isOpen || past;
          } else {
            disabled = past;
          }

          const isSelected =
            selectedParsed &&
            selectedParsed.getFullYear() === viewYear &&
            selectedParsed.getMonth() === viewMonth &&
            selectedParsed.getDate() === day;

          const cellStyle: React.CSSProperties = {
            aspectRatio: "1/1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 500,
            position: "relative",
            border: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
            color: disabled
              ? "rgba(255,255,255,0.18)"
              : isSelected
                ? "white"
                : "rgba(255,255,255,0.85)",
            background: isSelected ? "rgb(249,115,22)" : "transparent",
            boxShadow: isSelected ? "0 8px 20px rgba(249,115,22,0.3)" : "none",
            transform: isSelected ? "scale(1.1)" : "none",
            outline: todayCell && !isSelected ? "1px solid rgba(249,115,22,0.5)" : "none",
          };

          return (
            <button
              key={dateStr}
              disabled={disabled}
              onClick={() => onSelectDate(dateStr)}
              style={cellStyle}
              onMouseEnter={(e) => { if (!disabled && !isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { if (!disabled && !isSelected) e.currentTarget.style.background = "transparent"; }}
            >
              {day}
              {todayCell && (
                <span style={{ position: "absolute", bottom: "2px", left: "50%", transform: "translateX(-50%)", width: "4px", height: "4px", borderRadius: "50%", background: "rgb(251,146,60)" }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Slots Loader ────────────────────────────────────────
function useSlots(selectedDate: string) {
  const [slots, setSlots] = useState<string[]>(DEFAULT_SLOTS);

  useEffect(() => {
    if (!selectedDate) return;
    fetch(`/api/meetings/availability?date=${selectedDate}`)
      .then((r) => r.json())
      .then((d) => {
        const entries = d.availability || [];
        if (entries.length > 0 && entries[0].slots && Array.isArray(entries[0].slots)) {
          setSlots(entries[0].slots);
        } else {
          setSlots(DEFAULT_SLOTS);
        }
      })
      .catch(() => setSlots(DEFAULT_SLOTS));
  }, [selectedDate]);

  return slots;
}

// ─── Status Labels ───────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  unconfirmed: { label: "Awaiting Confirmation", color: "rgb(251,191,36)" },
  scheduled: { label: "Scheduled", color: "rgb(250,204,21)" },
  confirmed: { label: "Confirmed", color: "rgb(52,211,153)" },
  "in-progress": { label: "In Progress", color: "rgb(96,165,250)" },
  completed: { label: "Completed", color: "rgb(74,222,128)" },
  cancelled: { label: "Cancelled", color: "rgb(248,113,113)" },
  "no-show": { label: "No Show", color: "rgb(156,163,175)" },
  rescheduled: { label: "Rescheduled", color: "rgb(251,146,60)" },
};

// ─── Shared Page Wrapper ─────────────────────────────────
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-[100vh] -mt-[80px] pt-[140px] pb-16 flex items-start justify-center px-4 relative overflow-hidden"
      style={{ backgroundImage: "url('/slide-screenshot.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }} />
      <div style={{ position: "absolute", top: "-160px", left: "-160px", width: "320px", height: "320px", background: "rgba(249,115,22,0.2)", borderRadius: "50%", filter: "blur(100px)" }} />
      <div style={{ position: "absolute", bottom: "-160px", right: "-160px", width: "320px", height: "320px", background: "rgba(59,130,246,0.2)", borderRadius: "50%", filter: "blur(100px)" }} />
      {children}
    </div>
  );
}

// ─── Main Page (User-Only) ───────────────────────────────
export default function StondMeetPage() {
  const { user, isLoading: authLoading } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [existingMeetings, setExistingMeetings] = useState<any[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>(DEFAULT_SLOTS);

  // Fetch available slots when reschedule date changes
  useEffect(() => {
    if (!rescheduleDate) { setRescheduleSlots(DEFAULT_SLOTS); return; }
    fetch(`/api/meetings/availability?date=${rescheduleDate}`)
      .then((r) => r.json())
      .then((d) => {
        const entries = d.availability || [];
        if (entries.length > 0 && entries[0].slots && Array.isArray(entries[0].slots)) {
          setRescheduleSlots(entries[0].slots);
        } else {
          setRescheduleSlots(DEFAULT_SLOTS);
        }
      })
      .catch(() => setRescheduleSlots(DEFAULT_SLOTS));
    setRescheduleTime("");
  }, [rescheduleDate]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formCategory, setFormCategory] = useState("");

  const timeSlots = useSlots(selectedDate);

  // Fetch existing meetings for logged-in user
  useEffect(() => {
    if (user && user.email) {
      setLoadingMeetings(true);
      fetch("/api/meetings", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          const meetings = d.meetings || [];
          setExistingMeetings(meetings);
          if (meetings.length === 0) setShowBooking(true);
        })
        .catch(() => setShowBooking(true))
        .finally(() => setLoadingMeetings(false));
    } else if (!authLoading) {
      setShowBooking(true);
    }
  }, [user, authLoading]);

  // Prefill from auth
  useEffect(() => {
    if (user) {
      setFormName(user.username || "");
      setFormEmail(user.email || "");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFormPhone((user as any).phone || "");
    }
  }, [user]);

  const refreshMeetings = () => {
    if (!user) return;
    fetch("/api/meetings", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setExistingMeetings(d.meetings || []))
      .catch(() => {});
  };

  const cancelMeeting = async (id: string) => {
    try {
      await fetch("/api/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ meetingId: id, status: "cancelled" }),
      });
      refreshMeetings();
    } catch {}
  };

  const rescheduleMeeting = async () => {
    if (!rescheduleId || !rescheduleDate || !rescheduleTime) return;
    try {
      await fetch("/api/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ meetingId: rescheduleId, date: rescheduleDate, time: rescheduleTime, status: "rescheduled" }),
      });
      setRescheduleId(null);
      setRescheduleDate("");
      setRescheduleTime("");
      refreshMeetings();
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formName, brand: formBrand, email: formEmail,
          phone: formPhone, category: formCategory,
          date: selectedDate, time: selectedTime,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
        refreshMeetings();
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success Screen ─────────────────────────────────
  if (isSubmitted) {
    return (
      <PageWrapper>
        <div style={{ ...glassCard, width: "100%", maxWidth: "480px", padding: "48px", textAlign: "center", position: "relative", zIndex: 10 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            style={{ width: "80px", height: "80px", background: "rgb(16,185,129)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}
          >
            <CheckCircle2 style={{ width: "40px", height: "40px", color: "white" }} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 style={{ fontSize: "28px", fontWeight: 700, color: "white", marginBottom: "12px" }}>You&apos;re Scheduled.</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>Calendar invite sent. See you soon.</p>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", margin: "24px 0 32px" }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>{formatDateDisplay(selectedDate)}</p>
              <p style={{ fontSize: "14px", color: "rgb(251,146,60)" }}>{selectedTime} · 15 min</p>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Button
                onClick={() => { setIsSubmitted(false); setShowBooking(false); setSelectedDate(""); setSelectedTime(""); }}
                variant="ghost"
                className="border border-white/20 hover:bg-white/10"
                style={{ color: "white" }}
              >
                View Sessions
              </Button>
              <Button
                onClick={() => { setIsSubmitted(false); setSelectedDate(""); setSelectedTime(""); }}
                className="bg-orange-500 hover:bg-orange-600"
                style={{ color: "white" }}
              >
                Book Another
              </Button>
            </div>
          </motion.div>
        </div>
      </PageWrapper>
    );
  }

  // ─── User Sessions Dashboard ────────────────────────
  if (user && existingMeetings.length > 0 && !showBooking && !loadingMeetings) {
    const activeMeetings = existingMeetings.filter((m) => m.status !== "cancelled" && m.status !== "completed");
    const pastMeetings = existingMeetings.filter((m) => m.status === "cancelled" || m.status === "completed");

    return (
      <PageWrapper>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: "768px", width: "100%", margin: "0 auto", position: "relative", zIndex: 10 }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", padding: "6px 16px", borderRadius: "9999px", color: "rgb(251,146,60)" }}>
              Stond Meet™ · Your Sessions
            </span>
          </div>

          <div style={{ ...glassCard, padding: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: 700, color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CalendarDays style={{ width: "24px", height: "24px", color: "rgb(251,146,60)" }} />
                  Your Sessions
                </h2>
                <p style={{ fontSize: "14px", marginTop: "4px", color: "rgba(255,255,255,0.5)" }}>
                  {activeMeetings.length} upcoming · {pastMeetings.length} past
                </p>
              </div>
              <Button
                onClick={() => setShowBooking(true)}
                className="bg-orange-500 hover:bg-orange-600 rounded-xl shadow-lg shadow-orange-500/20"
                style={{ color: "white" }}
              >
                <CalendarDays style={{ width: "16px", height: "16px", marginRight: "8px" }} /> Book New
              </Button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {existingMeetings.map((meeting: any, i: number) => {
                const status = STATUS_MAP[meeting.status] || STATUS_MAP.unconfirmed;
                const isCancelled = meeting.status === "cancelled";
                const isCompleted = meeting.status === "completed";

                return (
                  <motion.div
                    key={meeting.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      padding: "20px",
                      borderRadius: "16px",
                      border: `1px solid ${isCancelled || isCompleted ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)"}`,
                      background: isCancelled || isCompleted ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)",
                      opacity: isCancelled ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                      <div style={{ flexShrink: 0, width: "56px", height: "56px", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(249,115,22,0.15)" }}>
                        <span style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1, color: "rgb(251,146,60)" }}>
                          {meeting.date ? new Date(meeting.date + "T00:00:00").getDate() : "—"}
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", marginTop: "2px", color: "rgba(251,146,60,0.7)" }}>
                          {meeting.date ? new Date(meeting.date + "T00:00:00").toLocaleDateString("en-US", { month: "short" }) : ""}
                        </span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <p style={{ fontWeight: 600, fontSize: "14px", color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            Strategy Call · {meeting.time}
                          </p>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "9999px", flexShrink: 0, color: status.color, background: status.color + "15", border: `1px solid ${status.color}30` }}>
                            {status.label}
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {meeting.brand ? `${meeting.brand} · ` : ""}{meeting.date ? formatDateDisplay(meeting.date) : ""}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                          <span style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", color: "rgba(255,255,255,0.3)" }}>
                            <Clock style={{ width: "12px", height: "12px" }} /> 15 min
                          </span>
                          <span style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", color: "rgba(255,255,255,0.3)" }}>
                            <Globe style={{ width: "12px", height: "12px" }} /> IST
                          </span>
                        </div>
                      </div>

                      {!isCancelled && !isCompleted && (
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                          <button
                            onClick={() => { setRescheduleId(meeting.id); setRescheduleDate(""); setRescheduleTime(""); }}
                            style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(251,146,60,0.3)", background: "transparent", color: "rgb(251,146,60)", cursor: "pointer" }}
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => cancelMeeting(meeting.id)}
                            style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(248,113,113,0.2)", background: "transparent", color: "rgba(248,113,113,0.8)", cursor: "pointer" }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ─── Reschedule Modal ─── */}
          <AnimatePresence>
            {rescheduleId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
                onClick={() => setRescheduleId(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ ...glassCard, width: "100%", maxWidth: "440px", padding: "36px", maxHeight: "85vh", overflowY: "auto" }}
                >
                  {/* Modal Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: 700, color: "white", margin: 0 }}>Reschedule Session</h3>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>Pick a new date & time</p>
                    </div>
                    <button
                      onClick={() => setRescheduleId(null)}
                      style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Calendar */}
                  <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                    <CalendarGrid
                      selectedDate={rescheduleDate}
                      onSelectDate={(d) => { setRescheduleDate(d); setRescheduleTime(""); }}
                    />
                  </div>

                  {/* Time Slots */}
                  {rescheduleDate && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <p style={{ fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>
                        Available times · {formatDateDisplay(rescheduleDate)}
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "20px" }}>
                        {rescheduleSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setRescheduleTime(time)}
                            style={{
                              padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: 500,
                              border: rescheduleTime === time ? "1px solid rgb(249,115,22)" : "1px solid rgba(255,255,255,0.1)",
                              background: rescheduleTime === time ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)",
                              color: rescheduleTime === time ? "rgb(251,146,60)" : "rgba(255,255,255,0.7)",
                              cursor: "pointer", transition: "all 0.15s ease",
                            }}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Confirm Button */}
                  <Button
                    onClick={rescheduleMeeting}
                    disabled={!rescheduleDate || !rescheduleTime}
                    className="w-full bg-orange-500 hover:bg-orange-600 h-11 rounded-xl shadow-lg shadow-orange-500/20"
                    style={{ color: "white", opacity: !rescheduleDate || !rescheduleTime ? 0.4 : 1 }}
                  >
                    <CalendarDays style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                    {rescheduleDate && rescheduleTime
                      ? `Reschedule to ${rescheduleTime}`
                      : "Select date & time"}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginTop: "32px", textAlign: "center", paddingBottom: "32px" }}>
            <p style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
              Built by Stond Labs &bull; &copy; 2026
            </p>
          </div>
        </motion.div>
      </PageWrapper>
    );
  }

  // ─── Main Booking UI ────────────────────────────────
  return (
    <PageWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: "960px", width: "100%", margin: "0 auto", position: "relative", zIndex: 10 }}
      >
        {/* Header badge */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", padding: "6px 16px", borderRadius: "9999px", color: "rgb(251,146,60)" }}>
            Stond Meet™ · Private Seller Onboarding
          </span>
        </div>

        <div style={{ ...glassCard, overflow: "hidden" }}>
          <div style={{ display: "flex", flexDirection: "row", minHeight: "580px" }} className="flex-col lg:flex-row">

            {/* ──── Left Column: Authority Panel ──── */}
            <div style={{ padding: "48px", borderRight: "1px solid rgba(255,255,255,0.1)" }} className="w-full lg:w-5/12 border-b lg:border-b-0 lg:border-r flex flex-col justify-center">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "12px", lineHeight: 1.2, color: "white" }}>
                  Strategy Call:{" "}
                  <span style={{ background: "linear-gradient(to right, rgb(251,146,60), rgb(249,115,22))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Scale with Stondemporium
                  </span>
                </h1>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", marginBottom: "40px", fontWeight: 300, lineHeight: 1.6 }}>
                  Private 15-min session to onboard your brand and optimize for scale.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {[
                    { icon: Clock, title: "15 minutes", sub: "Duration" },
                    { icon: User, title: "Ralston D'souza", sub: "Founder, Stondemporium" },
                    { icon: Globe, title: "IST (GMT+5:30)", sub: "Timezone" },
                    { icon: TrendingUp, title: "AI-powered logistics, RTO reduction", sub: "Focus" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ height: "40px", width: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <item.icon style={{ width: "20px", height: "20px", color: "rgb(251,146,60)" }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, color: "white", fontSize: "14px" }}>{item.title}</p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {user && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ marginTop: "32px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}
                  >
                    <div style={{ height: "32px", width: "32px", borderRadius: "50%", background: "rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User style={{ width: "16px", height: "16px", color: "rgb(251,146,60)" }} />
                    </div>
                    <div>
                      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", fontWeight: 500 }}>Signed in as {user.username}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{user.email}</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* ──── Right Column: Calendar + Form ──── */}
            <div style={{ padding: "48px" }} className="w-full lg:w-7/12 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {!selectedTime ? (
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar style={{ width: "20px", height: "20px", color: "rgb(251,146,60)" }} />
                      Select a Date & Time
                    </h3>

                    {/* Custom Calendar Grid */}
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
                      <CalendarGrid
                        selectedDate={selectedDate}
                        onSelectDate={(d) => { setSelectedDate(d); setSelectedTime(""); }}
                      />
                    </div>

                    {/* Time Slots */}
                    <AnimatePresence>
                      {selectedDate && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: "12px" }}>
                            Available Times · {formatDateDisplay(selectedDate)}
                          </label>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                            {timeSlots.map((time) => (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                style={{
                                  padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: 500,
                                  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
                                  color: "rgba(255,255,255,0.7)", cursor: "pointer", transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "rgba(249,115,22,0.2)";
                                  e.currentTarget.style.borderColor = "rgba(249,115,22,0.4)";
                                  e.currentTarget.style.color = "white";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                                }}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginTop: "12px", textAlign: "center" }}>
                            IST timezone
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Back + Header */}
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
                      <button onClick={() => setSelectedTime("")} style={{ marginRight: "12px", padding: "8px", borderRadius: "12px", border: "none", background: "transparent", cursor: "pointer", color: "rgba(255,255,255,0.5)" }} aria-label="Back">
                        <ChevronLeft style={{ width: "20px", height: "20px" }} />
                      </button>
                      <h3 style={{ fontSize: "20px", fontWeight: 600, color: "white" }}>Enter Details</h3>
                    </div>

                    {/* Selected date/time card */}
                    <div style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", padding: "16px", borderRadius: "12px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ height: "40px", width: "40px", borderRadius: "12px", background: "rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CalendarDays style={{ width: "20px", height: "20px", color: "rgb(251,146,60)" }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 500, color: "white" }}>{formatDateDisplay(selectedDate)}</p>
                        <p style={{ fontSize: "12px", color: "rgb(251,146,60)" }}>{selectedTime} · 15 Min Session</p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <Label className="text-sm flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.85)", marginBottom: "6px" }}>
                          <User style={{ width: "14px", height: "14px" }} /> Full Name
                        </Label>
                        <Input
                          required type="text" value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="h-11 focus:ring-orange-500"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label className="text-sm flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.85)", marginBottom: "6px" }}>
                          <Building2 style={{ width: "14px", height: "14px" }} /> Brand Name
                        </Label>
                        <Input
                          required type="text" value={formBrand}
                          onChange={(e) => setFormBrand(e.target.value)}
                          className="h-11 focus:ring-orange-500"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}
                          placeholder="Acme Corp"
                        />
                      </div>
                      <div>
                        <Label className="text-sm flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.85)", marginBottom: "6px" }}>
                          <Mail style={{ width: "14px", height: "14px" }} /> Email Address
                        </Label>
                        <Input
                          required type="email" value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          className="h-11 focus:ring-orange-500"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label className="text-sm flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.85)", marginBottom: "6px" }}>
                          <Phone style={{ width: "14px", height: "14px" }} /> Phone <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>(Optional)</span>
                        </Label>
                        <Input
                          type="tel" value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          className="h-11 focus:ring-orange-500"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div>
                        <Label className="text-sm flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.85)", marginBottom: "6px" }}>
                          <Tag style={{ width: "14px", height: "14px" }} /> What category do you sell?
                        </Label>
                        <select
                          required value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          style={{ width: "100%", height: "44px", padding: "0 12px", borderRadius: "6px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)", fontSize: "14px", appearance: "none" }}
                        >
                          <option value="" disabled style={{ background: "#111827", color: "white" }}>Select a category</option>
                          <option value="electronics" style={{ background: "#111827", color: "white" }}>Electronics</option>
                          <option value="fashion" style={{ background: "#111827", color: "white" }}>Fashion &amp; Apparel</option>
                          <option value="beauty" style={{ background: "#111827", color: "white" }}>Health &amp; Beauty</option>
                          <option value="home" style={{ background: "#111827", color: "white" }}>Home &amp; Furniture</option>
                          <option value="jewellery" style={{ background: "#111827", color: "white" }}>Jewellery &amp; Accessories</option>
                          <option value="food" style={{ background: "#111827", color: "white" }}>Food &amp; Beverages</option>
                          <option value="other" style={{ background: "#111827", color: "white" }}>Other</option>
                        </select>
                      </div>

                      {error && (
                        <p style={{ color: "rgb(248,113,113)", fontSize: "14px", background: "rgba(239,68,68,0.1)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</p>
                      )}

                      <div style={{ paddingTop: "12px" }}>
                        <Button
                          type="submit" disabled={isSubmitting}
                          className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base font-medium rounded-xl shadow-lg shadow-orange-500/20"
                          style={{ color: "white" }}
                        >
                          {isSubmitting ? (
                            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Scheduling...
                            </span>
                          ) : (
                            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              Schedule Session <Send style={{ width: "16px", height: "16px" }} />
                            </span>
                          )}
                        </Button>
                        <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "16px", padding: "0 16px", lineHeight: 1.5 }}>
                          By scheduling, you agree to Stondemporium&apos;s Terms of Service. Platform evaluation may apply.
                        </p>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "32px", textAlign: "center", paddingBottom: "32px" }}>
          <p style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
            Built by Stond Labs &bull; &copy; 2026
          </p>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
