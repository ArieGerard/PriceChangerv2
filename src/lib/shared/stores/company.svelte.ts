
import type { FileData } from './types';
import { searchStore } from './search.svelte';
import { BaseFileStore } from './file-store.svelte';

class CompanyStore extends BaseFileStore {

    filteredRows() {
        return super.filteredRows(searchStore.companySearchTerm);
    }
}

export const companyStore = new CompanyStore();
