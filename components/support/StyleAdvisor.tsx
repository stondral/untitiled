"use client";

import { createPortal } from "react-dom";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Sparkles, Send, Bot, User, Loader2, 
    ArrowRight, ShoppingBag, CreditCard,
    History, TrendingUp, Zap, Camera
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartContext";
import { analyzeUserStyleAction, getStyleRecommendationsAction } from "@/components/support/styleAdvisorActions";

export default function StyleAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isOrdersPage = pathname?.startsWith("/orders") || 
                       pathname?.startsWith("/order-success") || 
                       pathname?.startsWith("/order-failure") ||
                       pathname?.startsWith("/administrator");

  if (!mounted || isOrdersPage) return null;

  return (
    <>
      <motion.button
        initial={{ y: 20, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[90] flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-[0_20px_40px_rgba(249,115,22,0.3)] border border-orange-400/50 backdrop-blur-md group"
      >
        <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-6 w-6 rounded-full border-2 border-orange-500 bg-orange-400 flex items-center justify-center text-[10px] font-black italic overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i + 15}`} alt="AI" className="opacity-80 grayscale group-hover:grayscale-0 transition-all" />
                </div>
            ))}
        </div>
        <div className="flex flex-col items-start translate-y-[-1px]">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none opacity-80 mb-1">Stond AI</span>
            <span className="text-xs font-black tracking-tight flex items-center gap-2">
                Can&apos;t decide? Let us analyse your style
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <AdvisorModal onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function AdvisorModal({ onClose }: { onClose: () => void }) {
  const { addToCart, setIsOpen: setEmptyCartOpen } = useCart();
  const [messages, setMessages] = useState<any[]>([
    { 
        role: 'assistant', 
        content: "Hi! I'm your Stond Style Advisor. I'm ready to analyze your style history and find your next signature look. Should I start scanning your recent orders?",
        actions: [
            { label: "Analyze my history", value: "analyze_history", icon: <History size={14} /> },
            { label: "See current trends", value: "see_trends", icon: <TrendingUp size={14} /> },
            { label: "Build an outfit", value: "build_outfit", icon: <Zap size={14} /> }
        ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const processResponse = async (input: string, image?: string | null) => {
    setIsTyping(true);
    try {
        if (input === "analyze_history") {
            const result = await analyzeUserStyleAction();
            setIsTyping(false);
            
            if (result.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: result.error }]);
                return;
            }

            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: result.analysis,
                explanation: result.explanation
            }]);

            if (result.recommendations && result.recommendations.length > 0) {
                 setTimeout(() => {
                    setMessages(prev => [...prev, { 
                        role: 'assistant', 
                        content: "Here are some actual pieces from our catalog that align with your style profile:",
                        products: result.recommendations
                    }]);
                 }, 800);
            }
        } else {
            // General query with conversational history and optional image
            const result = await getStyleRecommendationsAction(input, messages, image);
            setIsTyping(false);
            
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: result.analysis,
                products: result.recommendations,
                notFound: result.notFound,
                actions: result.actions?.map((a: string) => ({
                    label: a.replace(/_/g, " "),
                    value: a
                }))
            }]);
        }
    } catch (err) {
        console.error("Advisor Error:", err);
        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error while processing your request. Please try again later." }]);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    const currentImage = selectedImage;

    setMessages(prev => [...prev, { 
        role: 'user', 
        content: userMsg,
        ...(currentImage ? { image: imagePreview } : {}) 
    }]);
    
    setInputValue("");
    setSelectedImage(null);
    setImagePreview(null);
    
    processResponse(userMsg, currentImage);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setImagePreview(base64String); // For UI preview
            // Strip data URL prefix for AI processing if needed, or handle in action
            setSelectedImage(base64String);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAction = (actionValue: string) => {
     if (actionValue === "reserve_pickup") {
         setMessages(prev => [...prev, { role: 'user', content: "Reserve for pickup" }]);
         setIsTyping(true);
         setTimeout(() => {
             setIsTyping(false);
             setMessages(prev => [...prev, { 
                 role: 'assistant', 
                 content: "Great choice! I've reserved this item for you at our downtown store. You'll receive a confirmation email shortly. Anything else I can help you with?" 
             }]);
         }, 1000);
         return;
     }
     
     const label = actionValue.replace(/_/g, " ");
     setMessages(prev => [...prev, { role: 'user', content: label }]);
     processResponse(actionValue === "build_outfit" ? "Complete the look for me" : actionValue);
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl h-[700px] max-h-[90vh] bg-[#050505] border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
               <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
                <h3 className="text-xl font-black text-white tracking-tight">AI Style Advisor</h3>
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em]">Powered by Stond NOVA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide"
        >
          {messages.map((msg, i) => (
            <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "flex gap-4",
                    msg.role === 'user' ? "flex-row-reverse" : ""
                )}
            >
                <div className={cn(
                    "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border",
                    msg.role === 'assistant' ? "bg-orange-500/10 border-orange-500/20 text-orange-500" : "bg-white/10 border-white/10 text-white/50"
                )}>
                    {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="flex-1 max-w-[85%] space-y-4">
                    <div className={cn(
                        "px-6 py-4 rounded-[1.5rem] text-sm md:text-base leading-relaxed whitespace-pre-wrap",
                        msg.role === 'assistant' 
                            ? "bg-white/[0.03] text-white/90 font-medium border border-white/5" 
                            : "bg-orange-600 text-white font-bold"
                    )}>
                        {msg.image && (
                            <div className="mb-3 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                                <img src={msg.image} alt="User upload" className="w-full max-h-[300px] object-cover" />
                            </div>
                        )}
                        {msg.content}
                        {msg.explanation && (
                            <div className="mt-3 pt-3 border-t border-white/10 italic text-white/40 text-xs">
                                {msg.explanation}
                            </div>
                        )}
                    </div>
                    
                    {msg.actions && (
                        <div className="flex flex-wrap gap-2">
                            {msg.actions.map((action: any) => (
                                <button
                                    key={action.value}
                                    onClick={() => handleAction(action.value)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-orange-500 hover:text-white transition-all group"
                                >
                                    {action.icon}
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {msg.product && (
                        <div className="space-y-4 w-full">
                            <div className="w-full p-4 bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden group/product transition-all hover:bg-white/5">
                                <div className="aspect-[4/3] relative rounded-[1.5rem] overflow-hidden mb-4 bg-white/5">
                                    <img src={msg.product.image} alt={msg.product.name} className="object-cover w-full h-full transition-transform duration-500 group-hover/product:scale-110" />
                                    <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                                        {msg.product.price}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-4 px-2">
                                    <div className="space-y-1 min-w-0">
                                        <h4 className="text-white font-bold text-sm tracking-tight truncate">{msg.product.name}</h4>
                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-none truncate">{msg.product.category}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button 
                                            onClick={() => {
                                                addToCart(msg.product.id);
                                                setEmptyCartOpen(true);
                                            }}
                                            className="h-10 w-10 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all flex items-center justify-center"
                                            title="Add to Cart"
                                        >
                                            <ShoppingBag size={16} />
                                        </button>
                                        <button 
                                            onClick={() => window.location.href = `/products/${msg.product.slug}`}
                                            className="h-10 px-4 bg-orange-600 hover:bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {msg.role === 'assistant' && (
                                <button
                                    onClick={() => handleAction("build_outfit")}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:bg-orange-600 hover:text-white transition-all group"
                                >
                                    <Zap size={14} className="group-hover:animate-pulse" />
                                    Make this a complete style?
                                </button>
                            )}
                        </div>
                    )}

                    {msg.products && (
                        <div className="space-y-4 w-full">
                            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-1">
                                {msg.products.map((product: any) => (
                                    <div key={product.id} className="w-[200px] shrink-0 p-3 bg-white/[0.02] border border-white/5 rounded-[1.8rem] overflow-hidden group/product transition-all hover:bg-white/5">
                                        <div className="aspect-[1/1] relative rounded-[1.2rem] overflow-hidden mb-3 bg-white/5">
                                            <img src={product.image} alt={product.name} className="object-cover w-full h-full transition-transform duration-500 group-hover/product:scale-110" />
                                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                                                {typeof product.price === 'number' ? `₹${product.price.toLocaleString()}` : product.price}
                                            </div>
                                        </div>
                                        <div className="space-y-1 mb-3 px-1">
                                            <h4 className="text-white font-bold text-[11px] tracking-tight truncate">{product.name}</h4>
                                            <p className="text-white/40 text-[8px] font-black uppercase tracking-widest leading-none truncate">{product.category}</p>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button 
                                                onClick={() => {
                                                    addToCart(product.id);
                                                    setEmptyCartOpen(true);
                                                }}
                                                className="flex-1 h-8 bg-white/5 hover:bg-white/10 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <ShoppingBag size={10} />
                                                Add
                                            </button>
                                            <button 
                                                onClick={() => window.location.href = `/products/${product.slug}`}
                                                className="flex-1 h-8 bg-orange-600 hover:bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-orange-600/20"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {msg.role === 'assistant' && (
                                <button
                                    onClick={() => handleAction("build_outfit")}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:bg-orange-600 hover:text-white transition-all group"
                                >
                                    <Zap size={14} className="group-hover:animate-pulse" />
                                    Make this a complete style?
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
          ))}
          {isTyping && (
             <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                    <Loader2 size={20} className="animate-spin" />
                </div>
                <div className="bg-white/[0.03] px-6 py-4 rounded-[1.5rem] border border-white/5">
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <motion.div 
                                key={i}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                className="h-1.5 w-1.5 rounded-full bg-orange-500" 
                            />
                        ))}
                    </div>
                </div>
             </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-8 border-t border-white/5 bg-black">
          <form onSubmit={handleSend} className="relative group">
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />

            {imagePreview && (
                <div className="absolute bottom-full left-0 mb-4 p-2 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 shadow-2xl">
                    <div className="h-16 w-16 rounded-xl overflow-hidden border border-white/20">
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                    <button 
                        type="button"
                        onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                        }}
                        className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 w-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all group/cam"
                    title="Upload photo"
                >
                    <Camera size={20} className="transition-transform group-hover/cam:scale-110" />
                </button>
            </div>

            <input 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={imagePreview ? "Ask about this photo..." : "Describe a vibe or ask for suggestions..."}
                className="w-full h-14 pl-14 pr-16 bg-[#1a1a1a] border border-white/10 rounded-full text-white outline-none focus:border-orange-500/50 transition-all font-medium text-base placeholder:text-white/20"
            />
            <button 
                type="submit"
                disabled={(!inputValue.trim() && !selectedImage) || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-orange-500 hover:bg-orange-400 disabled:opacity-10 rounded-full flex items-center justify-center text-white transition-all active:scale-90 shadow-lg shadow-orange-500/20"
            >
                <Send size={16} />
            </button>
          </form>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["Analyze my taste", "Monochrome looks", "Boho summer", "Business casual"].map(tag => (
                <button 
                    key={tag}
                    onClick={() => { setInputValue(tag); handleSend(); }}
                    className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/30 hover:bg-white/5 hover:text-white transition-all whitespace-nowrap"
                >
                    {tag}
                </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
