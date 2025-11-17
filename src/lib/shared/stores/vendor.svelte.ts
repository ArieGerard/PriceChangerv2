import type { MappingConfig } from './types';
import { searchStore } from './search.svelte';
import type { VendorRow } from '../api/schemas';
import { normalizeVendorRow } from '../api/normalize';
import { BaseFileStore } from './file-store.svelte';

class VendorStore extends BaseFileStore {
    normalizedRows = $state<VendorRow[]>([]);

    // Override setFile to also clear normalizedRows
    setFile(data: { headers: string[]; rows: any[][] }, filename: string, file: File | null = null) {
        console.log(`[VendorStore] Setting file: ${filename} (${data.rows.length} rows, ${data.headers.length} headers)`);
        super.setFile(data, filename, file);
        this.normalizedRows.length = 0;
        console.log('[VendorStore] Normalized rows cleared');
    }

    // Override clearFile to also clear normalizedRows
    clearFile() {
        console.log('[VendorStore] Clearing vendor file and normalized rows');
        super.clearFile();
        this.normalizedRows.length = 0;
    }

    normalizeRows(mapping: MappingConfig): { success: number; errors: Array<{ row: number; error: string }> } {
        console.log(`[VendorStore] Starting row normalization for ${this.data.rows?.length || 0} rows`);
        
        if (!this.data.rows || !mapping) {
            console.warn('[VendorStore] Cannot normalize: missing rows or mapping');
            this.normalizedRows.length = 0;
            return { success: 0, errors: [] };
        }

        const normalized: VendorRow[] = [];
        const errors: Array<{ row: number; error: string }> = [];
        const startTime = performance.now();

        this.data.rows.forEach((row, index) => {
            try {
                const normalizedRow = normalizeVendorRow(row, mapping);
                normalized.push(normalizedRow);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[VendorStore] Row ${index + 1} failed validation:`, errorMessage);
                errors.push({
                    row: index + 1,
                    error: errorMessage,
                });
            }
        });

        this.normalizedRows.length = 0;
        this.normalizedRows.push(...normalized);
        const duration = performance.now() - startTime;

        console.log(`[VendorStore] Normalization completed in ${duration.toFixed(2)}ms: ${normalized.length} successful, ${errors.length} errors`);

        if (errors.length > 0) {
            console.warn(`[VendorStore] ${errors.length} rows failed validation out of ${this.data.rows.length} total rows`);
        }
        
        return { success: normalized.length, errors };
    }

    // Convenience method that uses vendor search term
    filteredRows() {
        return super.filteredRows(searchStore.vendorSearchTerm);
    }
}

export const vendorStore = new VendorStore();
