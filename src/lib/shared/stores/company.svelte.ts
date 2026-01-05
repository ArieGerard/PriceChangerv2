import type { FileData } from './types';
import { searchStore } from './search.svelte';
import { BaseFileStore } from './file-store.svelte';
import { processCompanyRows } from '../processors/company-processor';
import type { CompanyRow } from '../api/schemas';

class CompanyStore extends BaseFileStore {
    normalizedRows = $state<CompanyRow[]>([]);
    
    setFile(data: { headers: string[]; rows: any[][] }, filename: string, file: File | null = null) {
        console.log(`[CompanyStore] Setting file: ${filename} (${data.rows.length} rows, ${data.headers.length} headers)`);
        super.setFile(data, filename, file);
        this.normalizedRows = [];
    }

    clearFile() {
        console.log('[CompanyStore] Clearing company file');
        super.clearFile();
        this.normalizedRows = [];
    }

    filteredRows() {
        return super.filteredRows(searchStore.companySearchTerm);
    }

    normalizeRows(): { success: number; errors: Array<{ row: number; error: string }> } {
        if (!this.data.rows || !this.data.headers) {
            console.warn('[CompanyStore] Cannot normalize: no rows or headers loaded');
            return { success: 0, errors: [] };
        }

        const { normalized, errors } = processCompanyRows(this.data.rows, this.data.headers);
        this.normalizedRows = normalized;
        
        return { success: normalized.length, errors };
    }
}

export const companyStore = new CompanyStore();
