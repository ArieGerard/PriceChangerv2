// Company file store using Svelte 5 runes
import type { FileData } from './types';
import { companySearchTerm } from './search';

export const companyData = $state<FileData>({
    file: null,
    headers: null,
    rows: null,
    filename: null
});

// Helper functions to manage company file state
export function setCompanyFile(data: { headers: string[]; rows: any[][] }, filename: string, file: File | null = null) {
    companyData.file = file;
    companyData.headers = data.headers;
    companyData.rows = data.rows;
    companyData.filename = filename;
}

export function clearCompanyFile() {
    companyData.file = null;
    companyData.headers = null;
    companyData.rows = null;
    companyData.filename = null;
}

// Derived: Filtered company rows based on search term
export const filteredCompanyRows = $derived.by(() => {
    if (!companyData.rows) return [];
    return companyData.rows.filter(row =>
        row.some(cell => cell?.toString().toLowerCase().includes(companySearchTerm.toLowerCase()))
    );
});
