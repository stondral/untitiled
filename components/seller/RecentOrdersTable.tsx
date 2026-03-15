"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Search, Filter, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useMemo } from "react";

interface RecentOrdersTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orders: any[];
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    let result = orders || [];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((order) => {
        const orderId = order.id?.toLowerCase() || "";
        const orderNum = order.orderNumber?.toLowerCase() || "";
        const customerName = order.user?.username?.toLowerCase() || "";
        const customerEmail = order.user?.email?.toLowerCase() || "";
        return (
          orderId.includes(lowerSearch) ||
          orderNum.includes(lowerSearch) ||
          customerName.includes(lowerSearch) ||
          customerEmail.includes(lowerSearch)
        );
      });
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (order) => order.status?.toUpperCase() === statusFilter.toUpperCase()
      );
    }

    return result;
  }, [orders, searchTerm, statusFilter]);

  return (
    <Card className="border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-black/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden transition-colors duration-300 w-full">
      <CardHeader className="p-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800">
        <div>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 italic">Recent Transactions</CardTitle>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-[0.3em]">Comprehensive Activity Monitor</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 pl-11 pr-10 text-sm font-bold rounded-2xl bg-white/50 dark:bg-slate-800/50 border-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-amber-500/50 w-64 transition-all dark:text-slate-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-12 font-black text-xs uppercase tracking-widest gap-2 rounded-2xl border-white dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 px-6 transition-all dark:text-slate-300",
                  statusFilter !== "all" && "ring-2 ring-amber-500/50 border-amber-500/50"
                )}
              >
                <Filter className="h-4 w-4" />
                {statusFilter === "all" ? "Filters" : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-100 dark:border-slate-800">
              <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-widest text-slate-400 p-3">Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-50 dark:bg-slate-800" />
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                <DropdownMenuRadioItem value="all" className="rounded-xl font-bold text-xs p-3">Show All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="PENDING" className="rounded-xl font-bold text-xs p-3">Pending Orders</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ACCEPTED" className="rounded-xl font-bold text-xs p-3">Accepted</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="SHIPPED" className="rounded-xl font-bold text-xs p-3">Shipped</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="DELIVERED" className="rounded-xl font-bold text-xs p-3">Delivered</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="CANCELLED" className="rounded-xl font-bold text-xs p-3 text-red-500">Cancelled</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto scrollbar-hide">
        <div className="min-w-max">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
              <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                <TableHead className="w-[220px] text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 pl-10 py-6">Reference ID</TableHead>
                <TableHead className="min-w-[250px] text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 py-6">Customer Profile</TableHead>
                <TableHead className="w-[180px] text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 py-6">Items</TableHead>
                <TableHead className="w-[200px] text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 text-right py-6">Net Settlement</TableHead>
                <TableHead className="w-[180px] text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 text-center py-6">Status</TableHead>
                <TableHead className="w-[150px] pr-10 py-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-60 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Search className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.2em] text-[10px]">No matches found for your criteria</p>
                      {(searchTerm || statusFilter !== "all") && (
                        <Button
                          variant="ghost"
                          onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
                          className="font-black text-[10px] uppercase tracking-widest text-amber-500 hover:bg-amber-500/10"
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-400/5 border-slate-50 dark:border-slate-800/50 transition-colors group">
                    <TableCell className="font-bold text-slate-400 dark:text-slate-500 pl-10 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-black w-fit border border-slate-200 dark:border-slate-700 shadow-sm">
                          {order.orderNumber || `#${order.id.toUpperCase()}`}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
                          {new Date(order.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-slate-900 shadow-xl shadow-slate-200/20 dark:shadow-black/40">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${order.user?.username || order.user?.email || 'user'}`} />
                          <AvatarFallback className="bg-amber-500 text-white font-black text-xs uppercase">{(order.user?.username || order.user?.email || 'U')[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-600 transition-colors leading-tight">
                            {order.user?.username || order.user?.email?.split('@')[0] || 'Anonymous'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-tighter uppercase mt-0.5">{order.user?.email || 'Guest User'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-black text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                          <span className="text-amber-600 dark:text-amber-500 text-sm font-black">{order.items?.length || 0}</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Products</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-black text-slate-900 dark:text-white text-xl tabular-nums tracking-tighter">
                      ₹{(order.totalAmount !== undefined ? order.totalAmount : (order.total || 0)).toLocaleString('en-IN')}
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Completed</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "border-none font-black text-[9px] px-4 py-1.5 rounded-full uppercase tracking-[0.15em] shadow-sm",
                        (order.status === 'success' || order.status === 'ACCEPTED' || order.status === 'SHIPPED' || order.status === 'DELIVERED') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 ring-1 ring-emerald-500/20' :
                          (order.status === 'pending' || order.status === 'PENDING') ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500 ring-1 ring-amber-500/20' :
                            'bg-slate-500/10 text-slate-500 dark:text-slate-400 ring-1 ring-slate-500/20'
                      )}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-10 text-right">
                      <Link href={`/seller/orders/${order.id}`}>
                        <Button className="h-11 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-lg hover:bg-amber-500 dark:hover:bg-amber-500 hover:text-white dark:hover:text-white group-hover:shadow-amber-500/20">
                          View Details
                          <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-8 px-10 flex items-center justify-between bg-slate-50/30 dark:bg-slate-400/5 border-t border-slate-50 dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Displaying {filteredOrders.length} Recent Node Entries</span>
            <div className="flex items-center gap-3">
              <Button variant="ghost" disabled={filteredOrders.length === 0} className="h-10 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-amber-500 transition-colors">Previous</Button>
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <Button variant="ghost" disabled={filteredOrders.length === 0} className="h-10 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-amber-500 transition-colors">Next Page</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
