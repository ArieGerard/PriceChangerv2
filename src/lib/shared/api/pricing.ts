export type Markup = {
    multiplier: number; // e.g., 1.5 for 50% markup
};

/**
 * Calculate price from cost using markup multiplier
 */
export function calculatePrice(cost: number, markup: Markup): number {
    return cost * markup.multiplier;
}

/**
 * Apply markup percentage to cost
 */
export function applyMarkup(cost: number, percentage: number): number {
    return cost * (1 + percentage / 100);
}

/**
 * Get markup for a subclass, falling back to default if not found
 */
export function getMarkupForSubclass(
    subclass: string,
    markups: Record<string, Markup>,
    defaultMarkup: Markup
): Markup {
    return markups[subclass] || defaultMarkup;
}

