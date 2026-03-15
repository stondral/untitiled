"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  CalendarDays,
  Package,
  Users,
  Ticket,
  MessageCircle,
  Star,
  Settings,
  Truck,
  Megaphone,
  Layout,
  Zap
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import logoston from "@/components/logoston.png";
import type { User } from "@/payload-types";

interface AdminSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  user?: (User & { collection: 'users' }) | null;
}

const adminLinks = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/administrator",
  },
  {
    title: "Orders",
    icon: Package,
    href: "/administrator/orders",
  },
  {
    title: "Users & Sellers",
    icon: Users,
    href: "/administrator/users",
  },
  {
    title: "Product Approval",
    icon: ShieldCheck,
    href: "/administrator/products",
  },
  {
    title: "AI Discovery",
    icon: Zap,
    href: "/administrator/ai-tags",
  },
  {
    title: "Discount Codes",
    icon: Ticket,
    href: "/administrator/discounts",
  },
  {
    title: "Feedback",
    icon: MessageCircle,
    href: "/administrator/feedback",
  },
  {
    title: "Reviews",
    icon: Star,
    href: "/administrator/reviews",
  },
  {
    title: "Warehouses",
    icon: Truck,
    href: "/administrator/warehouses",
  },
  {
    title: "Meetings",
    icon: CalendarDays,
    href: "/administrator/meetings",
  },
  {
    title: "Marketing",
    icon: Megaphone,
    href: "/administrator/marketing",
  },
  {
    title: "Intelligence Templates",
    icon: Layout,
    href: "/administrator/marketing/templates",
  },
  {
    title: "Support Panel",
    icon: MessageSquare,
    href: "/administrator/support",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/administrator/settings",
  }
];

export function AdminSidebar({ className, user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "bg-slate-900 text-slate-400 h-screen flex flex-col border-r border-slate-800 relative transition-all duration-300 overflow-hidden",
        isCollapsed ? "w-20" : "w-72",
        className
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white z-50"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <div className={cn("h-24 px-8 flex items-center gap-3 border-b border-slate-800 shrink-0", isCollapsed && "px-4 justify-center")}>
        <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <Image src={logoston} alt="Logo" width={26} height={26} />
        </div>
        {!isCollapsed && (
          <div>
            <span className="text-lg font-black text-white">
              CRM Admin <span className="text-indigo-400">v2.1</span>
            </span>
          </div>
        )}
      </div>

      <div 
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-6 px-4 space-y-2 scrollbar-hide no-scrollbar" 
      >
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200",
                pathname === link.href 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "hover:bg-slate-800 hover:text-white",
                isCollapsed && "justify-center px-2"
              )}
            >
              <link.icon className={cn("h-5 w-5", pathname === link.href ? "text-white" : "text-slate-500")} />
              {!isCollapsed && <span>{link.title}</span>}
            </div>
          </Link>
        ))}
      </div>

      {user && !isCollapsed && (
        <div className="p-4 border-t border-slate-800 flex items-center gap-3 bg-slate-900 shadow-[0_-10px_20px_rgba(0,0,0,0.2)] z-10 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
            {user.email?.[0]}
          </div>
          <div className="overflow-hidden">
            <p className="font-black text-white truncate">{user.email?.split('@')[0] || "Admin"}</p>
            <p className="text-[10px] uppercase text-indigo-400 font-bold tracking-widest">Administrator</p>
          </div>
        </div>
      )}
    </div>
  );
}
