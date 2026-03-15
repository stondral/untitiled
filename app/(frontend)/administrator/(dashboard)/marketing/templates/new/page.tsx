"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Mail,
  Edit,
  Eye,
  RefreshCw,
  Save,
  Rocket,
  Lock,
  Unlock,
  Code2,
  FileText
} from "lucide-react";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SHELL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(to bottom, #ffffff, #fff5f0);">
    <div style="background: white; border-radius: 32px; padding: 48px 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
      <div style="text-align: center; margin-bottom: 48px;">
        <img src="https://res.cloudinary.com/ddyp4krsd/image/upload/v1769238624/logoston_rsgzgk.jpg" alt="Stondemporium" style="width: 140px; height: auto; margin-bottom: 24px;" />
        <div style="height: 2px; width: 60px; background: linear-gradient(to right, #f97316, #fb923c); margin: 0 auto; border-radius: 2px;"></div>
      </div>
      
      <div style="color: #334155; font-size: 16px; line-height: 1.8; font-weight: 500;">
        {{CONTENT}}
      </div>
      
      <div style="margin-top: 60px; padding-top: 40px; border-top: 2px dashed #f1f5f9; text-align: center;">
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">
          Questions? We're here to help! Reach out to us anytime at 
          <a href="mailto:stondemporiums@gmail.com" style="color: #f97316; text-decoration: none; font-weight: 700;">stondemporiums@gmail.com</a>
        </p>
        <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 24px;">
           <span style="color: #cbd5e1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 800;">Premium</span>
           <span style="color: #f97316; font-size: 11px; font-weight: 800;">•</span>
           <span style="color: #cbd5e1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 800;">Sustainable</span>
           <span style="color: #f97316; font-size: 11px; font-weight: 800;">•</span>
           <span style="color: #cbd5e1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 800;">India</span>
        </div>
        <p style="color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin: 0;">
          🌟 Stondemporium • Empowering India's Innovation
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

export default function NewTemplatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    isStandard: false,
    plainContent: "",
    shellUnlocked: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [editorTab, setEditorTab] = useState<"content" | "html">("content");

  async function handleTemplateSave(e: React.FormEvent) {
    if (e) e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push("/administrator/marketing/templates");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  const toggleStandard = (checked: boolean) => {
    setFormData(prev => {
        const newState = { ...prev, isStandard: checked };
        if (checked && !prev.shellUnlocked) {
            newState.body = SHELL_TEMPLATE.replace("{{CONTENT}}", (prev.plainContent || prev.body).replace(/\n/g, "<br/>"));
        }
        return newState;
    });
  };

  const unlockShell = () => {
    setFormData(prev => ({ ...prev, shellUnlocked: true }));
    setEditorTab("html");
  };

  const updateBody = (val: string) => {
    if (formData.isStandard && !formData.shellUnlocked && editorTab === "content") {
      const merged = SHELL_TEMPLATE.replace("{{CONTENT}}", val.replace(/\n/g, "<br/>"));
      setFormData(prev => ({ ...prev, plainContent: val, body: merged }));
    } else {
      setFormData(prev => ({ ...prev, body: val }));
    }
  };

  const insertVar = (v: string) => {
    const current = (formData.isStandard && !formData.shellUnlocked && editorTab === "content")
      ? formData.plainContent 
      : formData.body;
    const newVal = current + ` {${v}} `;
    updateBody(newVal);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/administrator/marketing/templates">
            <Button variant="ghost" size="icon" className="rounded-2xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">New Outreach Template</h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Design high-conversion messages</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[2.5rem]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button 
                  onClick={() => setView("edit")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-black transition-all",
                    view === "edit" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Edit className="w-4 h-4 inline mr-2" /> Design
                </button>
                <button 
                  onClick={() => setView("preview")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-black transition-all",
                    view === "preview" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Eye className="w-4 h-4 inline mr-2" /> Live Preview
                </button>
              </div>
            </div>

            {view === "edit" ? (
              <form id="template-form" onSubmit={handleTemplateSave} className="space-y-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Internal Title</Label>
                    <Input 
                      required 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Post-Show Case Study"
                      className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Subject</Label>
                    <Input 
                      required 
                      value={formData.subject} 
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="Saw you in {college}!"
                      className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 font-bold text-lg"
                    />
                  </div>
                </div>

                <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/10 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                      formData.isStandard ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"
                    )}>
                      {formData.isStandard ? <Lock className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-black text-sm dark:text-white uppercase tracking-tight">Use Standard Template</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Branded Shell: Header, Footer & Logo</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={formData.isStandard}
                    onChange={(e) => toggleStandard(e.target.checked)}
                    className="h-6 w-6 rounded-lg border-2 border-indigo-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                  />
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button 
                        type="button"
                        onClick={() => setEditorTab("content")}
                        className={cn(
                          "px-4 py-2 rounded-lg text-[10px] font-black transition-all",
                          editorTab === "content" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        <FileText className="w-3 h-3 inline mr-2" /> Message
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditorTab("html")}
                        className={cn(
                          "px-4 py-2 rounded-lg text-[10px] font-black transition-all",
                          editorTab === "html" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        <Code2 className="w-3 h-3 inline mr-2" /> Source HTML
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 justify-end max-w-[50%]">
                      {['name', 'company', 'college', 'industry', 'personalization', 'position'].map(v => (
                        <button 
                          key={v}
                          type="button"
                          onClick={() => insertVar(v)}
                          className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 transition-all"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="relative group">
                    {editorTab === "content" && formData.isStandard && !formData.shellUnlocked ? (
                      <>
                        <Textarea 
                          required 
                          value={formData.plainContent} 
                          onChange={(e) => updateBody(e.target.value)}
                          placeholder="Type your message here..."
                          className="min-h-[500px] font-mono text-base leading-relaxed dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] resize-y scroll-py-8 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                        <div className="absolute top-4 right-4 flex items-center gap-3">
                          <div className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                            ✨ Branded Shell Active
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Textarea 
                          required 
                          value={formData.body} 
                          onChange={(e) => updateBody(e.target.value)}
                          placeholder="Enter your custom HTML structure here..."
                          className="min-h-[500px] font-mono text-sm leading-relaxed dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] resize-y scroll-py-8 focus:ring-4 focus:ring-indigo-500/5 transition-all text-indigo-600 dark:text-indigo-400"
                        />
                        {formData.isStandard && !formData.shellUnlocked && (
                          <div className="absolute top-4 right-4 group-hover:opacity-100 opacity-60 transition-opacity">
                            <Button 
                              type="button"
                              onClick={unlockShell}
                              variant="secondary"
                              className="h-8 rounded-full text-[10px] font-black bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-orange-500"
                            >
                              <Unlock className="w-3 h-3 mr-2" /> Detach from Shell
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {formData.isStandard && !formData.shellUnlocked && editorTab === "content" && (
                    <p className="text-[10px] font-bold text-slate-400 px-4">
                      Note: Branded shell (header/footer/logo) is locked. Your text is live-synced into the template.
                    </p>
                  )}
                </div>
              </form>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Subject</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    {formData.subject
                      .replace(/{name}/g, "Rahul")
                      .replace(/{company}/g, "TechFlow")
                      .replace(/{college}/g, "IIT Bombay")
                      .replace(/{industry}/g, "Fintech")
                      .replace(/{personalization}/g, "your recent article")
                      .replace(/{position}/g, "CTO")}
                  </p>
                </div>
                <div className="p-10 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 min-h-[400px] shadow-inner shadow-slate-100 dark:shadow-none">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: formData.body
                        .replace(/{name}/g, "Rahul")
                        .replace(/{company}/g, "TechFlow")
                        .replace(/{college}/g, "IIT Bombay")
                        .replace(/{industry}/g, "Fintech")
                        .replace(/{personalization}/g, "your recent article")
                        .replace(/{position}/g, "CTO")
                    }} 
                    className="prose prose-sm dark:prose-invert max-w-none text-base leading-relaxed"
                  />
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="font-black">Ready to Launch?</h3>
            </div>
            <p className="text-sm text-slate-500 font-bold leading-relaxed mb-8">
              Templates support full HTML for rich formatting. Use the intelligence tags on the left to personalize every send.
            </p>
            <div className="space-y-3">
              <Button 
                form="template-form"
                type="submit" 
                disabled={submitting} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-14 rounded-2xl font-black shadow-xl shadow-indigo-500/20"
              >
                {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save & Publish</>}
              </Button>
              <Link href="/administrator/marketing/templates">
                <Button variant="ghost" className="w-full h-12 font-bold rounded-xl text-slate-500 hover:text-red-500 transition-colors">
                  Discard Draft
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-8 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem]">
            <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-4 ml-1">Advanced Variables</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">Industry Hub</span>
                <code className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-500">{"{industry}"}</code>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">Academic Background</span>
                <code className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-500">{"{college}"}</code>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">Custom Hook</span>
                <code className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-500">{"{personalization}"}</code>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
