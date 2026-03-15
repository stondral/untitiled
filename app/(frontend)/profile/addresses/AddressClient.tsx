"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus,MapPin,
  Home,
  Briefcase,
  Trash2,
  Edit3,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import AddressForm from "./AddressForm";
import { useAddresses, Address } from "@/hooks/useAddresses";

interface AddressClientProps {
  initialAddresses: Address[];
}

export default function AddressClient({
  initialAddresses,
}: AddressClientProps) {
  const router = useRouter();
  const { addresses, deleteAddress, setDefaultAddress } = useAddresses(initialAddresses);
  
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const handleAddAddress = () => {
    setEditingAddress(undefined);
    setShowForm(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    setLoading((prev) => ({ ...prev, [id]: true }));

    try {
      const result = await deleteAddress(id);
      if (!result.success) {
        alert(result.error || "Failed to delete address");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSetDefault = async (id: string) => {
    setLoading((prev) => ({ ...prev, [id]: true }));

    try {
      const result = await setDefaultAddress(id);
      if (!result.success) {
        alert(result.error || "Failed to set default address");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleFormSuccess = () => {
    // AddressForm still uses the server action which triggers revalidatePath
    // Our TanStack query relies on initialData, so router.refresh gets new initialData 
    // seamlessly triggering a UI update. Or optimistic UI handles it.
    router.refresh();
  };

  return (
    <>
      <div className="min-h-screen bg-[#F8F9FA] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-8 items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest hidden md:flex">
            <Link
              href="/profile"
              className="hover:text-orange-600 transition-colors"
            >
              Your Account
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">Your Addresses</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-black text-gray-400 uppercase tracking-tighter mb-4">
                <MapPin className="w-3 h-3" />
                Delivery Hub
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                Your Addresses
              </h1>
            </div>

            <button
              onClick={handleAddAddress}
              className="flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-orange-100 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              Add New Address
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Add New Slot */}
            <button
              onClick={handleAddAddress}
              className="flex flex-col items-center justify-center p-6 md:p-8 rounded-[2.5rem] border-2 border-dashed border-gray-200 hover:border-orange-200 hover:bg-orange-50/30 transition-all group min-h-[280px] md:min-h-[320px]"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-50 group-hover:bg-orange-100 flex items-center justify-center mb-6 transition-colors">
                <Plus className="w-8 h-8 text-gray-300 group-hover:text-orange-600 transition-colors" />
              </div>
              <p className="text-xl font-black text-gray-900 mb-2">
                New Address
              </p>
              <p className="text-gray-400 text-sm font-medium text-center">
                Add a delivery point for your masterpieces
              </p>
            </button>

            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`relative flex flex-col p-6 md:p-8 rounded-[2.5rem] bg-white border shadow-xl shadow-gray-200/40 transition-all hover:shadow-2xl overflow-hidden ${
                  addr.isDefault
                    ? "border-orange-200 ring-2 ring-orange-50"
                    : "border-gray-100"
                }`}
              >
                {addr.isDefault && (
                  <div className="absolute top-0 right-0 px-6 py-2 bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-bl-2xl">
                    Default
                  </div>
                )}

                <div className="flex items-center justify-between mb-8">
                  <div
                    className={`p-4 rounded-2xl ${
                      addr.addressType === "home"
                        ? "bg-orange-50 text-orange-600"
                        : addr.addressType === "work"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {addr.addressType === "home" ? (
                      <Home className="w-6 h-6" />
                    ) : addr.addressType === "work" ? (
                      <Briefcase className="w-6 h-6" />
                    ) : (
                      <MapPin className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditAddress(addr)}
                      className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      disabled={loading[addr.id]}
                      className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                  <p className="font-black text-gray-900 text-lg uppercase tracking-tight">
                    {addr.label}
                  </p>
                  <p className="text-gray-900 font-extrabold pb-2">
                    {addr.firstName} {addr.lastName}
                  </p>
                  <div className="text-gray-500 font-medium text-sm leading-relaxed">
                    <p>{addr.address}</p>
                    {addr.apartment && <p>{addr.apartment}</p>}
                    <p>
                      {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    <p>{addr.country}</p>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Contact
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {addr.phone}
                    </p>
                  </div>
                </div>

                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={loading[addr.id]}
                    className="mt-6 w-full py-3 text-xs font-black text-gray-400 hover:text-orange-600 uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    {loading[addr.id] ? "Setting..." : "Set as default"}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Back Link mobile */}
          <Link
            href="/profile"
            className="mt-12 md:hidden flex items-center justify-center gap-2 py-4 text-gray-400 font-black uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
        </div>
      </div>

      {showForm && (
        <AddressForm
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
          editingAddress={editingAddress}
        />
      )}
    </>
  );
}
