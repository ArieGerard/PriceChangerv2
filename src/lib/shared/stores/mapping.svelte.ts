import type { MappingConfig } from './types';
import { vendorStore } from './vendor.svelte';
import { companyStore } from './company.svelte';
import type { MatchedItem } from '../api/match';

class MappingStore {
    vendorMapping = $state<MappingConfig>(null);
    companyMapping = $state<MappingConfig>(null);
    isMapped = $state(false);
    matchedItems = $state<MatchedItem[]>([]);

    mapVendorFile(mapping: MappingConfig) {
        if (mapping) {
            this.vendorMapping = mapping;
            this.isMapped = true;
        }
    }

    mapCompanyFile(mapping: MappingConfig) {
        if (mapping) {
            this.companyMapping = mapping;
        }
    }

    setIsMapped(value: boolean) {
        this.isMapped = value;
    }

    clearVendorMapping() {
        this.vendorMapping = null;
        this.isMapped = false;
    }

    clearCompanyMapping() {
        this.companyMapping = null;
    }

    setMatchedItems(items: MatchedItem[]) {
        this.matchedItems.length = 0;
        this.matchedItems.push(...items);
    }

    orphanedItems() {
        return $derived.by(() => {
            return this.matchedItems.filter(item => item.isOrphaned);
        });
    }

    clearAll() {
        companyStore.clearFile();
        vendorStore.clearFile();
        this.clearVendorMapping();
        this.clearCompanyMapping();
        this.matchedItems.length = 0;
    }
}

export const mappingStore = new MappingStore();

