"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Users, ShoppingBag, Landmark, MessageSquare,
  TrendingUp, Clock, CircleAlert as AlertCircle, ArrowUpRight,
  ShieldCheck, Ticket, Star, Zap, Settings
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

const data = [
  { name: "Mon", sales: 4000, users: 240 },
  { name: "Tue", sales: 3000, users: 139 },
  { name: "Wed", sales: 2000, users: 980 },
  { name: "Thu", sales: 2780, users: 390 },
  { name: "Fri", sales: 1890, users: 480 },
  { name: "Sat", sales: 2390, users: 380 },
  { name: "Sun", sales: 3490, users: 430 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    activeTickets: 0,
    revenue: 0,
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customer-orders?type=summary", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setStats({
          pendingProducts: d.pendingProducts || 0,
          totalOrders: d.totalOrders || 0,
          totalUsers: d.totalUsers || 0,
          activeTickets: d.activeTickets || 0,
          revenue: d.revenue || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Command Center</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-500" /> Platform Overview & Real-time Metrics
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
            Market Status: <span className="text-emerald-500">Live</span>
          </span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: Landmark, color: "text-emerald-500 bg-emerald-500/10", trend: "+12.5%" },
          { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-blue-500 bg-blue-500/10", trend: "+8.2%" },
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-purple-500 bg-purple-500/10", trend: "+5.1%" },
          { label: "Pending Veto", value: stats.pendingProducts, icon: ShieldCheck, color: "text-red-500 bg-red-500/10", trend: "Action Required" },
        ].map((s, i) => (
          <Card key={i} className="p-6 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                  s.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {s.trend}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black tracking-tight">{s.value}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-slate-100 dark:bg-slate-700/50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Growth Performance
            </h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-bold uppercase text-slate-400">Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase text-slate-400">Users</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Actions / Recent Activity */}
        <div className="space-y-6">
          <Card className="p-6 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50 h-full">
            <h3 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Rapid Actions
            </h3>
            <div className="space-y-3">
              {[
                { label: "Moderate Reviews", href: "/administrator/reviews", icon: Star, color: "indigo" },
                { label: "Manage Discounts", href: "/administrator/discounts", icon: Ticket, color: "emerald" },
                { label: "User Support", href: "/administrator/support", icon: MessageSquare, color: "blue" },
                { label: "Platform Settings", href: "/administrator/settings", icon: Settings, color: "slate" },
              ].map((a, i) => (
                <a key={i} href={a.href} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-${a.color}-500/10`}>
                      <a.icon className={`w-4 h-4 text-${a.color}-500`} />
                    </div>
                    <span className="text-sm font-black">{a.label}</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-amber-600 uppercase">System Alert</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-bold leading-relaxed">
                2 products are awaiting moderator VETO approval. Delay in approval may affect seller satisfaction.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
