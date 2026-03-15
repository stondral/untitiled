"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

interface StepUpModalProps {
  /** What action is being protected (e.g. "ban_seller", "kick_user") */
  action: string;
  /** Target entity ID for audit trail */
  targetId?: string;
  /** Title shown in the modal */
  title: string;
  /** Description of what will happen */
  description: string;
  /** Called after TOTP verification succeeds */
  onVerified: () => void;
  /** Optional: Handle verification manually in parent. Receives token. */
  onVerifyToken?: (token: string) => Promise<{ success: boolean; error?: string }>;
  /** Called when modal is closed/cancelled */
  onCancel: () => void;
  /** If true, ignores existing elevated session and always asks for a code */
  forceStepUp?: boolean;
}

/**
 * Reusable Step-Up Authentication Modal for high-risk admin operations.
 *
 * Flow:
 * 1. Checks if admin already has elevated session (5min window)
 * 2. If elevated AND not in force mode → execute directly
 * 3. If not → show TOTP entry modal
 * 4. On verify → grant 5min elevation + execute action
 */
export default function StepUpModal({
  action,
  targetId,
  title,
  description,
  onVerified,
  onVerifyToken,
  onCancel,
  forceStepUp = false,
}: StepUpModalProps) {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(!forceStepUp);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Check if already elevated on mount
  useEffect(() => {
    // If we're forcing a step-up, skip the initial elevation check
    if (forceStepUp) {
      setChecking(false);
      return;
    }

    fetch("/api/admin/2fa/step-up", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.twoFactorEnabled) {
          setTwoFactorEnabled(false);
          setChecking(false);
          return;
        }
        if (data.elevated) {
          // Already elevated — execute directly
          onVerified();
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceStepUp]);

  const verify = async () => {
    if (!code || code.length < 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      if (onVerifyToken) {
        // Manual mode
        const result = await onVerifyToken(code);
        if (result.success) {
          onVerified();
        } else {
          setError(result.error || "Verification failed.");
        }
        return;
      }

      const res = await fetch("/api/admin/2fa/step-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: code, action, targetId }),
      });

      const data = await res.json();

      if (data.verified) {
        onVerified();
      } else {
        setError(data.error || "Invalid code. Please try again.");
      }
    } catch {
      setError("Verification failed. Check your connection.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 text-slate-900 dark:text-white"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden"
      >
        {checking ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Checking Security Status...</p>
          </div>
        ) : !twoFactorEnabled ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black mb-3">2FA Recommended</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              This is a high-risk action. To proceed, please enable **Google Authenticator** in your settings first.
            </p>
            <Button onClick={onCancel} className="w-full h-12 text-base font-black rounded-2xl">
              Go to Settings
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Red top accent */}
            <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-600 to-red-500" />
            
            <div className="p-8">
              {/* Header */}
              <div className="flex items-start gap-5 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <Lock className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-red-600 dark:text-red-400 leading-tight">{title}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">{description}</p>
                </div>
              </div>

              {/* Security Banner */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8">
                <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold leading-snug">
                  Enter the 6-digit verification code from your authenticator app to authorize this action.
                </p>
              </div>

              {/* Code input */}
              <div className="space-y-3 mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">
                  Security Token
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="h-16 text-center text-4xl tracking-[0.5em] font-black bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-red-500/10 transition-all"
                  maxLength={6}
                  onKeyDown={(e) => e.key === "Enter" && verify()}
                  autoFocus
                />
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dynamic Token resets in 30s</span>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/30 mb-6"
                >
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400 font-black uppercase tracking-tight">{error}</p>
                </motion.div>
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  className="flex-1 h-12 font-black text-slate-500 hover:text-slate-700 dark:hover:text-white rounded-2xl"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button
                  onClick={verify}
                  disabled={code.length < 6 || verifying}
                  className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-xl shadow-red-500/25 transition-all active:scale-95"
                >
                  {verifying ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      <span>Verify Agent</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
