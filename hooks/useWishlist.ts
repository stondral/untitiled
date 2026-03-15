'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthContext';

/**
 * useWishlist Hook
 * 
 * TanStack Query hook for wishlist management with optimistic updates.
 * Provides instant UI feedback similar to cart operations.
 */

interface WishlistItem {
  productId: string;
  addedAt: string;
}

interface Wishlist {
  userId: string;
  products: string[];
  items: WishlistItem[];
}

/**
 * Fetch wishlist from API
 */
async function fetchWishlist(): Promise<Wishlist> {
  const response = await fetch('/api/wishlist');
  if (!response.ok) {
    throw new Error('Failed to fetch wishlist');
  }
  return response.json();
}

/**
 * Add product to wishlist
 */
async function addToWishlistAPI(productId: string): Promise<Wishlist> {
  const response = await fetch('/api/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, action: 'add' }),
  });
  if (!response.ok) {
    throw new Error('Failed to add to wishlist');
  }
  return response.json();
}

/**
 * Remove product from wishlist
 */
async function removeFromWishlistAPI(productId: string): Promise<Wishlist> {
  const response = await fetch('/api/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, action: 'remove' }),
  });
  if (!response.ok) {
    throw new Error('Failed to remove from wishlist');
  }
  return response.json();
}

/**
 * Main useWishlist hook
 */
export function useWishlist() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Fetch wishlist
  const {
    data: wishlist,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days (matches Redis TTL)
    gcTime: 14 * 24 * 60 * 60 * 1000, // 14 days
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  // Add to wishlist mutation with optimistic update
  const { mutateAsync: addToWishlist, isPending: isAdding } = useMutation({
    mutationFn: addToWishlistAPI,
    onMutate: async (productId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });

      // Snapshot previous value
      const previousWishlist = queryClient.getQueryData<Wishlist>(['wishlist']);

      // Optimistically update
      if (previousWishlist) {
        const optimisticWishlist: Wishlist = {
          ...previousWishlist,
          products: [...previousWishlist.products, productId],
          items: [
            ...previousWishlist.items,
            { productId, addedAt: new Date().toISOString() },
          ],
        };
        queryClient.setQueryData(['wishlist'], optimisticWishlist);
      }

      return { previousWishlist };
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist'], context.previousWishlist);
      }
      console.error('Failed to add to wishlist:', err);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  // Remove from wishlist mutation with optimistic update
  const { mutateAsync: removeFromWishlist, isPending: isRemoving } = useMutation({
    mutationFn: removeFromWishlistAPI,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });

      const previousWishlist = queryClient.getQueryData<Wishlist>(['wishlist']);

      if (previousWishlist) {
        const optimisticWishlist: Wishlist = {
          ...previousWishlist,
          products: previousWishlist.products.filter(id => id !== productId),
          items: previousWishlist.items.filter(item => item.productId !== productId),
        };
        queryClient.setQueryData(['wishlist'], optimisticWishlist);
      }

      return { previousWishlist };
    },
    onError: (err, productId, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist'], context.previousWishlist);
      }
      console.error('Failed to remove from wishlist:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  // Helper: Check if product is in wishlist
  const isInWishlist = (productId: string): boolean => {
    return wishlist?.products?.includes(productId) || false;
  };

  // Helper: Toggle wishlist
  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return {
    wishlist,
    products: wishlist?.products || [],
    items: wishlist?.items || [],
    itemCount: wishlist?.products?.length || 0,
    isLoading,
    error,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    isAdding,
    isRemoving,
    refetch,
  };
}

/**
 * useWishlistStatus Hook
 * 
 * Lightweight hook to check if a specific product is in wishlist.
 * Useful for product cards.
 */
export function useWishlistStatus(productId: string) {
  const { isInWishlist, toggleWishlist, isAdding, isRemoving } = useWishlist();

  return {
    isInWishlist: isInWishlist(productId),
    toggle: () => toggleWishlist(productId),
    isPending: isAdding || isRemoving,
  };
}
