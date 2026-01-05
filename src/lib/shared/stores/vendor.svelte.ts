import type { MappingConfig } from './types';
import { searchStore } from './search.svelte';
import type { VendorRow } from '../api/schemas';
import { processVendorRows } from '../processors/vendor-processor';
import { BaseFileStore } from './file-store.svelte';

class VendorStore extends BaseFileStore {
    normalizedRows = $state<VendorRow[]>([]);

    // Override setFile to also clear normalizedRows
    setFile(data: { headers: string[]; rows: any[][] }, filename: string, file: File | null = null) {
        console.log(`[VendorStore] Setting file: ${filename} (${data.rows.length} rows, ${data.headers.length} headers)`);
        super.setFile(data, filename, file);
        this.normalizedRows = [];
        console.log('[VendorStore] Normalized rows cleared');
    }

    // Override clearFile to also clear normalizedRows
    clearFile() {
        console.log('[VendorStore] Clearing vendor file and normalized rows');
        super.clearFile();
        this.normalizedRows = [];
    }

    normalizeRows(mapping: MappingConfig): { success: number; errors: Array<{ row: number; error: string }> } {
        if (!this.data.rows) {
            console.warn('[VendorStore] Cannot normalize: no rows loaded');
            return { success: 0, errors: [] };
        }

        const { normalized, errors } = processVendorRows(this.data.rows, mapping);
        this.normalizedRows = normalized;
        
        return { success: normalized.length, errors };
    }

    // Convenience method that uses vendor search term
    filteredRows() {
        return super.filteredRows(searchStore.vendorSearchTerm);
    }
}

export const vendorStore = new VendorStore();
