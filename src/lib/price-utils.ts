/**
 * Parses a price string that could be a single value or a range (e.g., "1000", "1000-2000").
 * Returns the min price and optional max price.
 */
export function parsePriceRange(input: string | number): { price: number; maxPrice?: number } {
    if (typeof input === 'number') {
        return { price: input };
    }

    const cleanInput = input.trim().replace(/₦|,/g, '');

    if (cleanInput.includes('-')) {
        const parts = cleanInput.split('-').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
        if (parts.length >= 2) {
            return {
                price: Math.min(parts[0], parts[1]),
                maxPrice: Math.max(parts[0], parts[1])
            };
        } else if (parts.length === 1) {
            return { price: parts[0] };
        }
    }

    const price = parseFloat(cleanInput);
    return isNaN(price) ? { price: 0 } : { price };
}

/**
 * Formats a price range for display.
 */
export function formatPriceRange(price: number, maxPrice?: number): string {
    if (!maxPrice || maxPrice <= price) {
        return `₦${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const formattedPrice = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedMaxPrice = maxPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return `₦${formattedPrice} - ₦${formattedMaxPrice}`;
}
