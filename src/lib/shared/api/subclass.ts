/**
 * Extract subclass from item name
 * Example: "ABC-123:Widget Name" -> "ABC-123"
 */
export function extractSubclass(itemName: string): string {
    const match = itemName.match(/^([A-Z0-9-]+):/);
    return match ? match[1] : '';
}

