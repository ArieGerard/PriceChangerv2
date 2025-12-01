// Pull this out to a generic class using polymorphism
import type { MappingConfig } from '../stores/types';
import type { VendorRow } from '../api/schemas';
import { VendorRowSchema, VendorRowRawSchema } from '../api/schemas';
import { z } from 'zod';

/**
 * Parses a number from various formats including strings with currency symbols, commas, and whitespace.
 * 
 * @param value - The value to parse. Can be a number, string (with $, commas, spaces), null, or undefined.
 * @returns The parsed number, or null if the value cannot be converted to a valid number.
 * 
 * @example
 * parseNumber('$1,234.56') // returns 1234.56
 * parseNumber('100') // returns 100
 * parseNumber(null) // returns null
 */
function parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    if (typeof value === 'number') {
        return isNaN(value) ? null : value;
    }
    if (typeof value === 'string') {
        const cleaned = value.replace(/[$,\s]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
    }
    return null;
}

/**
 * Extracts raw values from a vendor row array using the mapping configuration.
 * This is the first step in the vendor row processing pipeline.
 * 
 * @param row - An array of values representing a single row from the vendor file.
 * @param mapping - The mapping configuration that defines which column indices correspond to MPN, Cost, and Unit Divider.
 * @param rowIndex - The zero-based index of the row (used for error messages).
 * @returns A raw object containing MPN, Cost (parsed), and UnitDivider (parsed, or null if not mapped).
 * @throws {Error} If mapping configuration is missing.
 * @throws {Error} If MPN column index is out of bounds.
 * @throws {Error} If Cost column index is out of bounds.
 * 
 * @example
 * extractRawVendorRow(['ABC123', 'Widget', 10.50, 2], 
 *                     { MPN: { index: 0 }, Cost: { index: 2 }, 'Unit Divider': { index: 3 } }, 0)
 * // returns { MPN: 'ABC123', Cost: 10.50, UnitDivider: 2 }
 */
