import type { MappingConfig } from './types';
import { vendorStore } from './vendor.svelte';
import { companyStore } from './company.svelte';
import { matchItems, type MatchedItem } from '../api/match';

class MappingStore {
    vendorMapping = $state<MappingConfig>(null);
    companyMapping = $state<MappingConfig>(null);
    isMapped = $state(false);
    matchedItems = $state<MatchedItem[]>([]);
    
    public _orphanedItems = $derived.by(() => {
        return this.matchedItems.filter(item => item.isOrphaned);
    })

    mapVendorFile(mapping: MappingConfig) {
        if (mapping) {
            console.log('[MappingStore] Setting vendor mapping:', {
                MPN: mapping.MPN.name,
                Cost: mapping.Cost.name,
                'Unit Divider': mapping['Unit Divider']?.name || 'not mapped'
            });
            this.vendorMapping = mapping;
            this.isMapped = true;
            console.log('[MappingStore] Vendor mapping stored, isMapped set to true');
        }
    }

    mapCompanyFile(mapping: MappingConfig) {
        if (mapping) {
            console.log('[MappingStore] Setting company mapping:', {
                MPN: mapping.MPN.name,
                Cost: mapping.Cost.name,
                'Unit Divider': mapping['Unit Divider']?.name || 'not mapped'
            });
            this.companyMapping = mapping;
        }
    }

    setIsMapped(value: boolean) {
        this.isMapped = value;
    }

    clearVendorMapping() {
        console.log('[MappingStore] Clearing vendor mapping');
        this.vendorMapping = null;
        this.isMapped = false;
    }

    clearCompanyMapping() {
        console.log('[MappingStore] Clearing company mapping');
        this.companyMapping = null;
    }

    setMatchedItems(items: MatchedItem[]) {
        const orphanedCount = items.filter(item => item.isOrphaned).length;
        console.log(`[MappingStore] Setting matched items: ${items.length} total, ${orphanedCount} orphaned`);
        this.matchedItems.length = 0;
        this.matchedItems.push(...items);
    }

    orphanedItems() {
        return this._orphanedItems;
    }

    clearAll() {
        console.log('[MappingStore] Clearing all data (files, mappings, matched items)');
        companyStore.clearFile();
        vendorStore.clearFile();
        this.clearVendorMapping();
        this.clearCompanyMapping();
        this.matchedItems.length = 0;
        console.log('[MappingStore] All data cleared');
    }
}

export const mappingStore = new MappingStore();

