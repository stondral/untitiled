"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield, Lock, Laptop, Globe, Fingerprint,
  QrCode, ShieldCheck, ShieldAlert,
  Smartphone, Copy, X
} from "lucide-react";
import Image from "next/image";
import StepUpModal from "@/components/admin/StepUpModal";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/admin/2fa/step-up", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setTwoFactorEnabled(data.twoFactorEnabled);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startSetup = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/2fa/setup", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setSetupData(data);
        setShowSetup(true);
      } else {
        setError(data.error || "Failed to start 2FA setup");
      }
    } catch {
      setError("Connection error");
    }
  };

  const verifyAndEnable = async () => {
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/admin/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: verificationCode }),
      });
      const data = await res.json();
      if (data.verified) {
        setTwoFactorEnabled(true);
        setShowSetup(false);
        setSetupData(null);
        setVerificationCode("");
      } else {
        setError(data.error || "Invalid verification code");
      }
    } catch {
      setError("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const disable2FA = async (token: string) => {
    try {
      const res = await fetch("/api/admin/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setTwoFactorEnabled(false);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch {
      return { success: false, error: "Connection error" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter">Settings</h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Security & site configuration</p>
      </div>

      <div className="grid gap-6">
        {/* Security Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Shield className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-black tracking-tight">Account Security</h2>
          </div>

          <Card className="p-6 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  twoFactorEnabled ? "bg-emerald-500/10" : "bg-slate-500/10"
                }`}>
                  <Fingerprint className={`w-6 h-6 ${twoFactorEnabled ? "text-emerald-500" : "text-slate-400"}`} />
                </div>
                <div>
                  <h3 className="font-black text-base">Two-Factor Authentication (TOTP)</h3>
                  <p className="text-sm text-slate-500 max-w-md mt-1 leading-relaxed">
                    Protect your high-risk admin actions (banning users, vetoing products) with Google Authenticator.
                  </p>
                  
                  <div className="mt-4 flex items-center gap-2">
                    {twoFactorEnabled ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-bold">
                        <ShieldCheck className="w-3 h-3" /> Enabled
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[11px] font-bold">
                        <ShieldAlert className="w-3 h-3" /> Disabled
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!twoFactorEnabled ? (
                <Button onClick={startSetup} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  Enable 2FA
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setShowDisableConfirm(true)} className="border-red-200 text-red-500 hover:bg-red-50 dark:border-red-500/30">
                  Disable
                </Button>
              )}
            </div>

            {/* Step-up requirement info */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-xl flex gap-3">
              <Lock className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                <strong>Note:</strong> Once enabled, destructive actions like kicking sellers will require a 6-digit code. Verified sessions last for 5 minutes.
              </p>
            </div>
          </Card>
        </section>

        {/* Other Settings Placeholders */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Globe className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-black tracking-tight">Platform Configuration</h2>
          </div>
          <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent">
            <div className="max-w-xs mx-auto">
              <Laptop className="w-10 h-10 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-500 mb-1">More Settings Coming Soon</h3>
              <p className="text-xs text-slate-400">Manage site-wide maintenance mode, global commissions, and delivery partner API keys here.</p>
            </div>
          </Card>
        </section>
      </div>

      {/* 2FA Setup Modal */}
      <AnimatePresence>
        {showSetup && setupData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-black">Link Authenticator</h3>
                  </div>
                  <button onClick={() => setShowSetup(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* QR Code */}
                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 mx-auto w-fit">
                      <Image src={setupData.qrDataUrl} alt="QR Code" width={160} height={160} className="rounded-lg" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Step 1: Scan QR</p>
                      <p className="text-[11px] text-slate-500 mt-1">Scan this code with Google Authenticator or Authy.</p>
                    </div>
                  </div>

                  {/* Secret Entry */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Manual Entry Code</label>
                      <div className="flex gap-2">
                        <Input readOnly value={setupData.secret} className="h-10 text-xs font-mono bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                        <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(setupData.secret)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Step 2: Verify Code</label>
                      <Input
                        placeholder="000 000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="h-12 text-center text-2xl tracking-[0.4em] font-mono bg-indigo-500/5 border-indigo-500/30"
                        maxLength={6}
                      />
                      {error && <p className="text-[11px] text-red-500 font-bold">{error}</p>}
                      <Button
                        disabled={verificationCode.length < 6 || verifying}
                        onClick={verifyAndEnable}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 shadow-lg shadow-indigo-500/20"
                      >
                        {verifying ? "Enabling..." : "Verify & Enable"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-2 justify-center">
                <Smartphone className="w-3 h-3 text-slate-400" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Keep your original device safe</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Disable confirmation with StepUp! */}
      <AnimatePresence>
        {showDisableConfirm && (
          <StepUpModal
            action="disable_2fa"
            title="Disable 2FA Security"
            description="You are about to remove your biggest layer of protection. This will allow risky actions without a code."
            onVerified={() => setShowDisableConfirm(false)} 
            onVerifyToken={disable2FA} 
            forceStepUp={true}
            onCancel={() => setShowDisableConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