function extractRawVendorRow(row: any[], mapping: MappingConfig, rowIndex: number) {
    if (!mapping) {
        throw new Error(`[Row ${rowIndex + 1}] Mapping configuration is required`);
    }
    
    // Validate indices exist
    if (mapping.MPN.index < 0 || mapping.MPN.index >= row.length) {
        throw new Error(`[Row ${rowIndex + 1}] MPN column index ${mapping.MPN.index} is out of bounds (row has ${row.length} columns)`);
    }
    if (mapping.Cost.index < 0 || mapping.Cost.index >= row.length) {
        throw new Error(`[Row ${rowIndex + 1}] Cost column index ${mapping.Cost.index} is out of bounds (row has ${row.length} columns)`);
    }

    // DEBUG: Check mapping and indices before extraction
    console.log('[DEBUG] Normalizing row:', {
        rowIndex: rowIndex + 1,
        rowLength: row.length,
        mapping,
        mpnIndex: mapping.MPN.index,
        mpnValue: row[mapping.MPN.index],
        costIndex: mapping.Cost.index,
        costValue: row[mapping.Cost.index],
        costType: typeof row[mapping.Cost.index],
        unitDividerIndex: mapping['Unit Divider']?.index ?? null,
        unitDividerValue: mapping['Unit Divider'] ? row[mapping['Unit Divider'].index] : null,
        fullRow: row, // See entire row for context
    });

    const mpnRaw = row[mapping.MPN.index];
    const costRaw = row[mapping.Cost.index];
    const dividerRaw = mapping['Unit Divider'] 
        ? (mapping['Unit Divider'].index >= 0 && mapping['Unit Divider'].index < row.length
            ? row[mapping['Unit Divider'].index]
            : null)
        : null;

    const raw = {
        MPN: mpnRaw,
        Cost: parseNumber(costRaw),
        UnitDivider: parseNumber(dividerRaw),
    };

    // DEBUG: Check parsed values after parseNumber
    console.log('[DEBUG] After parseNumber:', {
        raw,
        costRawBeforeParse: costRaw,
        dividerRawBeforeParse: dividerRaw,
    });

    return raw;
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
function validateRawVendorRow(raw: any, rowIndex: number): z.infer<typeof VendorRowRawSchema> {
    // Validate MPN exists
    if (raw.MPN === null || raw.MPN === undefined || raw.MPN === '') {
        throw new Error(`[Row ${rowIndex + 1}] MPN is required but was empty or missing`);
    }

    // Validate Cost was parsed successfully
    if (raw.Cost === null) {
        throw new Error(`[Row ${rowIndex + 1}] Cost value could not be converted to a number`);
    }

    // Validate with raw schema
    const result = VendorRowRawSchema.safeParse(raw);
    
    if (!result.success) {
        const errors = result.error.errors.map(e => 
            `${e.path.join('.')}: ${e.message}`
        ).join(', ');
        
        throw new Error(
            `[Row ${rowIndex + 1}] Row validation failed:\n` +
            `  MPN: ${raw.MPN}\n` +
            `  Cost: ${raw.Cost}\n` +
            `  UnitDivider: ${raw.UnitDivider}\n` +
            `  Errors: ${errors}`
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
function normalizeVendorRow(validated: z.infer<typeof VendorRowRawSchema>): VendorRow {
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
 * Parses a single vendor row through the complete workflow: extraction, validation, and normalization.
 * This is the main entry point for parsing individual vendor rows.
 * 
 * @param row - An array of values representing a single row from the vendor file.
 * @param mapping - The mapping configuration that defines which column indices correspond to MPN, Cost, and Unit Divider.
 * @param rowIndex - The zero-based index of the row (used for error messages). Defaults to 0.
 * @returns A fully parsed and validated VendorRow object with calculated UnitCost.
 * @throws {Error} If any step in the parsing process fails. Error messages include row number context.
 * 
 * @example
 * parseVendorRow(['ABC123', 'Widget', 10.50, 2], 
 *                { MPN: { index: 0 }, Cost: { index: 2 }, 'Unit Divider': { index: 3 } }, 0)
 */
export function parseVendorRow(row: any[], mapping: MappingConfig, rowIndex: number = 0): VendorRow {
    try {
        // Step 1: Extract raw values
        const raw = extractRawVendorRow(row, mapping, rowIndex);
        
        // Step 2: Validate raw extraction
        const validated = validateRawVendorRow(raw, rowIndex);
        
        // Step 3: Normalize to final schema
        return normalizeVendorRow(validated);
    } catch (error) {
        // Re-throw with context if not already formatted
        if (error instanceof Error && !error.message.includes('[Row')) {
            throw new Error(`[Row ${rowIndex + 1}] ${error.message}`);
        }
        throw error;
    }
}

/**
 * Processes all vendor rows with error aggregation.
 * Parses each row individually and collects both successful results and errors.
 * Continues processing even if individual rows fail.
 * 
 * @param rows - A two-dimensional array where each inner array represents a row from the vendor file.
 * @param mapping - The mapping configuration that defines which column indices correspond to MPN, Cost, and Unit Divider.
 * @returns An object containing:
 *   - `normalized`: An array of successfully parsed VendorRow objects.
 *   - `errors`: An array of error objects with row number (1-based) and error message for failed rows.
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
    if (!mapping) {
        console.warn('[VendorProcessor] Cannot process: missing mapping');
        return { normalized: [], errors: [] };
    }

    console.log(`[VendorProcessor] Starting row processing for ${rows.length} rows`);
    
    const normalized: VendorRow[] = [];
    const errors: Array<{ row: number; error: string }> = [];
    const startTime = performance.now();

    rows.forEach((row, index) => {
        try {
            const parsed = parseVendorRow(row, mapping, index);
            normalized.push(parsed);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[VendorProcessor] Row ${index + 1} failed:`, errorMessage);
            errors.push({
                row: index + 1,
                error: errorMessage,
            });
        }
    });

    const duration = performance.now() - startTime;
    console.log(`[VendorProcessor] Processing completed in ${duration.toFixed(2)}ms: ${normalized.length} successful, ${errors.length} errors`);
    
    if (errors.length > 0) {
        console.warn(`[VendorProcessor] ${errors.length} rows failed validation out of ${rows.length} total rows`);
    }
    
    return { normalized, errors };
}
