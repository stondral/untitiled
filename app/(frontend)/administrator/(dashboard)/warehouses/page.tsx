"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin, Phone,
  Truck, Search,
  Plus, Edit3, Trash2, Store,
  User, Hash
} from "lucide-react";
import StepUpModal from "@/components/admin/StepUpModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Warehouse {
  id: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seller: any;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    label: "",
    seller: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const [pinAction, setPinAction] = useState<null | "create" | "update" | { type: "delete", id: string }>(null);

  const fetchData = useCallback(async () => {
    try {
      const [warehousesRes, sellersRes] = await Promise.all([
        fetch("/api/admin/customer-orders?type=warehouses", { credentials: "include" }),
        fetch("/api/admin/customer-orders?type=sellers", { credentials: "include" })
      ]);
      const warehousesData = await warehousesRes.json();
      const sellersData = await sellersRes.json();
      
      // Map the data to match the Warehouse interface if needed
      setWarehouses(warehousesData.warehouses || []);
      setSellers(sellersData.sellers || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    try {
      await fetch("/api/admin/master-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: "warehouses",
          operation: "create",
          data: formData,
        }),
      });
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch { }
  };

  const handleUpdate = async () => {
    if (!selectedId) return;
    try {
      await fetch("/api/admin/master-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: "warehouses",
          operation: "update",
          docId: selectedId,
          data: formData,
        }),
      });
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch { }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/admin/master-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: "warehouses",
          operation: "delete",
          docId: id,
        }),
      });
      fetchData();
    } catch { }
  };

  const openEditModal = (w: Warehouse) => {
    setModalMode("edit");
    setSelectedId(w.id);
    setFormData({
      label: w.label,
      seller: typeof w.seller === "string" ? w.seller : w.seller?.id || "",
      firstName: w.firstName,
      lastName: w.lastName,
      email: w.email,
      phone: w.phone,
      address: w.address,
      apartment: w.apartment || "",
      city: w.city,
      state: w.state,
      postalCode: w.postalCode,
      country: w.country,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      label: "",
      seller: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      apartment: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    });
    setSelectedId(null);
  };

  const filtered = warehouses.filter((w) => 
    w.label.toLowerCase().includes(search.toLowerCase()) || 
    w.city.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">Warehouses</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Inventory hubs & logistics management</p>
        </div>
        <Button 
          onClick={() => { setModalMode("create"); resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4 mr-2" /> Register Warehouse
        </Button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.95 }} 
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                    <Truck className="w-5 h-5 text-indigo-500" />
                  </div>
                  {modalMode === "create" ? "Register Warehouse" : "Edit Warehouse"}
                </h3>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl h-12">
                    <TabsTrigger value="general" className="rounded-xl font-bold text-xs uppercase tracking-widest">General</TabsTrigger>
                    <TabsTrigger value="contact" className="rounded-xl font-bold text-xs uppercase tracking-widest">Contact</TabsTrigger>
                    <TabsTrigger value="address" className="rounded-xl font-bold text-xs uppercase tracking-widest">Address</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Warehouse Name</label>
                       <Input value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="e.g. Mumbai Main Hub" className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Associated Seller</label>
                      <select 
                        value={formData.seller} 
                        onChange={e => setFormData({...formData, seller: e.target.value})} 
                        className="w-full h-12 rounded-xl border bg-transparent px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select a seller...</option>
                        {sellers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">First Name</label>
                        <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Last Name</label>
                        <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contact Email</label>
                      <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number</label>
                      <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                  </TabsContent>

                  <TabsContent value="address" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Street Address</label>
                      <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">City</label>
                        <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">State</label>
                        <Input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Postal Code</label>
                        <Input value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Country</label>
                        <Input value={formData.country} readOnly className="h-12 rounded-xl bg-slate-50" />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest">Cancel</Button>
                <Button 
                  onClick={() => setPinAction(modalMode === "create" ? "create" : "update")}
                  className="h-14 flex-[2] bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                >
                  {modalMode === "create" ? "Register Now" : "Save Changes"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <Card className="p-20 text-center col-span-full border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hubs found</p>
          </Card>
        ) : (
          filtered.map((w) => (
            <Card key={w.id} className="p-6 border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50 hover:border-indigo-500/50 transition-all group overflow-hidden relative rounded-[2rem]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Truck className="w-7 h-7 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight leading-none mb-1">{w.label}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {w.city}, {w.state}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Store className="w-3 h-3" /> {(w as any).seller?.name || "Global"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <span>{w.firstName} {w.lastName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                  <span>{w.phone}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                  <Hash className="w-3 h-3" /> {w.postalCode}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => openEditModal(w)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => setPinAction({ type: "delete", id: w.id })} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <AnimatePresence>
        {pinAction && (
          <StepUpModal
            action={typeof pinAction === "string" ? "manage_warehouse" : "delete_warehouse"}
            title={pinAction === "create" ? "Authorize Hub Registration" : pinAction === "update" ? "Authorize Update" : "Authorize Deletion"}
            description={
              pinAction === "create" 
                ? "Registering a new warehouse hub for logistics. This will also update the Delhivery network."
                : pinAction === "update"
                ? "Modifying existing warehouse records. This may affect ongoing logistics."
                : "Permanently removing this warehouse hub from the network."
            }
            onVerified={async () => {
              if (pinAction === "create") {
                await handleCreate();
              } else if (pinAction === "update") {
                await handleUpdate();
              } else if (typeof pinAction === "object" && pinAction?.type === "delete") {
                await handleDelete(pinAction.id);
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
