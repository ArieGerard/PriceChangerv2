import type { VendorRow, CompanyRow } from './schemas';

// Extract
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
    
    const matchedRows = companyRows.map(companyRow => {
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
    
    // Get the orhaned count for UI 
    const orphanedCount = matchedRows.filter(item => item.isOrphaned).length;

    // Log performance metrics, will be logging the time it takes 
    const duration = performance.now() - startTime;
    console.log(`[MatchAPI] Matching completed in ${duration.toFixed(2)}ms: ${matchedRows.length} items, ${orphanedCount} orphaned`);
    
    // Return Matched 
    return matchedRows;
}

