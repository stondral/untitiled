"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  MessageCircle, Users, Star,
  PieChart, Target, Zap
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell
} from "recharts";

interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  userRole: "buyer" | "seller";
  visualAppeal?: number;
  discoverySource?: string;
  platformInterest?: string;
  categories?: string[];
  improvements?: string;
  createdAt: string;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customer-orders?type=feedback", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setFeedback(data.feedback || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: feedback.length,
    buyers: feedback.filter((f) => f.userRole === "buyer").length,
    sellers: feedback.filter((f) => f.userRole === "seller").length,
    avgScore: feedback.reduce((acc, curr) => acc + (curr.visualAppeal || 0), 0) / (feedback.filter(f => f.visualAppeal).length || 1),
  };

  const discoveryData = feedback.reduce((acc: { name: string; value: number }[], curr) => {
    if (!curr.discoverySource) return acc;
    const existing = acc.find((a) => a.name === curr.discoverySource);
    if (existing) { existing.value += 1; } else { acc.push({ name: curr.discoverySource, value: 1 }); }
    return acc;
  }, []);

  const interestData = feedback.reduce((acc: { name: string; value: number }[], curr) => {
    if (!curr.platformInterest) return acc;
    const existing = acc.find((a) => a.name === curr.platformInterest);
    if (existing) { existing.value += 1; } else { acc.push({ name: curr.platformInterest, value: 1 }); }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter">Feedback & Insights</h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Market demand & platform sentiment</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Responses", value: stats.total, icon: MessageCircle, color: "text-indigo-500 bg-indigo-500/10" },
          { label: "Buyer Interest", value: `${Math.round((stats.buyers/stats.total)*100 || 0)}%`, icon: Users, color: "text-blue-500 bg-blue-500/10" },
          { label: "Seller Interest", value: `${Math.round((stats.sellers/stats.total)*100 || 0)}%`, icon: Target, color: "text-amber-500 bg-amber-500/10" },
          { label: "Avg Visual Score", value: stats.avgScore.toFixed(1), icon: Star, color: "text-emerald-500 bg-emerald-500/10" },
        ].map((s, i) => (
          <Card key={i} className="p-4 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-black">{s.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discovery Sources */}
        <Card className="p-6 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50">
          <h3 className="font-black text-sm mb-6 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" /> Discovery Sources
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={discoveryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Platform Interest */}
        <Card className="p-6 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50">
          <h3 className="font-black text-sm mb-6 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-500" /> Platform Interest Levels
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={interestData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {interestData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            {interestData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{d.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Responses List */}
      <div className="space-y-3">
        <h3 className="font-black text-sm px-1">Recent Feedback Submissions</h3>
        {feedback.slice(0, 10).map((f) => (
          <Card key={f.id} className="p-4 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <span className="font-black text-slate-500">{f.name?.[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm tracking-tight">{f.name}</p>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                      f.userRole === 'buyer' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {f.userRole}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {f.improvements || "No specific improvements suggested."}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-500 font-bold">{new Date(f.createdAt).toLocaleDateString()}</p>
                {f.visualAppeal && (
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-black">{f.visualAppeal}/10</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
