// Mapping store for vendor and company column mappings using Svelte 5 runes
import type { MappingConfig } from './types';
import { clearVendorFile } from './vendor';
import { clearCompanyFile } from './company';
import type { MatchedItem } from '../api/match';


class MappingStore {
    vendorMapping = $state<MappingConfig>(null);
    companyMapping = $state<MappingConfig>(null);
    isMapped = $state(false);
}

const store = new MappingStore();

// Store the Matched Items
export let matchedItems = $state<MatchedItem[]>([]);

// Export reactive state
export const vendorMapping = $derived(store.vendorMapping);
export const companyMapping = $derived(store.companyMapping);
export const isMapped = $derived(store.isMapped);


// Map the vendor file columns
export function mapVendorFile(mapping: MappingConfig) {
    if (mapping) {
        store.vendorMapping = mapping;
        store.isMapped = true;
    }
}

// Map the company file columns
export function mapCompanyFile(mapping: MappingConfig) {
    if (mapping) {
        store.companyMapping = mapping;
    }
}

// Setter for isMapped
export function setIsMapped(value: boolean) {
    store.isMapped = value;
}

// Clear vendor mapping
export function clearVendorMapping() {
    store.vendorMapping = null;
    store.isMapped = false;
}

// Clear company mapping
export function clearCompanyMapping() {
    store.companyMapping = null;
}

export function setMatchedItems(items: MatchedItem[]) {
    matchedItems = items;
}

// Get the orphaned items that dont match
export const orphanedItems = $derived.by(() => {
    return matchedItems.filter(item => item.isOrphaned);
})

// Clear all mappings and files
export function clearAll() {
    clearCompanyFile();
    clearVendorFile();
    clearVendorMapping();
    clearCompanyMapping();
    matchedItems = [];
}

