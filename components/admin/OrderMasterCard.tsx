"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  MapPin, 
  CreditCard, 
  Edit3, 
  Save, 
  X, 
  CheckCircle, 
  CircleAlert as AlertCircle,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ShippingAddress {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface Warehouse {
  id: string;
  label?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface Delivery {
  provider?: string;
  trackingId?: string;
  cost?: number;
  gst?: number;
  pickupWarehouse?: string | Warehouse;
}

interface OrderMasterCardProps {
  order: {
    id: string;
    orderNumber?: string;
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    total?: number;
    shippingAddress?: string | ShippingAddress;
    delivery?: Delivery;
    _isFallback?: boolean;
    razorpayPaymentId?: string;
  };
  onUpdate?: () => void;
  isReadOnly?: boolean;
}

export function OrderMasterCard({ order, onUpdate, isReadOnly }: OrderMasterCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    status: order?.status || '',
    paymentStatus: order?.paymentStatus || '',
    shippingAddress: {
      id: (typeof order?.shippingAddress === 'object' ? order.shippingAddress?.id : order?.shippingAddress) || '',
      firstName: (typeof order?.shippingAddress === 'object' ? order.shippingAddress?.firstName : '') || '',
      lastName: (typeof order?.shippingAddress === 'object' ? order.shippingAddress?.lastName : '') || '',
      email: (typeof order?.shippingAddress === 'object' ? order.shippingAddress?.email : '') || '',
      phone: (typeof order?.shippingAddress === 'object' ? order.shippingAddress?.phone : '') || '',
      address: (typeof order?.shippingAddress === 'object' ? order.shippingAddress?.address : '') || '',
      city: (typeof order?.shippingAddress === 'object' ? order.shippingAddress?.city : '') || '',
      state: (typeof order?.shippingAddress === 'object' ? order.shippingAddress?.state : '') || '',
      postalCode: (typeof order?.shippingAddress === 'object' ? order.shippingAddress?.postalCode : '') || '',
    },
    pickupWarehouse: {
      id: (typeof order?.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.id : order?.delivery?.pickupWarehouse) || '',
      label: (typeof order?.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.label : '') || '',
      firstName: (typeof order?.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.firstName : '') || '',
      lastName: (typeof order?.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.lastName : '') || '',
      phone: (typeof order?.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.phone : '') || '',
      address: (typeof order?.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.address : '') || '',
      city: (typeof order?.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.city : '') || '',
      state: (typeof order?.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.state : '') || '',
      postalCode: (typeof order?.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.postalCode : '') || '',
    }
  });

  useEffect(() => {
    if (order) {
      setFormData({
        status: order.status || '',
        paymentStatus: order.paymentStatus || '',
        shippingAddress: {
          id: (typeof order.shippingAddress === 'object' ? order.shippingAddress?.id : order.shippingAddress) || '',
          firstName: (typeof order.shippingAddress === 'object' ? order.shippingAddress?.firstName : '') || '',
          lastName: (typeof order.shippingAddress === 'object' ? order.shippingAddress?.lastName : '') || '',
          email: (typeof order.shippingAddress === 'object' ? order.shippingAddress?.email : '') || '',
          phone: (typeof order.shippingAddress === 'object' ? order.shippingAddress?.phone : '') || '',
          address: (typeof order.shippingAddress === 'object' ? order.shippingAddress?.address : '') || '',
          city: (typeof order.shippingAddress === 'object' ? order.shippingAddress?.city : '') || '',
          state: (typeof order.shippingAddress === 'object' ? order.shippingAddress?.state : '') || '',
          postalCode: (typeof order.shippingAddress === 'object' ? order.shippingAddress?.postalCode : '') || '',
        },
        pickupWarehouse: {
          id: (typeof order.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.id : order.delivery?.pickupWarehouse) || '',
          label: (typeof order.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.label : '') || '',
          firstName: (typeof order.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.firstName : '') || '',
          lastName: (typeof order.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.lastName : '') || '',
          phone: (typeof order.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.phone : '') || '',
          address: (typeof order.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.address : '') || '',
          city: (typeof order.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.city : '') || '',
          state: (typeof order.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.state : '') || '',
          postalCode: (typeof order.delivery?.pickupWarehouse === 'object' ? order.delivery.pickupWarehouse?.postalCode : '') || '',
        }
      });
    }
  }, [order]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      const response = await fetch('/api/admin/order-master-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: order.id,
          ...formData
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: "Master data updated successfully" });
        setIsEditing(false);
        if (onUpdate) onUpdate();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Update failed");
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!order) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 bg-white dark:bg-[#111b21] rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/5 opacity-50">
        <AlertCircle className="h-10 w-10 text-slate-300 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">No_Order_Linked</p>
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2">Master Override Disabled</p>
      </div>
    );
  }

  return (
    <section className="p-8 bg-white dark:bg-[#111b21] rounded-[2.5rem] shadow-xl shadow-black/5 ring-1 ring-black/5 dark:ring-white/5 border-t-8 border-slate-900 transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <Hash className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                {order.orderNumber || 'Legacy_Node'}
              </h4>
              {order?._isFallback && (
                <Badge variant="outline" className="text-[8px] border-amber-200 text-amber-600 bg-amber-50 rounded-md py-0 px-2 font-black uppercase tracking-tighter animate-pulse">
                  Latest_Context
                </Badge>
              )}
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Hash_Protocol_Identity</p>
          </div>
        </div>
        {!isReadOnly && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
            className={cn(
              "h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              isEditing ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            {isEditing ? <><X className="h-3 w-3 mr-2" /> Cancel</> : <><Edit3 className="h-3 w-3 mr-2" /> Master Edit</>}
          </Button>
        )}
      </div>

      {message && (
        <div className={cn(
          "mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300",
          message.type === 'success' ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20" : "bg-rose-50 text-rose-600 ring-1 ring-rose-500/20"
        )}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Section 1: Seller Origin */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 opacity-40">
            <Building2 className="h-3 w-3" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Seller_Origin_Node</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Warehouse / Organization</label>
              {isEditing ? (
                <Input 
                  value={formData.pickupWarehouse.label}
                  onChange={(e) => setFormData({...formData, pickupWarehouse: {...formData.pickupWarehouse, label: e.target.value}})}
                  className="h-10 bg-slate-50 dark:bg-white/5 border-none text-[12px] font-bold rounded-xl"
                />
              ) : (
                <p className="text-xs font-bold text-slate-900 dark:text-white px-1 leading-relaxed">{formData.pickupWarehouse.label || 'Standard_Fullfillment'}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Manager Contact</label>
                {isEditing ? (
                  <Input 
                    value={formData.pickupWarehouse.phone}
                    onChange={(e) => setFormData({...formData, pickupWarehouse: {...formData.pickupWarehouse, phone: e.target.value}})}
                    className="h-10 bg-slate-50 dark:bg-white/5 border-none text-[12px] font-bold rounded-xl"
                  />
                ) : (
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">{formData.pickupWarehouse.phone || 'System_Contact'}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Regional HUB</label>
                {isEditing ? (
                  <Input 
                    value={formData.pickupWarehouse.city}
                    onChange={(e) => setFormData({...formData, pickupWarehouse: {...formData.pickupWarehouse, city: e.target.value}})}
                    className="h-10 bg-slate-50 dark:bg-white/5 border-none text-[12px] font-bold rounded-xl"
                  />
                ) : (
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">{formData.pickupWarehouse.city || 'Central_Logistics'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-slate-100 dark:bg-white/5" />

        {/* Section 2: Customer Destination */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 opacity-40">
            <MapPin className="h-3 w-3" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Client_Destination_Target</span>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">First Name</label>
                {isEditing ? (
                  <Input 
                    value={formData.shippingAddress.firstName}
                    onChange={(e) => setFormData({...formData, shippingAddress: {...formData.shippingAddress, firstName: e.target.value}})}
                    className="h-10 bg-slate-50 dark:bg-white/5 border-none text-[12px] font-bold rounded-xl"
                  />
                ) : (
                  <p className="text-xs font-bold text-slate-900 dark:text-white px-1">{formData.shippingAddress.firstName}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Last Name</label>
                {isEditing ? (
                  <Input 
                    value={formData.shippingAddress.lastName}
                    onChange={(e) => setFormData({...formData, shippingAddress: {...formData.shippingAddress, lastName: e.target.value}})}
                    className="h-10 bg-slate-50 dark:bg-white/5 border-none text-[12px] font-bold rounded-xl"
                  />
                ) : (
                  <p className="text-xs font-bold text-slate-900 dark:text-white px-1">{formData.shippingAddress.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Street Address Override</label>
              {isEditing ? (
                <Input 
                  value={formData.shippingAddress.address}
                  onChange={(e) => setFormData({...formData, shippingAddress: {...formData.shippingAddress, address: e.target.value}})}
                  className="h-10 bg-slate-50 dark:bg-white/5 border-none text-[12px] font-bold rounded-xl"
                />
              ) : (
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1 leading-relaxed italic">&quot;{formData.shippingAddress.address}&quot;</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Locality / PIN</label>
                {isEditing ? (
                  <Input 
                    value={formData.shippingAddress.postalCode}
                    onChange={(e) => setFormData({...formData, shippingAddress: {...formData.shippingAddress, postalCode: e.target.value}})}
                    className="h-10 bg-slate-50 dark:bg-white/5 border-none text-[12px] font-bold rounded-xl"
                  />
                ) : (
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">{formData.shippingAddress.postalCode}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Secure Mobile</label>
                {isEditing ? (
                  <Input 
                    value={formData.shippingAddress.phone}
                    onChange={(e) => setFormData({...formData, shippingAddress: {...formData.shippingAddress, phone: e.target.value}})}
                    className="h-10 bg-slate-50 dark:bg-white/5 border-none text-[12px] font-bold rounded-xl"
                  />
                ) : (
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">{formData.shippingAddress.phone || 'N/A'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-slate-100 dark:bg-white/5" />

        {/* Section 3: Financial Transaction */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 opacity-40">
            <CreditCard className="h-3 w-3" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Financial_Protocol_Status</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Lifecycle Stage</label>
              {isEditing ? (
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger className="h-10 bg-slate-50 dark:bg-white/5 border-none text-[12px] font-bold rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="border-slate-200 text-slate-900 bg-slate-50 text-[10px] font-black uppercase px-3 py-1 rounded-lg">
                  {order.status}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Ledger Status</label>
              {isEditing ? (
                <Select value={formData.paymentStatus} onValueChange={(val) => setFormData({...formData, paymentStatus: val})}>
                  <SelectTrigger className="h-10 bg-slate-50 dark:bg-white/5 border-none text-[12px] font-bold rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className={cn(
                  "text-[10px] font-black uppercase px-3 py-1 rounded-lg",
                  order.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {order.paymentStatus}
                </Badge>
              )}
            </div>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-3xl ring-1 ring-slate-900/5 mt-4">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Valuation</span>
                <span className="text-[16px] font-black text-slate-900 dark:text-white italic">₹{order.total?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Method_{order.paymentMethod}</span>
                <span className="opacity-40">{order.razorpayPaymentId || 'INTERNAL_LEDGER'}</span>
            </div>
          </div>
        </div>

        {isEditing && (
          <Button 
            disabled={isLoading}
            onClick={handleSave}
            className="w-full h-14 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {isLoading ? "Synchronizing..." : <><Save className="h-4 w-4 mr-2" /> Commit Overrides</>}
          </Button>
        )}
      </div>
    </section>
  );
}
