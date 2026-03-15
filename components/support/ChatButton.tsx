"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { ChatWindow } from "../admin/ChatWindow";
import { useAuth } from "../auth/AuthContext";

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [ticket, setTicket] = useState<{ id: string; status: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const isOrdersPage = pathname?.startsWith("/orders") || 
                       pathname?.startsWith("/order-success") || 
                       pathname?.startsWith("/order-failure");
  const { user } = useAuth();

  if (!isOrdersPage) return null;

  // Detect Order ID from URL
  const orderId = pathname?.startsWith("/orders/") ? pathname.split("/")[2] : null;

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    try {
      const url = orderId ? `/api/support/tickets?orderId=${orderId}` : "/api/support/tickets";
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.ticket) {
        setTicket(data.ticket);
      } else {
        // Create new ticket if none exists for this context
        const createResponse = await fetch("/api/support/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            subject: orderId ? `Support for Order #${orderId}` : "General Support Inquiry",
            orderId 
          }),
        });
        const createData = await createResponse.json();
        setTicket(createData.ticket);
      }
    } catch (error) {
      console.error("Failed to fetch/create ticket:", error);
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    if (isOpen && user && !ticket) {
      fetchTicket();
    }
  }, [isOpen, user, ticket, fetchTicket]);

  const handleNewTicket = () => {
    setTicket(null);
    setIsOpen(true);
  };

  // If not logged in, show a different button or state
  if (!user) {
    return (
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] flex flex-col items-end gap-3 md:gap-4">
        {isOpen && (
          <div className="w-[calc(100vw-32px)] md:w-[400px] p-8 md:p-10 bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center justify-center animate-in slide-in-from-bottom-5 duration-300">
             <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="h-10 w-10 text-emerald-600" />
             </div>
             <h3 className="text-lg font-black uppercase tracking-tight mb-2">Login Required</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 leading-relaxed">Please sign in to access secure support communication.</p>
             <Button 
                onClick={() => window.location.href = '/login'}
                className="h-12 px-10 rounded-full bg-[#075e54] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all"
             >
                Login to Chat
             </Button>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
              "h-14 w-14 md:h-16 md:w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 group border-4 border-white dark:border-slate-800",
              isOpen ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rotate-90" : "bg-[#075e54] text-white hover:scale-110 active:scale-95"
          )}
        >
          {isOpen ? <X className="h-6 w-6 md:h-8 md:w-8" /> : <MessageCircle className="h-6 w-6 md:h-8 md:w-8" />}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] flex flex-col items-end gap-3 md:gap-4">
      {/* Chat Window Popup */}
      {isOpen && (
        <div className="w-[calc(100vw-32px)] md:w-[400px] h-[600px] max-h-[calc(100vh-100px)] md:max-h-[calc(100vh-120px)] bg-transparent dark:bg-transparent rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-black/5">
          <div className="p-4 md:p-6 bg-[#075e54] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight uppercase">Support Center</h3>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Chatting Live</p>
              </div>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10 rounded-xl h-10 w-10"
                onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden relative bg-[#e5ddd5] dark:bg-[#0b141a]">
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                    <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : ticket ? (
                <ChatWindow 
                    ticketId={ticket.id}
                    userId={user.id}
                    senderType="customer"
                    orderContext={orderId ?? undefined}
                    status={ticket.status}
                    onNewTicket={handleNewTicket}
                />
            ) : (
                <div className="p-10 text-center flex flex-col items-center justify-center h-full opacity-50">
                    <ShoppingBag className="h-12 w-12 mb-4 text-emerald-600" />
                    <p className="text-xs font-black uppercase tracking-widest">Initializing Chat...</p>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
            "h-14 w-14 md:h-16 md:w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 group border-4 border-white dark:border-slate-800",
            isOpen ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rotate-90" : "bg-[#075e54] text-white hover:scale-110 active:scale-95 shadow-emerald-500/40"
        )}
      >
        {isOpen ? <X className="h-6 w-6 md:h-8 md:w-8" /> : <MessageCircle className="h-6 w-6 md:h-8 md:w-8 group-hover:scale-110 transition-transform" />}
      </button>

      {/* Tooltip-like badge if order page */}
      {orderId && !isOpen && (
        <div className="absolute top-0 right-full mr-4 bg-[#075e54] text-white px-4 py-2 rounded-2xl shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-500 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Need help with this order?</span>
        </div>
      )}
    </div>
  );
}
