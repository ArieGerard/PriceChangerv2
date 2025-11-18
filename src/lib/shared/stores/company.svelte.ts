
import type { FileData } from './types';
import { searchStore } from './search.svelte';
import { BaseFileStore } from './file-store.svelte';
import { normalizeCompanyRow } from '../api/normalize';
import type { CompanyRow } from '../api/schemas';

class CompanyStore extends BaseFileStore {
    
    normalizedRows = $state<CompanyRow[]>([]);  
    setFile(data: { headers: string[]; rows: any[][] }, filename: string, file: File | null = null) {
        console.log(`[CompanyStore] Setting file: ${filename} (${data.rows.length} rows, ${data.headers.length} headers)`);
        super.setFile(data, filename, file);
    }

    clearFile() {
        console.log('[CompanyStore] Clearing company file');
        super.clearFile();
    }

    filteredRows() {
        return super.filteredRows(searchStore.companySearchTerm);
    }

    normalizeRows(): { success: number; errors: Array<{ row: number; error: string }> } {
        // Use the generic helper - pass company-specific logic
        const result = this.normalizeRowsGeneric<CompanyRow>(
            (row) => normalizeCompanyRow(row, this.headers),
            'CompanyStore'
        );

        // Update state
        this.normalizedRows = result.normalized;
        
        return { success: result.normalized.length, errors: result.errors };
    }
}

export const companyStore = new CompanyStore();
