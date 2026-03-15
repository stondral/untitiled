"use client";

import React from "react";

import { 
    Mail, 
    CheckCircle2, 
    MessageSquare, 
    Clock, 
    Eye,
    MousePointerClick,
    PhoneCall,
    ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
    id: string;
    type: 'email_sent' | 'email_opened' | 'email_clicked' | 'call_logged' | 'replied' | 'status_change' | 'note_added';
    content: string;
    createdAt: string;
}

const ACTIVITY_CONFIG: Record<string, { color: string; label: string }> = {
    email_sent: { color: "bg-indigo-600 text-white", label: "Email Sent" },
    email_opened: { color: "bg-emerald-500 text-white", label: "Email Opened" },
    email_clicked: { color: "bg-cyan-500 text-white", label: "Link Clicked" },
    call_logged: { color: "bg-amber-500 text-white", label: "Call Logged" },
    replied: { color: "bg-blue-500 text-white", label: "Replied" },
    status_change: { color: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300", label: "Status Change" },
    note_added: { color: "bg-slate-100 text-slate-500", label: "Note" },
};

export function LeadTimeline({ activities }: { activities: Activity[] }) {
    if (!activities || activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
                <div className="h-12 w-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800">
                    <Clock className="w-6 h-6 text-slate-300" />
                </div>
                <div>
                    <p className="font-bold text-slate-400 text-sm">No activity logged yet.</p>
                    <p className="text-xs text-slate-300">Launch a campaign to start tracking.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 relative before:absolute before:inset-0 before:left-[14px] before:border-l-2 before:border-slate-100 dark:before:border-slate-800">
            {activities.map((activity) => {
                const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.note_added;
                return (
                    <div key={activity.id} className="relative pl-10">
                        <div className={cn(
                            "absolute left-0 h-7 w-7 rounded-lg flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm z-10",
                            config.color
                        )}>
                            <ActivityIcon type={activity.type} />
                        </div>
                        
                        <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-sm transition-all bg-white dark:bg-slate-900">
                            <div className="flex items-center justify-between mb-1">
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    activity.type === 'email_opened' ? "text-emerald-500" :
                                    activity.type === 'email_clicked' ? "text-cyan-500" :
                                    activity.type === 'call_logged' ? "text-amber-500" :
                                    "text-indigo-500"
                                )}>
                                    {config.label}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400">
                                    {new Date(activity.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {activity.content}
                            </p>
                            {activity.type === 'email_sent' && (
                                <div className="mt-2 flex items-center gap-3 border-t border-slate-50 dark:border-slate-800 pt-2">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                        <ArrowUpRight className="w-2.5 h-2.5" /> SMTP
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                                        <CheckCircle2 className="w-2.5 h-2.5" /> Delivered
                                    </div>
                                </div>
                            )}
                            {activity.type === 'email_opened' && (
                                <div className="mt-2 flex items-center gap-1 border-t border-slate-50 dark:border-slate-800 pt-2 text-[10px] font-bold text-emerald-500">
                                    <Eye className="w-2.5 h-2.5" /> Recipient opened this email
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ActivityIcon({ type }: { type: string }) {
    switch (type) {
        case 'email_sent': return <Mail className="w-3.5 h-3.5" />;
        case 'email_opened': return <Eye className="w-3.5 h-3.5" />;
        case 'email_clicked': return <MousePointerClick className="w-3.5 h-3.5" />;
        case 'call_logged': return <PhoneCall className="w-3.5 h-3.5" />;
        case 'replied': return <MessageSquare className="w-3.5 h-3.5" />;
        default: return <Clock className="w-3.5 h-3.5" />;
    }
}
