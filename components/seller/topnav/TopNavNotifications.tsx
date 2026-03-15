"use client";

import { useState, useEffect } from "react";
import { Bell, ShoppingBag, MessageSquare, CircleAlert as AlertCircle, Zap, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getSellerNotificationsAction } from "@/app/(frontend)/seller/actions/notifications";

interface Notification { 
  id: string; 
  title: string; 
  description: string; 
  time: string; 
  type: string; 
  read: boolean; 
  priority: string 
}

export function TopNavNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const response = await getSellerNotificationsAction();
      if (response.ok && response.notifications) {
        setNotifications(response.notifications);
      }
    };
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationStyles = (type: string) => {
    switch(type) {
        case 'order': return { icon: ShoppingBag, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" };
        case 'message': return { icon: MessageSquare, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" };
        case 'alert': return { icon: AlertCircle, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" };
        case 'system': return { icon: Zap, color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10" };
        default: return { icon: Bell, color: "text-slate-500 bg-slate-50 dark:bg-slate-500/10" };
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative group/bell">
          <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all font-black">
            <Bell className={cn("h-5 w-5", unreadCount > 0 && "animate-pulse")} />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 md:top-2.5 md:right-2.5 h-2 w-2 md:h-2.5 md:w-2.5 bg-amber-500 border-2 border-white dark:border-slate-800 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)] group-hover/bell:scale-125 transition-transform" />
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[calc(100vw-32px)] sm:w-[420px] mt-5 rounded-[2.5rem] p-0 border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden" align="end">
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
          <div>
            <h4 className="text-sm md:text-base font-black italic tracking-tighter">Signal Matrix</h4>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real-time Activity Hub</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                onClick={(e) => { e.stopPropagation(); handleMarkAllRead(); }} 
                variant="ghost" 
                className="h-8 text-[10px] font-black text-amber-500 uppercase tracking-widest hover:bg-amber-500/5 px-3 rounded-full"
              >
                Clear All
              </Button>
            )}
            <Badge variant="outline" className="text-[10px] font-black uppercase px-3 py-1 rounded-full border-amber-500/20 bg-amber-500/5 text-amber-600">
              {unreadCount} Priority
            </Badge>
          </div>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto scrollbar-hide py-2">
          {notifications.length > 0 ? (
            <div className="px-2 space-y-1">
              {notifications.map((n) => {
                const styles = getNotificationStyles(n.type);
                return (
                  <DropdownMenuItem 
                    key={n.id} 
                    onClick={() => handleMarkAsRead(n.id)}
                    className={cn(
                      "rounded-3xl p-4 flex gap-4 cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-800/50 group transition-all border-2 border-transparent relative overflow-hidden",
                      !n.read && "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50"
                    )}
                  >
                    {!n.read && (
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500" />
                    )}
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:rotate-6 group-hover:scale-110 shadow-sm", styles.color)}>
                      <styles.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-sm font-black text-slate-900 dark:text-white truncate transition-colors", !n.read ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-slate-400")}>
                          {n.title}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                        {n.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100">
                          <span className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            n.priority === 'high' ? 'bg-rose-500' : n.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'
                          )} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{n.priority} focus</span>
                        </div>
                        <div className="h-3 w-px bg-slate-100 dark:bg-slate-800" />
                        <p className="text-[9px] font-black uppercase text-slate-400">Node Secure</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
              <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                <Zap className="h-8 w-8 text-slate-300 dark:text-slate-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">System All Clear</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">No new activity detected in your node</p>
              </div>
              <Button variant="outline" onClick={() => window.location.reload()} className="h-10 px-8 rounded-2xl border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all">
                Refresh Pulse
              </Button>
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-4 border-t border-slate-50 dark:border-slate-800/50">
            <Button variant="ghost" className="w-full h-14 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-amber-500 transition-all flex items-center gap-3 group/btn">
              Access Full Archive 
              <ArrowUpRight className="h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
