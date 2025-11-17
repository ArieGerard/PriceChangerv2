import { VendorRowSchema, CompanyRowSchema } from './schemas';
import type { MappingConfig } from '../stores/types';

/**
 * Normalize a vendor row from Excel data using column mapping
 */
export function normalizeVendorRow(row: any[], mapping: MappingConfig) {
    if (!mapping) {
        console.error('[NormalizeAPI] normalizeVendorRow called without mapping');
        throw new Error('Mapping configuration is required');
    }
    
    const raw = {
        MPN: row[mapping.MPN.index],
        Cost: row[mapping.Cost.index],
        UnitDivider: mapping['Unit Divider'] 
            ? row[mapping['Unit Divider'].index] 
            : null,
    };
    
    try {
        return VendorRowSchema.parse(raw);
    } catch (error) {
        console.error('[NormalizeAPI] Row validation failed:', error, 'Raw data:', raw);
        throw error;
    }
}

/**
 * Normalize a company row from Excel data
 */
export function normalizeCompanyRow(row: any[], headers: string[]) {
    const rowObj: Record<string, any> = {};
    headers.forEach((header, i) => {
        rowObj[header] = row[i];
    });
    
    return CompanyRowSchema.parse(rowObj);
}

