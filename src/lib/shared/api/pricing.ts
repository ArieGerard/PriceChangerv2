import type { MatchedItem } from './match';

/**
 * Represents a markup configuration with a multiplier value.
 * 
 * @property multiplier - The multiplier to apply to a cost (e.g., 1.5 for 50% markup, 2.0 for 100% markup).
 * 
 * @example
 * const markup: Markup = { multiplier: 1.5 }; // 50% markup
 * const price = calculatePrice(100, markup); // Returns 150
 */
export type Markup = {
    multiplier: number; // e.g., 1.5 for 50% markup
};

/**
 * Calculates the final price from a cost using a markup multiplier.
 * 
 * @param cost - The base cost value.
 * @param markup - The markup object containing the multiplier to apply.
 * @returns The calculated price (cost × multiplier).
 * 
 * @example
 * calculatePrice(100, { multiplier: 1.5 }) // returns 150
 * calculatePrice(50, { multiplier: 2.0 }) // returns 100
 */
export function calculatePrice(cost: number, markup: Markup): number {
    return cost * markup.multiplier;
}

/**
 * Applies a markup percentage to a cost value.
 * Converts the percentage to a multiplier (e.g., 50% becomes 1.5).
 * 
 * @param cost - The base cost value.
 * @param percentage - The markup percentage (e.g., 50 for 50% markup).
 * @returns The calculated price with markup applied.
 * 
 * @example
 * applyMarkup(100, 50) // returns 150 (100 * 1.5)
 * applyMarkup(100, 25) // returns 125 (100 * 1.25)
 */
export function applyMarkup(cost: number, percentage: number): number {
    return cost * (1 + percentage / 100);
}

/**
 * Retrieves the markup configuration for a specific subclass.
 * Falls back to the default markup if the subclass is not found in the markups record.
 * 
 * @param subclass - The subclass name to look up.
 * @param markups - A record mapping subclass names to their markup configurations.
 * @param defaultMarkup - The default markup to use if the subclass is not found.
 * @returns The markup configuration for the subclass, or the default markup if not found.
 * 
 * @example
 * const markups = { 'Electronics': { multiplier: 1.5 }, 'Tools': { multiplier: 2.0 } };
 * const defaultMarkup = { multiplier: 1.25 };
 * getMarkupForSubclass('Electronics', markups, defaultMarkup) // returns { multiplier: 1.5 }
 * getMarkupForSubclass('Unknown', markups, defaultMarkup) // returns { multiplier: 1.25 }
 */
export function getMarkupForSubclass(
    subclass: string,
    markups: Record<string, Markup>,
    defaultMarkup: Markup
): Markup {
    return markups[subclass] || defaultMarkup;
}

/**
 * Applies price updates to matched items using vendor costs and a markup multiplier.
 * For items with a vendor match, updates the cost to the vendor cost and calculates a new price.
 * For orphaned items (no vendor match), returns the company row unchanged.
 * 
 * @param matchedItems - An array of MatchedItem objects containing company and vendor row data.
 * @param markup - The markup configuration to apply when calculating new prices.
 * @returns An array of updated company rows with new costs and prices for matched items.
 * 
 * @example
 * const matched = [{ companyRow: {...}, vendorRow: { Cost: 10 }, ... }, ...];
 * const updated = applyPriceUpdates(matched, { multiplier: 1.5 });
 * // Returns company rows with updated Cost (from vendor) and Price (vendor cost * markup)
 */
export function applyPriceUpdates(matchedItems: MatchedItem[], markup: Markup) {
    return matchedItems.map(item => {
        if (item.vendorRow) {
            const newPrice = calculatePrice(item.vendorRow.Cost, markup);
            return { ...item.companyRow, Cost: item.vendorRow.Cost, Price: newPrice };
        }
        return item.companyRow; // Keep unchanged if this is orphaned
    });
}

