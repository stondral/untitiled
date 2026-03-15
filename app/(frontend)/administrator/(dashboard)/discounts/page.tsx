"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Ticket, Search, Plus, Calendar,
  CheckCircle2, XCircle,
  MoreHorizontal, Copy, Tag, Globe,
  ShieldCheck, ShoppingBag, Layers, CircleAlert as AlertCircle
} from "lucide-react";
import StepUpModal from "@/components/admin/StepUpModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DiscountCode {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  discountSource: "store" | "seller";
  seller?: Record<string, unknown> | null;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  oneTimeUsePerUser?: boolean;
  minItemsCount?: number;
  applicableCategories?: string[];
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  description?: string;
}

interface AdminSeller {
  id: string;
  name: string;
}

interface AdminCategory {
  id: string;
  name: string;
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage",
    value: 0,
    discountSource: "store" as "store" | "seller",
    seller: "",
    description: "",
    minOrderValue: 0,
    maxDiscount: 0,
    usageLimit: 100,
    oneTimeUsePerUser: false,
    minItemsCount: 0,
    applicableCategories: [] as string[],
    expiresAt: "",
    isActive: true,
  });

  const [pinAction, setPinAction] = useState<null | "create" | { type: "toggle", id: string, active: boolean }>(null);

  const fetchData = useCallback(async () => {
    try {
      const [discountsRes, sellersRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/customer-orders?type=discounts", { credentials: "include" }),
        fetch("/api/admin/customer-orders?type=sellers", { credentials: "include" }),
        fetch("/api/admin/customer-orders?type=categories", { credentials: "include" })
      ]);
      
      const [discountsData, sellersData, categoriesData] = await Promise.all([
        discountsRes.json(),
        sellersRes.json(),
        categoriesRes.json()
      ]);

      setDiscounts(discountsData.discounts || []);
      setSellers(sellersData.sellers || []);
      setCategories(categoriesData.categories || []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createDiscount = async () => {
    try {
      const payload = {
        ...formData,
        seller: formData.discountSource === "seller" ? formData.seller : undefined,
        applicableCategories: formData.applicableCategories.length > 0 ? formData.applicableCategories : undefined,
      };

      await fetch("/api/admin/master-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: "discount-codes",
          operation: "create",
          data: payload,
        }),
      });
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch { }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      type: "percentage",
      value: 0,
      discountSource: "store",
      seller: "",
      description: "",
      minOrderValue: 0,
      maxDiscount: 0,
      usageLimit: 100,
      oneTimeUsePerUser: false,
      minItemsCount: 0,
      applicableCategories: [],
      expiresAt: "",
      isActive: true,
    });
  };

  const toggleDiscount = async (id: string, active: boolean) => {
    try {
      await fetch("/api/admin/master-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          collection: "discount-codes",
          docId: id,
          data: { isActive: active },
        }),
      });
      fetchData();
    } catch { }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopyingId(id);
    setTimeout(() => setCopyingId(null), 2000);
  };

  const filtered = discounts.filter((d) => {
    const matchSearch = !search || d.code.toLowerCase().includes(search.toLowerCase());
    const matchSource = sourceFilter === "all" || d.discountSource === sourceFilter;
    return matchSearch && matchSource;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">Discount Codes</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Promotion & coupon management</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4 mr-2" /> Create New Code
        </Button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.95 }} 
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-indigo-500" />
                  </div>
                  Launch New Promotion
                </h3>
              </div>

              <div className="p-8">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl h-12">
                    <TabsTrigger value="basic" className="rounded-xl font-bold text-xs uppercase tracking-widest">Basic info</TabsTrigger>
                    <TabsTrigger value="constraints" className="rounded-xl font-bold text-xs uppercase tracking-widest">Rules</TabsTrigger>
                    <TabsTrigger value="applicability" className="rounded-xl font-bold text-xs uppercase tracking-widest">Targeting</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Promotion Code</label>
                      <Input 
                        placeholder="e.g. MEGA-SAVINGS-25" 
                        value={formData.code} 
                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                        className="h-14 rounded-2xl font-black text-lg bg-slate-50 dark:bg-slate-800/50 border-none ring-offset-indigo-500 focus-visible:ring-indigo-500" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Discount Type</label>
                        <select 
                          value={formData.type} 
                          onChange={e => setFormData({...formData, type: e.target.value as "percentage" | "fixed"})} 
                          className="w-full h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-800/50 px-4 font-bold text-sm outline-none ring-offset-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Value</label>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          value={formData.value || ""} 
                          onChange={e => setFormData({...formData, value: Number(e.target.value)})} 
                          className="h-14 rounded-2xl font-black text-lg bg-slate-50 dark:bg-slate-800/50 border-none ring-offset-indigo-500 focus-visible:ring-indigo-500" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Internal Description</label>
                      <Input 
                        placeholder="Internal notes for this code" 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        className="h-14 rounded-2xl font-bold bg-slate-50 dark:bg-slate-800/50 border-none ring-offset-indigo-500 focus-visible:ring-indigo-500" 
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="constraints" className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Min Order (₹)</label>
                        <Input type="number" value={formData.minOrderValue || ""} onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Max Discount (₹)</label>
                        <Input type="number" value={formData.maxDiscount || ""} onChange={e => setFormData({...formData, maxDiscount: Number(e.target.value)})} className="h-12 rounded-xl" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Usage Limit</label>
                        <Input type="number" value={formData.usageLimit || ""} onChange={e => setFormData({...formData, usageLimit: Number(e.target.value)})} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Min Items</label>
                        <Input type="number" value={formData.minItemsCount || ""} onChange={e => setFormData({...formData, minItemsCount: Number(e.target.value)})} className="h-12 rounded-xl" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <input 
                        type="checkbox" 
                        id="oneTimeUse" 
                        checked={formData.oneTimeUsePerUser} 
                        onChange={e => setFormData({...formData, oneTimeUsePerUser: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-2 border-slate-300 checked:bg-indigo-500"
                      />
                      <label htmlFor="oneTimeUse" className="text-sm font-bold flex items-center gap-2 cursor-pointer">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        Restrict to one use per customer
                      </label>
                    </div>
                  </TabsContent>

                  <TabsContent value="applicability" className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Discount Source</label>
                      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                        {["store", "seller"].map((s) => (
                          <button
                            key={s}
                            onClick={() => setFormData({...formData, discountSource: s as "store" | "seller"})}
                            className={`flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                              formData.discountSource === s 
                                ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-500" 
                                : "text-slate-400"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.discountSource === "seller" && (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Seller</label>
                        <select 
                          value={formData.seller} 
                          onChange={e => setFormData({...formData, seller: e.target.value})} 
                          className="w-full h-12 rounded-xl border bg-transparent px-4 font-bold text-sm"
                        >
                          <option value="">Select a seller...</option>
                          {sellers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Categories (Optional)</label>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        {categories.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              const exists = formData.applicableCategories.includes(c.id);
                              setFormData({
                                ...formData, 
                                applicableCategories: exists 
                                  ? formData.applicableCategories.filter(id => id !== c.id)
                                  : [...formData.applicableCategories, c.id]
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                              formData.applicableCategories.includes(c.id)
                                ? "bg-indigo-500 text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                            }`}
                          >
                            {c.name}
                          </button>
                        ))}
                        {categories.length === 0 && <p className="text-[10px] text-slate-400 font-bold uppercase italic p-2">No categories available</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Expiration Date</label>
                      <Input 
                        type="date" 
                        value={formData.expiresAt} 
                        onChange={e => setFormData({...formData, expiresAt: e.target.value})} 
                        className="h-12 rounded-xl font-bold" 
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-12 flex gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsModalOpen(false)} 
                    className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-slate-400"
                  >
                    Discard
                  </Button>
                  <Button 
                    onClick={() => setPinAction("create")} 
                    className="h-14 flex-[2] bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                  >
                    Confirm & Publish
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Codes", value: discounts.filter(d => d.isActive).length, icon: Ticket, color: "text-indigo-500 bg-indigo-500/10" },
          { label: "Total Usage", value: discounts.reduce((s, d) => s + d.usedCount, 0), icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Store-wide", value: discounts.filter(d => d.discountSource === 'store').length, icon: Globe, color: "text-blue-500 bg-blue-500/10" },
          { label: "Seller-specific", value: discounts.filter(d => d.discountSource === 'seller').length, icon: Tag, color: "text-amber-500 bg-amber-500/10" },
        ].map((s, i) => (
          <Card key={i} className="p-4 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-black leading-none mb-1">{s.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-bold"
          />
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {["all", "store", "seller"].map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                sourceFilter === s
                  ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <Card className="p-20 text-center col-span-full border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-black text-slate-400 tracking-tighter">No Campaigns Found</p>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Try refining your search</p>
          </Card>
        ) : (
          filtered.map((d) => (
            <Card key={d.id} className={`group relative p-6 transition-all hover:shadow-2xl hover:-translate-y-1 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50 rounded-3xl ${!d.isActive && 'opacity-60 saturate-50'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
                    <span className="font-black text-indigo-500 font-mono tracking-tighter text-base">{d.code}</span>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCopy(d.code, d.id)} 
                    className={`p-2 rounded-xl transition-all ${copyingId === d.id ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    {copyingId === d.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </motion.button>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${d.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {d.isActive ? 'Live' : 'Paused'}
                  </span>
                  <div className={`h-1.5 w-12 rounded-full ${d.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Benefit</p>
                    <p className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                      {d.type === 'percentage' ? `${d.value}%` : `₹${d.value}`}
                      <span className="text-xs font-bold text-slate-400 ml-2 italic tracking-normal uppercase">off</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Source</p>
                    <div className="flex items-center gap-1 justify-end font-black text-sm text-slate-700 dark:text-slate-300">
                      {d.discountSource === 'store' ? <Globe className="w-3.5 h-3.5 text-blue-500" /> : <Tag className="w-3.5 h-3.5 text-amber-500" />}
                      {d.discountSource.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="w-3 h-3 text-slate-400" />
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Usage</p>
                    </div>
                    <div className="flex items-end gap-1">
                      <p className="text-lg font-black leading-none">{d.usedCount}</p>
                      <p className="text-[10px] font-bold text-slate-400 leading-none mb-0.5">/ {d.usageLimit || '∞'}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Categories</p>
                    </div>
                    <p className="text-xs font-black truncate">{d.applicableCategories?.length ? `${d.applicableCategories.length} Categories` : 'All Categories'}</p>
                  </div>
                </div>

                {(d.minOrderValue || d.oneTimeUsePerUser) && (
                  <div className="flex flex-wrap gap-2">
                    {d.minOrderValue && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[9px] font-black uppercase text-amber-600">
                        <AlertCircle className="w-3 h-3" />
                        Min ₹{d.minOrderValue}
                      </div>
                    )}
                    {d.oneTimeUsePerUser && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[9px] font-black uppercase text-indigo-600">
                        <ShieldCheck className="w-3 h-3" />
                        Once per user
                      </div>
                    )}
                  </div>
                )}

                {d.expiresAt && (
                  <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pt-2 border-t border-slate-100 dark:border-slate-800 ${new Date(d.expiresAt) < new Date() ? 'text-rose-500' : 'text-slate-400'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(d.expiresAt) < new Date() ? 'Expired' : `Ends ${new Date(d.expiresAt).toLocaleDateString()}`}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${d.isActive ? 'hover:bg-rose-50 hover:text-rose-600' : 'hover:bg-emerald-50 hover:text-emerald-600'}`}
                  onClick={() => setPinAction({ type: "toggle", id: d.id, active: !d.isActive })}
                >
                  {d.isActive ? <XCircle className="w-3.5 h-3.5 mr-2" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-2" />}
                  {d.isActive ? 'Pause Campaign' : 'Resume Campaign'}
                </Button>
                <Button variant="ghost" className="h-11 w-11 rounded-xl p-0 hover:bg-slate-100 dark:hover:bg-slate-700">
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <AnimatePresence>
        {pinAction && (
          <StepUpModal
            action={typeof pinAction === "string" ? "create_discount" : "toggle_discount"}
            title={typeof pinAction === "string" ? "Authorize Campaign Launch" : "Authorize Status Toggle"}
            description={
              typeof pinAction === "string" 
                ? `You are publishing the [${formData.code}] campaign. This action requires administrative elevation.`
                : `Changing the active status of this discount campaign.`
            }
            onVerified={async () => {
              if (pinAction === "create") {
                await createDiscount();
              } else if (typeof pinAction === "object" && pinAction?.type === "toggle") {
                await toggleDiscount(pinAction.id, pinAction.active);
              }
              setPinAction(null);
            }}
            onCancel={() => setPinAction(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {copyingId && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 border border-slate-800"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            Code Copied to Clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
