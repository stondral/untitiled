"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Download, 
    Upload, 
    X, 
    CheckCircle2, 
    CircleAlert as AlertCircle, 
    ArrowLeft,
    FileText,
    Database,
    HelpCircle,
    RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";


export default function LeadImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState<{ created: number; skipped: number; invalid: number } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').filter(r => r.trim());
            const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
            const data = rows.slice(1, 6).map(row => {
                const values = row.split(',').map(v => v.trim());
                const obj: Record<string, string> = {};
                headers.forEach((h, i) => obj[h] = values[i]);
                return obj;
            });
            setPreviewData(data);
        };
        reader.readAsText(f);
    };

    const handleImport = async () => {
        if (!file) return;
        setImporting(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                const rows = text.split('\n').filter(r => r.trim());
                const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
                const leads = rows.slice(1).map(row => {
                    const values = row.split(',').map(v => v.trim());
                    const obj: Record<string, string> = {};
                    headers.forEach((h, i) => obj[h] = values[i]);
                    return obj;
                });

                const res = await fetch("/api/marketing/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ leads }),
                });
                const data = await res.json();
                setResults(data.results);
            };
            reader.readAsText(file);
        } catch (e) {
            console.error(e);
        } finally {
            setImporting(false);
        }
    };

    if (results) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <div className="h-24 w-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </div>
                    <h1 className="text-4xl font-black mb-2 dark:text-white">Intelligence Ingested!</h1>
                    <p className="text-slate-500 font-bold max-w-sm mx-auto">Your CRM has been successfully updated with the latest workspace data.</p>
                    
                    <div className="grid grid-cols-3 gap-4 mt-12 max-w-lg mx-auto">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                            <p className="text-3xl font-black text-indigo-500">{results.created}</p>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Created</p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                            <p className="text-3xl font-black text-slate-400">{results.skipped}</p>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Skipped</p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                            <p className="text-3xl font-black text-red-400">{results.invalid}</p>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Invalid</p>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/administrator/marketing">
                            <Button className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 h-14 rounded-2xl font-black shadow-xl">
                                Back to Leads
                            </Button>
                        </Link>
                        <Button variant="ghost" onClick={() => { setFile(null); setResults(null); }} className="h-14 px-8 font-bold">
                            Import More Data
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/administrator/marketing">
                        <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter">Bulk Lead Import</h1>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Hydrate your outreach engine</p>
                    </div>
                </div>
                
                <a href="https://docs.google.com/spreadsheets/d/1m-o0CWA4ZxAR0GfLzlemSiwLYYmYDwBlEVwNnp7SXX0/edit?gid=891834841#gid=891834841" target="_blank">
                    <Button variant="outline" className="h-12 border-slate-200 dark:border-slate-800 rounded-2xl font-bold px-6">
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                    </Button>
                </a>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 flex-1 min-h-0">
                <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
                    <Card className="flex-1 min-h-[400px] border-dashed border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center relative group overflow-hidden">
                        <AnimatePresence mode="wait">
                            {!file ? (
                                <motion.div 
                                    key="upload"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="relative z-10"
                                >
                                    <div className="h-28 w-28 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110 duration-500">
                                        <Upload className="w-12 h-12 text-indigo-500" />
                                    </div>
                                    <h2 className="text-2xl font-black mb-2 dark:text-white">Drop your workspace data here</h2>
                                    <p className="text-slate-500 font-bold mb-8">Support for .csv and .xlsx up to 10MB</p>
                                    
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            accept=".csv,.xlsx" 
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 h-14 rounded-2xl font-black shadow-xl shadow-indigo-500/20">
                                            Ingest Intelligence
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="selected"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full h-full flex flex-col"
                                >
                                    <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-sm truncate max-w-[200px]">{file.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" onClick={() => { setFile(null); setPreviewData([]); }} className="h-10 w-10 p-0 rounded-xl hover:bg-red-50 hover:text-red-500 text-slate-400">
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    <div className="flex-1 overflow-hidden bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800">
                                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Visual Preview</p>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">First 5 Rows</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                                    <tr>
                                                        {previewData.length > 0 && Object.keys(previewData[0]).map(h => (
                                                            <th key={h} className="p-4 font-black text-slate-400 uppercase tracking-wider">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {previewData.map((row, i) => (
                                                        <tr key={i}>
                                                            {Object.values(row).map((v: string, j) => (
                                                                <td key={j} className="p-4 font-bold dark:text-slate-300">{v}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center justify-end gap-3">
                                        <Button variant="ghost" onClick={() => { setFile(null); setPreviewData([]); }} className="h-14 px-8 font-bold">
                                            Clear All
                                        </Button>
                                        <Button 
                                            onClick={handleImport}
                                            disabled={importing}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 h-14 rounded-2xl font-black shadow-xl shadow-indigo-500/20"
                                        >
                                            {importing ? (
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                            ) : (
                                                "Start Mass Ingestion"
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[2.5rem]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <Database className="w-5 h-5 text-orange-500" />
                            </div>
                            <h3 className="font-black">Import Rules</h3>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-black dark:text-white">Auto-Deduplication</p>
                                    <p className="text-xs text-slate-500 font-bold">We automatically skip existing emails to prevent workspace noise.</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-black dark:text-white">Smart Mapping</p>
                                    <p className="text-xs text-slate-500 font-bold">Unknown columns are automatically stored in the Intelligence Profile.</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-black dark:text-white">Required Fields</p>
                                    <p className="text-xs text-slate-500 font-bold">Ensure Name and Email columns are present for successful ingestion.</p>
                                </div>
                            </li>
                        </ul>
                    </Card>

                    <Card className="p-8 border-slate-200 dark:border-slate-800 bg-indigo-600 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-700">
                             <HelpCircle className="w-24 h-24 text-white" />
                        </div>
                        <h3 className="text-white font-black text-xl mb-2 relative z-10">Need a blank template?</h3>
                        <p className="text-indigo-100 text-sm font-bold mb-6 relative z-10 leading-relaxed">
                            Start with our optimized layout for 100% success rate during intelligence ingestion.
                        </p>
                        <a href="https://docs.google.com/spreadsheets/d/1m-o0CWA4ZxAR0GfLzlemSiwLYYmYDwBlEVwNnp7SXX0/edit?gid=891834841#gid=891834841" target="_blank" className="w-full">
                            <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black h-12 rounded-xl border-none shadow-lg relative z-10">
                                Grab the Blueprint
                            </Button>
                        </a>
                    </Card>
                </div>
            </div>
        </div>
    );
}
