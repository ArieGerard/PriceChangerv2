// Central export point for all stores
// Barrel export pattern for clean imports

// Types
export type { FileData, ColumnMapping, MappingConfig } from './types';

// Vendor store
export {
    vendorData,
    setVendorFile,
    clearVendorFile,
    filteredVendorRows
} from './vendor';

// Company store
export {
    companyData,
    setCompanyFile,
    clearCompanyFile,
    filteredCompanyRows
} from './company';

// Mapping store
export {
    vendorMapping,
    companyMapping,
    isMapped,
    setIsMapped,
    mapVendorFile,
    mapCompanyFile,
    clearVendorMapping,
    clearCompanyMapping,
    clearAll
} from './mapping';

// Search store
export {
    vendorSearchTerm,
    companySearchTerm
} from './search';
