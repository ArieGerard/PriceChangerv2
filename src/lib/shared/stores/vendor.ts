// Vendor file store using Svelte 5 runes
import type { FileData, MappingConfig } from './types';
import { vendorSearchTerm } from './search';
import type { VendorRow } from '../api/schemas';
import { normalizeVendorRow } from '../api/normalize';

export const vendorData = $state<FileData>({
    file: null,
    headers: null,
    rows: null,
    filename: null
});

// Store normalizedVendorRows : Use the Vendor Row Type
export const normalizedVendorRows = $state<VendorRow[]>([]);

export function normalizeVendorRows(mapping: MappingConfig): { success: number; errors: Array<{ row: number; error: string }> } 
{
    if (!vendorData.rows || !mapping) {
        normalizedVendorRows.length = 0;
        return {
            success: 0, errors: [] };
        }

    const normalized: VendorRow[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    vendorData.rows.forEach((row, index) => {
        try {
            const normalizedRow = normalizeVendorRow(row, mapping);
            normalized.push(normalizedRow);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Row ${index + 1} failed validation:`, errorMessage);
            errors.push({
                row: index + 1,
                error: errorMessage,
            });
        }
    });

    normalizedVendorRows.length = 0;
    normalizedVendorRows.push(...normalized);

    if (errors.length > 0 ){
        console.warn(`${errors.length} rows failed validation out of ${vendorData.rows.length} total rows`);
    }
    return { success: normalized.length, errors };
}


// Helper functions to manage vendor file state
export function setVendorFile(data: { headers: string[]; rows: any[][] }, filename: string, file: File | null = null) {
    vendorData.file = file;
    vendorData.headers = data.headers;
    vendorData.rows = data.rows;
    vendorData.filename = filename;
    normalizedVendorRows.length = 0; 
}


export function clearVendorFile() {
    vendorData.file = null;
    vendorData.headers = null;
    vendorData.rows = null;
    vendorData.filename = null;
    normalizedVendorRows.length = 0; 
}

// Derived: Filtered vendor rows based on search term
export const filteredVendorRows = $derived.by(() => {
    if (!vendorData.rows) return [];
    return vendorData.rows.filter(row =>
        row.some(cell => cell?.toString().toLowerCase().includes(vendorSearchTerm.toLowerCase()))
    );
});
