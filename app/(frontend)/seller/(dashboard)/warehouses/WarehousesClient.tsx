"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  CircleAlert as AlertCircle,
  Warehouse,
  Loader2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createWarehouseAction, updateWarehouseAction, deleteWarehouseAction } from "./actions"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WarehousesClient({ initialWarehouses }: { initialWarehouses: any[] }) {
  const [warehouses, setWarehouses] = useState(initialWarehouses)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    label: "",
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
  })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setFormData({
      label: "",
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
    })
    setIsAdding(false)
    setEditingId(null)
    setError(null)
  }

  interface Warehouse { id: string; label: string; firstName: string; lastName: string; email: string; phone: string; address: string; apartment?: string; city: string; state: string; postalCode: string; country: string }
  const handleEdit = (warehouse: Warehouse) => {
    setFormData({
      label: warehouse.label,
      firstName: warehouse.firstName,
      lastName: warehouse.lastName,
      email: warehouse.email,
      phone: warehouse.phone,
      address: warehouse.address,
      apartment: warehouse.apartment || "",
      city: warehouse.city,
      state: warehouse.state,
      postalCode: warehouse.postalCode,
      country: warehouse.country,
    })
    setEditingId(warehouse.id)
    setIsAdding(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    startTransition(async () => {
      let result
      if (editingId) {
        result = await updateWarehouseAction(editingId, formData)
      } else {
        result = await createWarehouseAction(formData)
      }

      if (result.ok) {
        if (editingId) {
          setWarehouses(prev => prev.map(w => w.id === editingId ? result.data : w))
        } else {
          setWarehouses(prev => [result.data, ...prev])
        }
        resetForm()
      } else {
        setError(result.error || null)
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this warehouse?")) return

    startTransition(async () => {
      const result = await deleteWarehouseAction(id)
      if (result.ok) {
        setWarehouses(prev => prev.filter(w => w.id !== id))
      } else {
        setError(result.error || null)
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        {!isAdding && (
          <Button 
            onClick={() => setIsAdding(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl px-8 h-14 shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add New Warehouse
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="p-1"
          >
            <Card className="border border-slate-100 shadow-2xl shadow-slate-200/40 bg-white rounded-[2.5rem] overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-50 rounded-2xl flex items-center justify-center">
                    <Warehouse className="h-5 w-5 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{editingId ? "Edit Warehouse" : "Add Warehouse"}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={resetForm} className="rounded-xl">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Basic Information</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Tag className="h-3 w-3" /> Warehouse Name / Label
                          </Label>
                          <Input 
                            required
                            placeholder="e.g. Main Warehouse, Mumbai Branch"
                            value={formData.label}
                            onChange={e => setFormData({ ...formData, label: e.target.value })}
                            className="rounded-2xl h-12 border-slate-100 focus:ring-amber-500/20 focus:border-amber-500 font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">First Name</Label>
                            <Input 
                              required
                              value={formData.firstName}
                              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                              className="rounded-2xl h-12 border-slate-100 font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Last Name</Label>
                            <Input 
                              required
                              value={formData.lastName}
                              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                              className="rounded-2xl h-12 border-slate-100 font-bold"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase">Email Address</Label>
                          <Input 
                            required
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="rounded-2xl h-12 border-slate-100 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase">Phone Number</Label>
                          <Input 
                            required
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="rounded-2xl h-12 border-slate-100 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Info */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Location Details</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase">Address Line 1</Label>
                          <Input 
                            required
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="rounded-2xl h-12 border-slate-100 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase">Apartment/Suite (Optional)</Label>
                          <Input 
                            value={formData.apartment}
                            onChange={e => setFormData({ ...formData, apartment: e.target.value })}
                            className="rounded-2xl h-12 border-slate-100 font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">City</Label>
                            <Input 
                              required
                              value={formData.city}
                              onChange={e => setFormData({ ...formData, city: e.target.value })}
                              className="rounded-2xl h-12 border-slate-100 font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">State</Label>
                            <Input 
                              required
                              value={formData.state}
                              onChange={e => setFormData({ ...formData, state: e.target.value })}
                              className="rounded-2xl h-12 border-slate-100 font-bold"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Postal Code</Label>
                            <Input 
                              required
                              value={formData.postalCode}
                              onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                              className="rounded-2xl h-12 border-slate-100 font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Country</Label>
                            <Input 
                              required
                              value={formData.country}
                              onChange={e => setFormData({ ...formData, country: e.target.value })}
                              className="rounded-2xl h-12 border-slate-100 font-bold bg-slate-50"
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 italic">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isPending}
                      className="bg-slate-900 hover:bg-black text-white font-black rounded-2xl px-10 h-14 shadow-xl active:scale-95 flex-1 md:flex-none"
                    >
                      {isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
                      {editingId ? "Update Warehouse" : "Create Warehouse"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={resetForm}
                      className="font-bold text-slate-500 rounded-2xl h-14"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {warehouses.map((warehouse) => (
              <motion.div
                key={warehouse.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="group p-1"
              >
                <Card className="border border-slate-100 shadow-xl shadow-slate-200/40 bg-white rounded-[2rem] overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Warehouse className="h-4 w-4 text-amber-500" />
                        </div>
                        <h3 className="font-black text-slate-900 truncate max-w-[150px]">{warehouse.label}</h3>
                      </div>
                      <div className="flex items-center gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(warehouse)}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(warehouse.id)}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <User className="h-3 w-3 text-slate-300" />
                        <span>{warehouse.firstName} {warehouse.lastName}</span>
                      </div>
                      <div className="flex items-start gap-3 text-xs font-bold text-slate-500">
                        <MapPin className="h-3 w-3 text-slate-300 mt-0.5" />
                        <span className="leading-relaxed">
                          {warehouse.address}, {warehouse.apartment && `${warehouse.apartment}, `}
                          {warehouse.city}, {warehouse.state} {warehouse.postalCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <Phone className="h-3 w-3 text-slate-300" />
                        <span>{warehouse.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <Mail className="h-3 w-3 text-slate-300" />
                        <span className="truncate">{warehouse.email}</span>
                      </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
                          <Check className="h-3 w-3" /> Active
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {warehouses.length === 0 && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-4 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
                  <Warehouse className="h-10 w-10 text-slate-200" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">No warehouses yet</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1 font-medium">Add a pickup location to start fulfilling orders through our partnered delivery networks.</p>
                </div>
                <Button 
                  onClick={() => setIsAdding(true)}
                  variant="outline"
                  className="rounded-xl font-bold mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Register First Warehouse
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Tag(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  )
}
