"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleAlert as AlertCircle, ShoppingBag, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function OrderNotFound() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border-2 border-dashed border-rose-200 dark:border-rose-800"
      >
        <AlertCircle className="w-10 h-10 text-rose-500" />
      </motion.div>

      <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 italic tracking-tighter">
        Order Not Found
      </h1>
      
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-10 font-bold">
        We couldn&apos;t find an order matching <span className="text-rose-500 font-black">&quot;{query}&quot;</span> in your organization. Please verify the Order ID or check if it belongs to your store.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
          <Link href="/seller/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
          </Link>
        </Button>
        <Button asChild className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all">
          <Link href="/seller/orders">
            <ShoppingBag className="w-4 h-4 mr-2" /> View All Orders
          </Link>
        </Button>
      </div>
    </div>
  );
}
