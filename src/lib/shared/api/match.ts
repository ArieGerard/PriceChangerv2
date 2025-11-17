import type { VendorRow, CompanyRow } from './schemas';

export type MatchedItem = {
    MPN: string | number;
    companyRow: CompanyRow;
    vendorRow: VendorRow | null;
    isOrphaned: boolean;
    costDifference: number | null;
};

/**
 * Match company items with vendor items by MPN
 */
export function matchItems(
    companyRows: CompanyRow[],
    vendorRows: VendorRow[]
): MatchedItem[] {
    console.log(`[MatchAPI] Starting matching: ${companyRows.length} company rows, ${vendorRows.length} vendor rows`);
    const startTime = performance.now();
    
    const vendorLookup = new Map(vendorRows.map(v => [v.MPN, v]));
    console.log(`[MatchAPI] Vendor lookup map created with ${vendorLookup.size} entries`);
    
    const matched = companyRows.map(companyRow => {
        const vendorRow = vendorLookup.get(companyRow.MPN) || null;
        
        return {
            MPN: companyRow.MPN,
            companyRow,
            vendorRow,
            isOrphaned: !vendorRow,
            costDifference: vendorRow 
                ? companyRow.Cost - vendorRow.Cost 
                : null,
        };
    });
    
    const orphanedCount = matched.filter(item => item.isOrphaned).length;
    const duration = performance.now() - startTime;
    console.log(`[MatchAPI] Matching completed in ${duration.toFixed(2)}ms: ${matched.length} items, ${orphanedCount} orphaned`);
    
    return matched;
}

