'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RedisCartItem } from '@/lib/redis/types';
import { useAuth } from '@/components/auth/AuthContext';

/**
 * useCart Hook
 * 
 * TanStack Query hook for cart management with optimistic updates.
 * Provides sub-16ms UI updates with automatic rollback on failure.
 * 
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatic error rollback
 * - Background refetch on window focus (disabled by default)
 * - 5-minute stale time (matches Redis TTL strategy)
 */

interface CartResponse {
  items: RedisCartItem[];
}

interface AddToCartParams {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

interface UpdateQuantityParams {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

interface RemoveFromCartParams {
  productId: string;
  variantId?: string | null;
}

/**
 * Fetch cart from API
 */
async function fetchCart(): Promise<RedisCartItem[]> {
  const response = await fetch('/api/cart', {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      // User not authenticated, return empty cart
      return [];
    }
    throw new Error('Failed to fetch cart');
  }

  const data: CartResponse = await response.json();
  return data.items || [];
}

/**
 * Update cart via API
 */
async function updateCartAPI(items: RedisCartItem[]): Promise<RedisCartItem[]> {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new Error('Failed to update cart');
  }

  const data: CartResponse = await response.json();
  return data.items || [];
}

/**
 * Main useCart hook
 */
export function useCart() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Query for fetching cart
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  // Mutation for adding item to cart
  const addToCartMutation = useMutation({
    mutationFn: async (params: AddToCartParams) => {
      const currentItems = queryClient.getQueryData<RedisCartItem[]>(['cart']) || [];

      // Find existing item
      const existingIndex = currentItems.findIndex(
        (item) => item.productId === params.productId && item.variantId === params.variantId
      );

      let updatedItems: RedisCartItem[];
      if (existingIndex >= 0) {
        // Update quantity
        updatedItems = [...currentItems];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + params.quantity,
        };
      } else {
        // Add new item
        updatedItems = [...currentItems, params];
      }

      return updateCartAPI(updatedItems);
    },
    onMutate: async (params: AddToCartParams) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart'] });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<RedisCartItem[]>(['cart']);

      // Optimistically update to the new value
      queryClient.setQueryData<RedisCartItem[]>(['cart'], (old = []) => {
        const existingIndex = old.findIndex(
          (item) => item.productId === params.productId && item.variantId === params.variantId
        );

        if (existingIndex >= 0) {
          const updated = [...old];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + params.quantity,
          };
          return updated;
        } else {
          return [...old, params];
        }
      });

      // Return context with previous value
      return { previousItems };
    },
    onError: (err, params, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['cart'], context.previousItems);
      }
      console.error('Failed to add to cart:', err);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Mutation for updating item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async (params: UpdateQuantityParams) => {
      const currentItems = queryClient.getQueryData<RedisCartItem[]>(['cart']) || [];

      const updatedItems = currentItems.map((item) => {
        if (item.productId === params.productId && item.variantId === params.variantId) {
          return { ...item, quantity: params.quantity };
        }
        return item;
      });

      return updateCartAPI(updatedItems);
    },
    onMutate: async (params: UpdateQuantityParams) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousItems = queryClient.getQueryData<RedisCartItem[]>(['cart']);

      queryClient.setQueryData<RedisCartItem[]>(['cart'], (old = []) => {
        return old.map((item) => {
          if (item.productId === params.productId && item.variantId === params.variantId) {
            return { ...item, quantity: params.quantity };
          }
          return item;
        });
      });

      return { previousItems };
    },
    onError: (err, params, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['cart'], context.previousItems);
      }
      console.error('Failed to update quantity:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Mutation for removing item from cart
  const removeFromCartMutation = useMutation({
    mutationFn: async (params: RemoveFromCartParams) => {
      const currentItems = queryClient.getQueryData<RedisCartItem[]>(['cart']) || [];

      const updatedItems = currentItems.filter(
        (item) => !(item.productId === params.productId && item.variantId === params.variantId)
      );

      return updateCartAPI(updatedItems);
    },
    onMutate: async (params: RemoveFromCartParams) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousItems = queryClient.getQueryData<RedisCartItem[]>(['cart']);

      queryClient.setQueryData<RedisCartItem[]>(['cart'], (old = []) => {
        return old.filter(
          (item) => !(item.productId === params.productId && item.variantId === params.variantId)
        );
      });

      return { previousItems };
    },
    onError: (err, params, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['cart'], context.previousItems);
      }
      console.error('Failed to remove from cart:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Mutation for clearing cart
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return updateCartAPI([]);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousItems = queryClient.getQueryData<RedisCartItem[]>(['cart']);

      queryClient.setQueryData<RedisCartItem[]>(['cart'], []);

      return { previousItems };
    },
    onError: (err, params, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['cart'], context.previousItems);
      }
      console.error('Failed to clear cart:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Computed values
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const isEmpty = items.length === 0;

  return {
    // Data
    items,
    itemCount,
    isEmpty,

    // State
    isLoading,
    error,

    // Actions
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    refetch,

    // Mutation states
    isAdding: addToCartMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
    isRemoving: removeFromCartMutation.isPending,
    isClearing: clearCartMutation.isPending,
  };
}

/**
 * Helper hook to get cart item count only
 * Useful for navbar badge without subscribing to full cart
 */
export function useCartCount() {
  const { isAuthenticated } = useAuth();

  const { data: items = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.reduce((total, item) => total + item.quantity, 0),
    enabled: isAuthenticated,
  });

  return items;
}
