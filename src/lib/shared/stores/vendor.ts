// Vendor file store using Svelte 5 runes
import type { FileData } from './types';
import { vendorSearchTerm } from './search';

export const vendorData = $state<FileData>({
    file: null,
    headers: null,
    rows: null,
    filename: null
});

// Helper functions to manage vendor file state
export function setVendorFile(data: { headers: string[]; rows: any[][] }, filename: string, file: File | null = null) {
    vendorData.file = file;
    vendorData.headers = data.headers;
    vendorData.rows = data.rows;
    vendorData.filename = filename;
}

export function clearVendorFile() {
    vendorData.file = null;
    vendorData.headers = null;
    vendorData.rows = null;
    vendorData.filename = null;
}

// Derived: Filtered vendor rows based on search term
export const filteredVendorRows = $derived.by(() => {
    if (!vendorData.rows) return [];
    return vendorData.rows.filter(row =>
        row.some(cell => cell?.toString().toLowerCase().includes(vendorSearchTerm.toLowerCase()))
    );
});
