
import type { FileData } from './types';
import { searchStore } from './search.svelte';
import { BaseFileStore } from './file-store.svelte';

class CompanyStore extends BaseFileStore {
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
}

export const companyStore = new CompanyStore();
