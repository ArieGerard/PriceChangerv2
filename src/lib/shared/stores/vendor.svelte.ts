import type { MappingConfig } from './types';
import { searchStore } from './search.svelte';
import type { VendorRow } from '../api/schemas';
import { normalizeVendorRow } from '../api/normalize';
import { BaseFileStore } from './file-store.svelte';

class VendorStore extends BaseFileStore {
    normalizedRows = $state<VendorRow[]>([]);

    // Override setFile to also clear normalizedRows
    setFile(data: { headers: string[]; rows: any[][] }, filename: string, file: File | null = null) {
        super.setFile(data, filename, file);
        this.normalizedRows.length = 0;
    }

    // Override clearFile to also clear normalizedRows
    clearFile() {
        super.clearFile();
        this.normalizedRows.length = 0;
    }

    normalizeRows(mapping: MappingConfig): { success: number; errors: Array<{ row: number; error: string }> } {
        if (!this.data.rows || !mapping) {
            this.normalizedRows.length = 0;
            return { success: 0, errors: [] };
        }

        const normalized: VendorRow[] = [];
        const errors: Array<{ row: number; error: string }> = [];

        this.data.rows.forEach((row, index) => {
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

        this.normalizedRows.length = 0;
        this.normalizedRows.push(...normalized);

        if (errors.length > 0) {
            console.warn(`${errors.length} rows failed validation out of ${this.data.rows.length} total rows`);
        }
        return { success: normalized.length, errors };
    }

    // Convenience method that uses vendor search term
    filteredRows() {
        return super.filteredRows(searchStore.vendorSearchTerm);
    }
}

export const vendorStore = new VendorStore();
