"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star, Trash2, CheckCircle2,
  Package, User, MessageSquare, Image as ImageIcon,
  ShieldCheck
} from "lucide-react";
import Image from "next/image";

interface Review {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
  rating: number;
  comment: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  images: any[];
  isVerified: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/customer-orders?type=reviews", { credentials: "include" });
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const toggleVerify = async (id: string, verified: boolean) => {
    try {
      await fetch("/api/admin/master-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          collection: "reviews",
          docId: id,
          data: { isVerified: verified },
        }),
      });
      fetchReviews();
    } catch { }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await fetch("/api/admin/master-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          collection: "reviews",
          docId: id,
          operation: "delete",
        }),
      });
      fetchReviews();
    } catch { }
  };

  const filtered = reviews.filter((r) => {
    if (filter === "all") return true;
    if (filter === "verified") return r.isVerified;
    if (filter === "unverified") return !r.isVerified;
    if (filter === "low_rating") return r.rating <= 2;
    return true;
  });

  const stats = {
    total: reviews.length,
    avgRating: reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1),
    verified: reviews.filter(r => r.isVerified).length,
    withImages: reviews.filter(r => r.images?.length > 0).length,
  };

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
        <h1 className="text-3xl font-black tracking-tighter">Reviews Moderation</h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Moderate product ratings & feedback</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Reviews", value: stats.total, icon: MessageSquare, color: "text-indigo-500 bg-indigo-500/10" },
          { label: "Avg Rating", value: stats.avgRating.toFixed(1), icon: Star, color: "text-amber-500 bg-amber-500/10" },
          { label: "Verified Reviews", value: stats.verified, icon: ShieldCheck, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "With Photos", value: stats.withImages, icon: ImageIcon, color: "text-blue-500 bg-blue-500/10" },
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

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "all", label: "All" },
          { id: "verified", label: "Verified" },
          { id: "unverified", label: "Unverified" },
          { id: "low_rating", label: "Low Rating (≤2)" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filter === t.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50">
            <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400">No reviews found matching filter</p>
          </Card>
        ) : (
          filtered.map((r) => (
            <Card key={r.id} className="p-6 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product/User Side */}
                <div className="md:w-64 space-y-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                      {typeof r.product === 'object' && r.product?.images?.[0] ? (
                        <Image src={(r.product.images[0] as { url: string }).url} alt="" width={40} height={40} className="object-cover h-full w-full" />
                      ) : <Package className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-black truncate">{typeof r.product === 'object' ? r.product?.name : 'Unknown Product'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Product</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700">
                    <User className="w-3 h-3 text-slate-400" />
                    <p className="text-xs font-bold truncate">{typeof r.user === 'object' ? r.user?.username || r.user?.email : 'Guest'}</p>
                  </div>
                </div>

                {/* Content Side */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                      ))}
                      {r.isVerified && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-tight flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-2 border-indigo-500/20 pl-4 py-1">
                    &quot;{r.comment}&quot;
                  </p>

                  {/* Images */}
                  {r.images?.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {r.images.map((img: any, i) => (
                        <div key={i} className="w-16 h-16 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden relative group">
                          <Image src={img.url} alt="" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => toggleVerify(r.id, !r.isVerified)} className="h-8 text-[10px] font-black uppercase tracking-wider">
                      {r.isVerified ? "Undo Verify" : "Verify Purchase"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteReview(r.id)} className="h-8 text-[10px] font-black uppercase tracking-wider text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/30">
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
