import type { MappingConfig } from '../stores/types';
import type { VendorRow } from '../api/schemas';
import { VendorRowSchema, VendorRowRawSchema } from '../api/schemas';
import { z } from 'zod';
import { BaseProcessor } from './BaseProcessor';

type VendorRowRaw = z.infer<typeof VendorRowRawSchema>;

/**
 * Vendor processor that extends BaseProcessor to handle vendor row parsing.
 * Implements the extraction, validation, and normalization pipeline for vendor data.
 */
class VendorProcessor extends BaseProcessor<VendorRowRaw, VendorRow> {
    /**
     * Extracts raw values from a vendor row array using the mapping configuration.
     * This is the first step in the vendor row processing pipeline.
     * 
     * @param row - An array of values representing a single row from the vendor file.
     * @param config - The mapping configuration that defines which column indices correspond to MPN, Cost, and Unit Divider.
     * @param rowIndex - The zero-based index of the row (used for error messages).
     * @returns A raw object containing MPN, Cost (parsed), and UnitDivider (parsed, or null if not mapped).
     * @throws {Error} If mapping configuration is missing.
     * @throws {Error} If MPN column index is out of bounds.
     * @throws {Error} If Cost column index is out of bounds.
     */
    protected extractRaw(row: any[], config: MappingConfig, rowIndex: number): VendorRowRaw {
        if (!config) {
            throw new Error(`[Row ${rowIndex + 1}] Mapping configuration is required`);
        }
        
        // Validate indices exist
        if (config.MPN.index < 0 || config.MPN.index >= row.length) {
            throw new Error(`[Row ${rowIndex + 1}] MPN column index ${config.MPN.index} is out of bounds (row has ${row.length} columns)`);
        }
        if (config.Cost.index < 0 || config.Cost.index >= row.length) {
            throw new Error(`[Row ${rowIndex + 1}] Cost column index ${config.Cost.index} is out of bounds (row has ${row.length} columns)`);
        }

        // DEBUG: Check mapping and indices before extraction
        console.log('[DEBUG] Normalizing row:', {
            rowIndex: rowIndex + 1,
            rowLength: row.length,
            mapping: config,
            mpnIndex: config.MPN.index,
            mpnValue: row[config.MPN.index],
            costIndex: config.Cost.index,
            costValue: row[config.Cost.index],
            costType: typeof row[config.Cost.index],
            unitDividerIndex: config['Unit Divider']?.index ?? null,
            unitDividerValue: config['Unit Divider'] ? row[config['Unit Divider'].index] : null,
            fullRow: row, // See entire row for context
        });

        const mpnRaw = row[config.MPN.index];
        const costRaw = row[config.Cost.index];
        const dividerRaw = config['Unit Divider'] 
            ? (config['Unit Divider'].index >= 0 && config['Unit Divider'].index < row.length
                ? row[config['Unit Divider'].index]
                : null)
            : null;

        const raw = {
            MPN: mpnRaw,
            Cost: this.parseNumber(costRaw),
            UnitDivider: this.parseNumber(dividerRaw),
        };

        // DEBUG: Check parsed values after parseNumber
        console.log('[DEBUG] After parseNumber:', {
            raw,
            costRawBeforeParse: costRaw,
            dividerRawBeforeParse: dividerRaw,
        });

        return raw as VendorRowRaw;
    }


    /**
     * Validates the raw extracted vendor row data.
     * This is the second step in the vendor row processing pipeline.
     * 
     * @param raw - A raw object containing MPN, Cost (parsed number or null), and UnitDivider (parsed number or null).
     * @param rowIndex - The zero-based index of the row (used for error messages).
     * @returns A validated row object conforming to VendorRowRawSchema.
     * @throws {Error} If MPN is missing or empty.
     * @throws {Error} If Cost could not be parsed to a number.
     * @throws {Error} If the row fails schema validation.
     */
    protected validateRaw(raw: any, rowIndex: number): VendorRowRaw {
        const result = VendorRowRawSchema.safeParse(raw);
        
        if (!result.success) {
            const errors = result.error.errors.map(e => 
                `${e.path.join('.')}: ${e.message}`
            ).join(', ');
            
            throw new Error(
                `[Row ${rowIndex + 1}] Validation failed: ${errors}\n` +
                `  Raw data: ${JSON.stringify(raw)}`
            );
        }
        
        return result.data;
    }
    

    /**
     * Normalizes a validated raw vendor row to the final VendorRow schema format.
     * This is the third step in the vendor row processing pipeline.
     * Calculates UnitCost by dividing Cost by UnitDivider (defaults to 1 if not provided).
     * 
     * @param validated - A validated row object conforming to VendorRowRawSchema.
     * @returns A normalized VendorRow object with MPN, Cost, UnitDivider, and calculated UnitCost.
     * @throws {Error} If the validated data doesn't conform to VendorRowSchema.
     */
    protected normalize(validated: VendorRowRaw): VendorRow {
        const unitDivider = validated.UnitDivider ?? 1;

        const normalized = {
            MPN: String(validated.MPN),  // Convert to string
            Cost: validated.Cost,
            UnitDivider: unitDivider,
            UnitCost: validated.Cost / unitDivider,
        };

        return VendorRowSchema.parse(normalized);
    }

    /**
     * Returns the logger name for this processor.
     * Used in console logs to identify the source of log messages.
     * 
     * @returns The logger name string.
     */
    protected getLoggerName(): string {
        return 'VendorProcessor';
    }
}

// Create a singleton instance
const vendorProcessor = new VendorProcessor();

/**
 * @inheritDoc
 * 
 * @param mapping - The mapping configuration that defines which column indices correspond to MPN, Cost, and Unit Divider.
 * 
 * @example
 * parseVendorRow(['ABC123', 'Widget', 10.50, 2], 
 *                { MPN: { index: 0 }, Cost: { index: 2 }, 'Unit Divider': { index: 3 } }, 0)
 */
export function parseVendorRow(row: any[], mapping: MappingConfig, rowIndex: number = 0): VendorRow {
    return vendorProcessor.parseRow(row, mapping, rowIndex);
}

/**
 * @inheritDoc
 * 
 * @param mapping - The mapping configuration that defines which column indices correspond to MPN, Cost, and Unit Divider.
 * 
 * @example
 * const result = processVendorRows([['ABC123', 'Widget', 10.50], ['DEF456', 'Gadget', 20.00]], 
 *                                   { MPN: { index: 0 }, Cost: { index: 2 } });
 * // result.normalized contains successfully parsed rows
 * // result.errors contains any rows that failed validation
 */
export function processVendorRows(
    rows: any[][],
    mapping: MappingConfig
): { 
    normalized: VendorRow[]; 
    errors: Array<{ row: number; error: string }> 
} {
    return vendorProcessor.processRows(rows, mapping);
}