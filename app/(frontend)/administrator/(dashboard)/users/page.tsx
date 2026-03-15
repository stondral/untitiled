"use client";
// Force rebuild to clear HMR cache - V2

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Shield, ShieldAlert,
  Store, User, Ban, Trash2, Package, ArrowLeftRight, TrendingUp,
  AlertTriangle, Star, ChevronLeft,
} from "lucide-react";
import StepUpModal from "@/components/admin/StepUpModal";

// ─── Types ───────────────────────────────────────────
interface UserType {
  id: string;
  email: string;
  username: string;
  phone?: string;
  role: string;
  plan: string;
  _verified?: boolean;
  createdAt: string;
}

interface SellerType {
  id: string;
  name: string;
  slug: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  owner: any;
  plan: string;
  subscriptionStatus: string;
  description?: string;
  createdAt: string;
}

// ─── Seller Detail View ──────────────────────────────
function SellerDetail({
  seller,
  onBack,
  onRefresh,
}: {
  seller: SellerType;
  onBack: () => void;
  onRefresh: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinAction, setPinAction] = useState<null | "block" | "kick">(null);

  useEffect(() => {
    // Fetch orders for this seller
    fetch("/api/admin/customer-orders", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const allOrders = d.orders || [];
        // Filter orders that contain items from this seller
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matched = allOrders.filter((o: any) =>
          o.items?.some(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any) =>
              (typeof item.seller === "string" ? item.seller : item.seller?.id) === seller.id
          )
        );
        setSellerOrders(matched);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [seller.id]);

  const totalOrders = sellerOrders.length;
  const deliveredOrders = sellerOrders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = sellerOrders.filter((o) => o.status === "cancelled").length;
  const returnedOrders = sellerOrders.filter((o) => o.status === "returned").length;
  const totalRevenue = sellerOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((s, o) => s + (o.total || 0), 0);
  const returnRate = totalOrders > 0 ? ((returnedOrders + cancelledOrders) / totalOrders * 100).toFixed(1) : "0";

  const executePinAction = async () => {
    if (!pinAction) return;
    try {
      if (pinAction === "block") {
        await fetch("/api/admin/master-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            collection: "sellers",
            docId: seller.id,
            data: { subscriptionStatus: "cancelled" },
          }),
        });
      } else if (pinAction === "kick") {
        // Deactivate seller + suspend owner
        await fetch("/api/admin/master-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            collection: "sellers",
            docId: seller.id,
            data: { subscriptionStatus: "cancelled" },
          }),
        });
        const ownerId = typeof seller.owner === "string" ? seller.owner : seller.owner?.id;
        if (ownerId) {
          await fetch("/api/admin/master-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              collection: "users",
              docId: ownerId,
              data: { role: "user" },
            }),
          });
        }
      }
      onRefresh();
      onBack();
    } catch { }
    setPinAction(null);
  };

  const ownerName = typeof seller.owner === "object" ? seller.owner?.username || seller.owner?.email : seller.owner;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-white font-bold transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Sellers
      </button>

      {/* Seller Header */}
      <Card className="p-6 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <Store className="w-7 h-7 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">{seller.name}</h2>
              <p className="text-xs text-slate-400 font-bold">
                Owner: {ownerName} · Plan: <span className="text-indigo-400">{seller.plan}</span> ·
                Status: <span className={seller.subscriptionStatus === "active" ? "text-emerald-400" : "text-red-400"}>{seller.subscriptionStatus}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPinAction("block")}
              className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-500/30 dark:text-orange-400 dark:hover:bg-orange-500/10 font-bold text-xs"
            >
              <Ban className="w-3 h-3 mr-1" /> Block Seller
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPinAction("kick")}
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 font-bold text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Kick Seller
            </Button>
          </div>
        </div>
      </Card>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Orders", value: totalOrders, icon: Package, color: "text-indigo-500 bg-indigo-500/10" },
          { label: "Delivered", value: deliveredOrders, icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Cancelled", value: cancelledOrders, icon: AlertTriangle, color: "text-yellow-500 bg-yellow-500/10" },
          { label: "Returned", value: returnedOrders, icon: ArrowLeftRight, color: "text-red-500 bg-red-500/10" },
          { label: "Return Rate", value: `${returnRate}%`, icon: ShieldAlert, color: parseFloat(returnRate) > 15 ? "text-red-500 bg-red-500/10" : "text-emerald-500 bg-emerald-500/10" },
          { label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: Star, color: "text-green-500 bg-green-500/10" },
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

      {/* Orders vs Returns Visual Bar */}
      <Card className="p-6 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50">
        <h3 className="font-black text-sm mb-4">Orders vs Returns & Cancellations</h3>
        <div className="flex gap-1 h-8 rounded-xl overflow-hidden mb-3">
          {totalOrders > 0 ? (
            <>
              <div
                className="bg-emerald-500 transition-all duration-500 flex items-center justify-center"
                style={{ width: `${(deliveredOrders / totalOrders) * 100}%` }}
              >
                {deliveredOrders > 0 && <span className="text-[10px] font-bold text-white">{deliveredOrders}</span>}
              </div>
              <div
                className="bg-blue-500 transition-all duration-500 flex items-center justify-center"
                style={{ width: `${((totalOrders - deliveredOrders - cancelledOrders - returnedOrders) / totalOrders) * 100}%` }}
              >
                {(totalOrders - deliveredOrders - cancelledOrders - returnedOrders) > 0 && (
                  <span className="text-[10px] font-bold text-white">{totalOrders - deliveredOrders - cancelledOrders - returnedOrders}</span>
                )}
              </div>
              <div
                className="bg-yellow-500 transition-all duration-500 flex items-center justify-center"
                style={{ width: `${(cancelledOrders / totalOrders) * 100}%` }}
              >
                {cancelledOrders > 0 && <span className="text-[10px] font-bold text-white">{cancelledOrders}</span>}
              </div>
              <div
                className="bg-red-500 transition-all duration-500 flex items-center justify-center"
                style={{ width: `${(returnedOrders / totalOrders) * 100}%` }}
              >
                {returnedOrders > 0 && <span className="text-[10px] font-bold text-white">{returnedOrders}</span>}
              </div>
            </>
          ) : (
            <div className="w-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 font-bold">No orders yet</span>
            </div>
          )}
        </div>
        <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Delivered</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> In Progress</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Cancelled</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Returned</span>
        </div>
      </Card>

      {/* Recent Orders */}
      <Card className="p-6 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50">
        <h3 className="font-black text-sm mb-4">Recent Orders from {seller.name}</h3>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sellerOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-bold">No orders found for this seller</div>
        ) : (
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {sellerOrders.slice(0, 20).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-bold">#{order.orderNumber}</p>
                    <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    order.status === "delivered" ? "bg-emerald-500/20 text-emerald-400" :
                    order.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                    order.status === "returned" ? "bg-orange-500/20 text-orange-400" :
                    "bg-blue-500/20 text-blue-400"
                  }`}>{order.status}</span>
                  <span className="text-sm font-black">₹{order.total?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* TOTP Step-Up Auth for destructive actions */}
      <AnimatePresence>
        {pinAction && (
          <StepUpModal
            action={pinAction === "block" ? "block_seller" : "kick_seller"}
            targetId={seller.id}
            title={pinAction === "block" ? "Block Seller" : "Kick Seller"}
            description={
              pinAction === "block"
                ? `This will deactivate ${seller.name}'s subscription. They won't be able to sell.`
                : `This will permanently remove ${seller.name}'s seller status and demote the owner to a regular user.`
            }
            onVerified={executePinAction}
            onCancel={() => setPinAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Users & Sellers Page ───────────────────────
const UserDetailModal = ({
  user,
  isOpen,
  onClose,
  onRefresh
}: {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinAction, setPinAction] = useState<null | "role_admin" | "role_seller" | "ban">(null);

  const executeAction = async () => {
    if (!pinAction || !user) return;
    try {
      if (pinAction === "ban") {
        await fetch("/api/admin/master-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collection: "users", docId: user.id, operation: "delete" })
        });
      } else if (pinAction === "role_admin") {
        await fetch("/api/admin/master-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collection: "users", docId: user.id, data: { role: user.role === 'admin' ? 'user' : 'admin' } })
        });
      } else if (pinAction === "role_seller") {
        await fetch("/api/admin/master-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collection: "users", docId: user.id, data: { role: user.role === 'seller' ? 'user' : 'seller' } })
        });
      }
      onRefresh();
      onClose();
    } catch (err) {
      console.error("Action error", err);
    }
    setPinAction(null);
  };

  useEffect(() => {
    if (user && isOpen) {
      setLoading(true);
      fetch(`/api/admin/customer-orders?customerId=${user.id}`, { credentials: "include" })
        .then(r => r.json())
        .then(data => setOrders(data.orders || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, isOpen]);

  if (!user || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tighter">{user.username || "Unnamed User"}</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <Trash2 className="w-5 h-5 text-slate-400 rotate-45" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Role</p>
              <p className="text-sm font-black uppercase text-indigo-500">{user.role}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Member Since</p>
              <p className="text-sm font-black">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
              <p className="text-sm font-black">{orders.length}</p>
            </div>
          </div>

          {/* Activity Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" /> Recent Activity
            </h4>
            {loading ? (
              <div className="h-20 flex items-center justify-center"><div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase">No orders found for this user</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black">Order #{order.id.slice(-6).toUpperCase()}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black">₹{order.total?.toLocaleString('en-IN')}</p>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                        order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Management Console */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" /> Management Console
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setPinAction("role_admin")}
                className={`h-12 rounded-2xl font-black uppercase text-xs ${user.role === 'admin' ? 'text-slate-500' : 'text-red-500 border-red-100'}`}
              >
                {user.role === 'admin' ? "Demote to User" : "Make Admin"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPinAction("role_seller")}
                className={`h-12 rounded-2xl font-black uppercase text-xs ${user.role === 'seller' ? 'text-slate-500' : 'text-indigo-500 border-indigo-100'}`}
              >
                {user.role === 'seller' ? "Demote to User" : "Make Seller"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPinAction("ban")}
                className="h-12 rounded-2xl font-black uppercase text-xs text-red-600 bg-red-50 border-red-100 hover:bg-red-100 col-span-2"
              >
                <Ban className="w-4 h-4 mr-2" /> Ban Account
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {pinAction && (
            <StepUpModal
              action={pinAction}
              targetId={user.id}
              title={
                pinAction === "ban" ? "Ban User Account" :
                pinAction === "role_admin" ? (user.role === 'admin' ? "Demote Admin" : "Authorize Admin Promotion") :
                "Update User Role"
              }
              description={
                pinAction === "ban" ? `This will permanently disable access for ${user.email}. This action is logged.` :
                pinAction === "role_admin" ? `Changing administrative privileges for ${user.email}.` :
                `Updating access level for ${user.email} to ${user.role === 'seller' ? 'User' : 'Seller'}.`
              }
              onVerified={executeAction}
              onCancel={() => setPinAction(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default function AdminUsersPage() {
  const [tab, setTab] = useState<"users" | "sellers">("users");
  const [users, setUsers] = useState<UserType[]>([]);
  const [sellers, setSellers] = useState<SellerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<SellerType | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, sellersRes] = await Promise.all([
        fetch("/api/admin/customer-orders?type=users", { credentials: "include" }),
        fetch("/api/admin/customer-orders?type=sellers", { credentials: "include" }),
      ]);

      const usersData = await usersRes.json();
      const sellersData = await sellersRes.json();

      setUsers(usersData.users || []);
      setSellers(sellersData.sellers || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredUsers = users.filter((u) =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSellers = sellers.filter((s) =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.slug?.toLowerCase().includes(search.toLowerCase())
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userStats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    sellers: users.filter((u) => u.role === "seller").length,
    regular: users.filter((u) => u.role === "user").length,
  };

  if (selectedSeller) {
    return <SellerDetail seller={selectedSeller} onBack={() => setSelectedSeller(null)} onRefresh={fetchData} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">User Management</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Manage system users, sellers & employees</p>
        </div>
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
              tab === "users" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-400"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setTab("sellers")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
              tab === "sellers" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-400"
            }`}
          >
            Sellers (Orgs)
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder={tab === "users" ? "Search users..." : "Search sellers..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl"
        />
      </div>

      <div className="space-y-2">
        {tab === "users" ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="group p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-500 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  user.role === 'admin' ? 'bg-red-500/10' : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  <User className={`w-5 h-5 ${user.role === 'admin' ? 'text-red-500' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight">{user.username || "Unnamed User"}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  user.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                  user.role === 'seller' ? 'bg-indigo-500/10 text-indigo-500' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {user.role}
                </span>
                <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-all rotate-180" />
              </div>
            </div>
          ))
        ) : (
          filteredSellers.map((seller) => (
            <div
              key={seller.id}
              onClick={() => setSelectedSeller(seller)}
              className="group p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-500 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight">{seller.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{seller.plan} Plan</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  seller.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {seller.subscriptionStatus}
                </span>
                <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-all rotate-180" />
              </div>
            </div>
          ))
        )}
      </div>

      <UserDetailModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onRefresh={fetchData}
      />
    </div>
  );
}
