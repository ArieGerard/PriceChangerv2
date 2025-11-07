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
    const vendorLookup = new Map(vendorRows.map(v => [v.MPN, v]));
    
    return companyRows.map(companyRow => {
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
}

