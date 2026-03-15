"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package, Search, ChevronDown, ChevronUp, Clock, CheckCircle2,
  Truck, XCircle, DollarSign, ShoppingBag,
  MapPin,
} from "lucide-react";
import StepUpModal from "@/components/admin/StepUpModal";

interface Order {
  id: string;
  orderNumber: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  subtotal: number;
  shippingCost: number;
  gst: number;
  platformFee: number;
  discountAmount: number;
  total: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shippingAddress: any;
  orderDate: string;
  discountCode?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  delivered: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  returned: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  refunded: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: "text-yellow-400",
  paid: "text-emerald-400",
  failed: "text-red-400",
  refunded: "text-purple-400",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pinAction, setPinAction] = useState<null | { id: string, status: string }>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/customer-orders", { credentials: "include" });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateOrder = async (id: string, updates: Record<string, any>) => {
    try {
      await fetch("/api/admin/order-master-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: id, ...updates }),
      });
      fetchOrders();
    } catch { }
  };

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      (typeof o.user === "object" && o.user?.email?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    revenue: orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + (o.total || 0), 0),
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
        <h1 className="text-3xl font-black tracking-tighter">Order Management</h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Track & manage all customer orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Package, color: "text-indigo-500 bg-indigo-500/10" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-500 bg-yellow-500/10" },
          { label: "Processing", value: stats.processing, icon: ShoppingBag, color: "text-blue-500 bg-blue-500/10" },
          { label: "Shipped", value: stats.shipped, icon: Truck, color: "text-indigo-500 bg-indigo-500/10" },
          { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-green-500 bg-green-500/10" },
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by order # or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                statusFilter === s
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400">No orders found</p>
          </Card>
        ) : (
          filtered.map((order) => (
            <Card key={order.id} className="border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50 overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">#{order.orderNumber}</p>
                      <p className="text-xs text-slate-400">
                        {typeof order.user === "object" ? order.user?.email : "Guest"} · {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                      {order.status}
                    </span>
                    <span className={`text-[10px] font-bold ${PAYMENT_COLORS[order.paymentStatus] || "text-slate-400"}`}>
                      {order.paymentMethod?.toUpperCase()} · {order.paymentStatus}
                    </span>
                    <p className="font-black text-sm">₹{order.total?.toLocaleString()}</p>
                    {expandedId === order.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
              </div>

              {expandedId === order.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-slate-100 dark:border-slate-700/50 p-4">
                  {/* Items */}
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Items ({order.items?.length || 0})</h4>
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {order.items?.map((item: any, idx: number) => {
                        const price = item.priceAtPurchase || item.price || 0;
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                            <div>
                              <p className="text-sm font-semibold">{item.productName}</p>
                              <p className="text-xs text-slate-400">Qty: {item.quantity} · ₹{price.toLocaleString('en-IN')}</p>
                            </div>
                            <p className="text-sm font-bold">₹{(item.quantity * price).toLocaleString('en-IN')}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
                    <div className="p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                      <p className="text-slate-400">Subtotal</p>
                      <p className="font-bold">₹{order.subtotal?.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                      <p className="text-slate-400">Shipping</p>
                      <p className="font-bold">₹{order.shippingCost?.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                      <p className="text-slate-400">GST</p>
                      <p className="font-bold">₹{order.gst?.toLocaleString()}</p>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-green-600">Discount {order.discountCode && `(${order.discountCode})`}</p>
                        <p className="font-bold text-green-600">-₹{order.discountAmount?.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  {order.shippingAddress && typeof order.shippingAddress === "object" && (
                    <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-xs">
                      <div className="flex items-center gap-1 text-slate-400 mb-1"><MapPin className="w-3 h-3" /> Shipping Address</div>
                      <p className="text-sm">{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {order.status === "pending" && (
                      <Button size="sm" onClick={() => updateOrder(order.id, { status: "processing" })}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
                        <ShoppingBag className="w-3 h-3 mr-1" /> Process
                      </Button>
                    )}
                    {order.status === "processing" && (
                      <Button size="sm" onClick={() => updateOrder(order.id, { status: "shipped" })}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                        <Truck className="w-3 h-3 mr-1" /> Mark Shipped
                      </Button>
                    )}
                    {order.status === "shipped" && (
                      <Button size="sm" onClick={() => updateOrder(order.id, { status: "delivered" })}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Delivered
                      </Button>
                    )}
                    {!["cancelled", "delivered", "refunded"].includes(order.status) && (
                      <Button size="sm" variant="outline" onClick={() => setPinAction({ id: order.id, status: "cancelled" })}
                        className="border-red-200 text-red-500 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10 text-xs font-bold">
                        <XCircle className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </Card>
          ))
        )}
      </div>

      <AnimatePresence>
        {pinAction && (
          <StepUpModal
            action="cancel_order"
            targetId={pinAction.id}
            title="Authorize Order Cancellation"
            description={`You are about to cancel order #${orders.find(o => o.id === pinAction.id)?.orderNumber}. This action will notify the customer and potentially trigger a refund.`}
            onVerified={async () => {
              if (pinAction) {
                await updateOrder(pinAction.id, { status: pinAction.status });
              }
              setPinAction(null);
            }}
            onCancel={() => setPinAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
