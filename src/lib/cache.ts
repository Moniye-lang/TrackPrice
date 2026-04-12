import { revalidateTag } from 'next/cache';

/**
 * Cache Tags used across the application
 */
export const CACHE_TAGS = {
  PRODUCTS: 'products',
  PRODUCT_BY_ID: (id: string) => `product-${id}`,
  STORES: 'stores',
  STATS: 'stats',
  LEADERBOARD: 'leaderboard',
} as const;

/**
 * Revalidates product-related caches
 * @param productId Optional ID of a specific product to revalidate
 */
export function revalidateProducts(productId?: string) {
  revalidateTag(CACHE_TAGS.PRODUCTS);
  revalidateTag(CACHE_TAGS.STATS);
  if (productId) {
    revalidateTag(CACHE_TAGS.PRODUCT_BY_ID(productId));
  }
}

/**
 * Revalidates leaderboard cache
 */
export function revalidateLeaderboard() {
  revalidateTag(CACHE_TAGS.LEADERBOARD);
}

/**
 * Revalidates store-related caches
 */
export function revalidateStores() {
  revalidateTag(CACHE_TAGS.STORES);
  revalidateTag(CACHE_TAGS.STATS);
  // Also revalidate products since they might depend on store data
  revalidateTag(CACHE_TAGS.PRODUCTS);
}

/**
 * Revalidates statistics cache
 */
export function revalidateStats() {
  revalidateTag(CACHE_TAGS.STATS);
}
