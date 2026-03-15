"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Search, Zap, CheckCircle2, AlertCircle, RefreshCw, Edit2, Check, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/media";
import { triggerProductTagRegeneration, updateProductTags } from "./actions";

interface Product {
  id: string;
  name: string;
  media: any;
  tags?: Array<{ tag: string }>;
  updatedAt?: string;
  createdAt?: string;
}

export default function AITagsClient({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredProducts = products.filter(p => {
    const searchLow = searchQuery.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(searchLow);
    const tagMatch = p.tags?.some(t => t.tag.toLowerCase().includes(searchLow));
    return nameMatch || tagMatch;
  });

  const handleRegenerate = async (productId: string) => {
    setLoadingId(productId);
    try {
        const result = await triggerProductTagRegeneration(productId);
        if (result.success) {
            showToast("AI Intelligence Refined!");
            // Update local state
            setProducts(prev => prev.map(p => 
                p.id === productId 
                    ? { ...p, tags: result.tags?.map(t => ({ tag: t })) } 
                    : p
            ));
        }
    } catch (err) {
        showToast("AI Sync Failed. Please try again.", "error");
    } finally {
        setLoadingId(null);
    }
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditTags(product.tags?.map(t => t.tag) || []);
    setNewTag("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTags([]);
    setNewTag("");
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    if (editTags.includes(newTag.trim().toLowerCase())) {
        setNewTag("");
        return;
    }
    setEditTags([...editTags, newTag.trim().toLowerCase()]);
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  const saveManualTags = async (productId: string) => {
    setLoadingId(productId);
    try {
        const result = await updateProductTags(productId, editTags);
        if (result.success) {
            showToast("Tags Updated Manually");
            setProducts(prev => prev.map(p => 
                p.id === productId 
                    ? { ...p, tags: editTags.map(t => ({ tag: t })) } 
                    : p
            ));
            setEditingId(null);
        }
    } catch (err) {
        showToast("Failed to save changes", "error");
    } finally {
        setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Search Bar */}
      <div className="max-w-xl relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input
          placeholder="Search products or AI tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product) => (
            <motion.div
              layout
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={cn(
                  "h-full overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all flex flex-col group",
                  editingId === product.id ? "ring-2 ring-indigo-500 border-indigo-500" : "hover:border-indigo-500/50"
              )}>
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                  {product.media && (
                    <Image
                      src={resolveMediaUrl(Array.isArray(product.media) ? product.media[0] : product.media) || "/placeholder.jpg"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute top-3 right-3">
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg border",
                      product.tags?.length 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                      {product.tags?.length ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          {product.tags.length} Discovery Tags
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Tagging Pending
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-black text-slate-900 dark:text-white truncate flex-1" title={product.name}>
                            {product.name}
                        </h3>
                        {editingId !== product.id && (
                            <button 
                                onClick={() => startEditing(product)}
                                className="text-slate-400 hover:text-indigo-500 transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        Last Modified: {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : (product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "Historical")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 flex-1 items-start">
                    {editingId === product.id ? (
                        <div className="w-full space-y-3">
                            <form onSubmit={handleAddTag} className="relative">
                                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input 
                                    autoFocus
                                    placeholder="Add manual tag..."
                                    value={newTag}
                                    onChange={e => setNewTag(e.target.value)}
                                    className="w-full h-9 pl-9 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </form>
                            <div className="flex flex-wrap gap-1.5">
                                {editTags.map((tag, idx) => (
                                    <span 
                                        key={idx}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                                    >
                                        #{tag}
                                        <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <button 
                                    onClick={() => saveManualTags(product.id)}
                                    disabled={loadingId === product.id}
                                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                                >
                                    {loadingId === product.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    Save Intelligence
                                </button>
                                <button 
                                    onClick={cancelEditing}
                                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {product.tags && product.tags.length > 0 ? (
                                product.tags.map((t, idx) => (
                                    <span 
                                        key={idx} 
                                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 hover:text-indigo-400 transition-colors"
                                    >
                                    #{t.tag}
                                    </span>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic">No AI tags generated yet.</p>
                            )}
                        </>
                    )}
                  </div>

                  {editingId !== product.id && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button 
                            onClick={() => handleRegenerate(product.id)}
                            disabled={loadingId === product.id}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-black transition-all active:scale-95 disabled:opacity-50 group/btn"
                            title="Force regeneration of tags"
                        >
                            <RefreshCw className={cn("w-3 h-3", loadingId === product.id && "animate-spin")} />
                            {loadingId === product.id ? "Syncing AI..." : "Regenerate Discovery"}
                        </button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredProducts.length === 0 && (
        <div className="p-20 text-center space-y-4">
            <Zap className="w-12 h-12 text-slate-200 mx-auto" />
            <h2 className="text-xl font-bold text-slate-400">No Intelligence Streams Found</h2>
            <p className="text-slate-500 max-w-sm mx-auto">Try searching for a different product or update your keywords.</p>
        </div>
      )}

      {/* Floating Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className={cn(
              "px-6 py-3 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-3 border backdrop-blur-md",
              toast.type === 'success' 
                ? "bg-emerald-500/90 text-white border-emerald-400/50" 
                : "bg-red-500/90 text-white border-red-400/50"
            )}>
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
