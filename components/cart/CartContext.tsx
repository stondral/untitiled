"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";

import { CartClient, CartContextType } from "./cart.types";
import { loadCart, saveCart, clearCart as clearLocalCart } from "./cart.storage";
import { upsertItem } from "./cart.utils";
import { mergeGuestCart } from "./cart.api";
import { useAuth } from "@/components/auth/AuthContext";
import { useCart as useTanstackCart } from "@/hooks/useCart";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ 
  children,
  initialCart 
}: { 
  children: ReactNode;
  initialCart?: CartClient;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [guestCart, setGuestCart] = useState<CartClient>(initialCart || { items: [] });
  const isMountedRef = useRef(false);

  // TanStack hook handles caching, optimistic updates, and background DB sync to Redis
  const {
    items: serverItems,
    isLoading: isServerLoading,
    addToCart: serverAdd,
    removeFromCart: serverRemove,
    updateQuantity: serverUpdate,
    clearCart: serverClear,
    refetch: refetchServerCart
  } = useTanstackCart();

  // Load guest cart from localStorage on mount
  useEffect(() => {
    if (!initialCart && !isAuthenticated) {
      setGuestCart(loadCart());
    }
    isMountedRef.current = true;
  }, [initialCart, isAuthenticated]);

  // Handle merging guest cart when user logs in
  useEffect(() => {
    async function handleAuthChange() {
      if (isAuthenticated && isMountedRef.current) {
        const localGuestCart = loadCart();
        
        if (localGuestCart.items.length > 0) {
          console.log("🛒 Merging guest cart to Redis through API...");
          // Merge guest cart with user's Redis cart in DB
          await mergeGuestCart(localGuestCart);
          // Refetch Tanstack query to get the newly merged cart
          await refetchServerCart();
          // Clear localStorage so we don't merge it again
          clearLocalCart();
          setGuestCart({ items: [] });
        }
      }
    }
    handleAuthChange();
  }, [isAuthenticated, refetchServerCart]);

  // Save guest cart changes to localStorage (only if unauthenticated)
  useEffect(() => {
    if (!isMountedRef.current || isAuthLoading) return;

    if (!isAuthenticated) {
      saveCart(guestCart);
    }
  }, [guestCart, isAuthLoading, isAuthenticated]);

  // We expose a unified cart interface depending on auth state
  const currentCart: CartClient = isAuthenticated 
    ? { items: serverItems } 
    : guestCart;
    
  const isLoading = isAuthLoading || (isAuthenticated && isServerLoading && serverItems.length === 0);

  const addToCart = (
    productId: string,
    variantId: string | null = null,
    quantity = 1,
  ) => {
    if (isAuthenticated) {
      serverAdd({ productId, variantId, quantity });
    } else {
      setGuestCart((prev) => ({
        items: upsertItem(prev.items, { productId, variantId, quantity }),
      }));
    }
  };

  const removeFromCart = (
    productId: string,
    variantId: string | null = null,
  ) => {
    if (isAuthenticated) {
      serverRemove({ productId, variantId });
    } else {
      setGuestCart((prev) => ({
        items: prev.items.filter(
          (i) => !(i.productId === productId && (i.variantId ?? null) === variantId),
        ),
      }));
    }
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    variantId: string | null = null,
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    if (isAuthenticated) {
      serverUpdate({ productId, variantId, quantity });
    } else {
      setGuestCart((prev) => ({
        items: prev.items.map((i) =>
          i.productId === productId && (i.variantId ?? null) === variantId
            ? { ...i, quantity }
            : i,
        ),
      }));
    }
  };

  const clearCart = () => {
    if (isAuthenticated) {
      serverClear();
    } else {
      setGuestCart({ items: [] });
      clearLocalCart();
    }
  };

  const value: CartContextType = {
    cart: currentCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isOpen,
    setIsOpen,
    isLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
}
