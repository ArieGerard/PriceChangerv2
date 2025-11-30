import type { CompanyRow } from '../api/schemas';
import { CompanyRowSchema, CompanyRowRawSchema } from '../api/schemas';
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
 * Extracts raw values from a company row array and converts it into a key-value object using headers.
 * This is the first step in the company row processing pipeline.
 * 
 * @param row - An array of values representing a single row from the company file.
 * @param headers - An array of header names that correspond to each column in the row.
 * @param rowIndex - The zero-based index of the row (used for error messages).
 * @returns A record object where keys are header names and values are the corresponding row values.
 * @throws {Error} If headers are missing or empty.
 * @throws {Error} If the row length doesn't match the headers length.
 * 
 * @example
 * extractRawCompanyRow(['ABC123', 'Widget', 10.50], ['MPN', 'Item', 'Cost'], 0)
 * // returns { MPN: 'ABC123', Item: 'Widget', Cost: 10.50 }
 */
function extractRawCompanyRow(row: any[], headers: string[], rowIndex: number) {
    if (!headers || headers.length === 0) {
        throw new Error(`[Row ${rowIndex + 1}] Headers are required for company row extraction`);
    }
    
    if (row.length !== headers.length) {
        throw new Error(
            `[Row ${rowIndex + 1}] Row has ${row.length} columns but headers has ${headers.length} columns`
        );
    }

    // Converts the array based row into a key-value object using the names as keys
    const rowObj: Record<string, any> = {};
    headers.forEach((header, i) => {
        rowObj[header] = row[i];
    });

    return rowObj;
}

/**
 * Validates the raw extracted row data and parses numeric fields.
 * This is the second step in the company row processing pipeline.
 * 
 * @param raw - A record object containing the raw row data with header names as keys.
 * @param rowIndex - The zero-based index of the row (used for error messages).
 * @returns A validated and parsed row object conforming to CompanyRowRawSchema.
 * @throws {Error} If MPN is missing or empty.
 * @throws {Error} If Item is missing or empty.
 * @throws {Error} If Cost cannot be parsed or is negative.
 * @throws {Error} If Price cannot be parsed or is negative.
 * @throws {Error} If the row fails schema validation.
 */
function validateRawCompanyRow(raw: Record<string, any>, rowIndex: number): z.infer<typeof CompanyRowRawSchema> {
    // Validate MPN exists
    if (raw.MPN === null || raw.MPN === undefined || raw.MPN === '') {
        throw new Error(`[Row ${rowIndex + 1}] MPN is required but was empty or missing`);
    }

    // Validate Item exists
    if (!raw.Item || (typeof raw.Item === 'string' && raw.Item.trim() === '')) {
        throw new Error(`[Row ${rowIndex + 1}] Item name is required but was empty or missing`);
    }

    // Parse and validate Cost
    const cost = parseNumber(raw.Cost);
    if (cost === null) {
        throw new Error(
            `[Row ${rowIndex + 1}] Cost value "${raw.Cost}" (type: ${typeof raw.Cost}) could not be converted to a number`
        );
    }
    if (cost < 0) {
        throw new Error(`[Row ${rowIndex + 1}] Cost cannot be negative, got: ${cost}`);
    }

    // Parse and validate Price
    const price = parseNumber(raw.Price);
    if (price === null) {
        throw new Error(
            `[Row ${rowIndex + 1}] Price value "${raw.Price}" (type: ${typeof raw.Price}) could not be converted to a number`
        );
    }
    if (price < 0) {
        throw new Error(`[Row ${rowIndex + 1}] Price cannot be negative, got: ${price}`);
    }

    // Build validated object
    const validated = {
        MPN: raw.MPN,
        Item: String(raw.Item).trim(),
        Description: raw.Description || null,
        PreferredVendor: raw.PreferredVendor || null,
        Cost: cost,
        Price: price,
        'U/M': raw['U/M'] || null,
    };

    // Validate with raw schema
    const result = CompanyRowRawSchema.safeParse(validated);
    
    if (!result.success) {
        const errors = result.error.errors.map(e => 
            `${e.path.join('.')}: ${e.message}`
        ).join(', ');
        
        throw new Error(
            `[Row ${rowIndex + 1}] Row validation failed:\n` +
            `  MPN: ${validated.MPN}\n` +
            `  Item: ${validated.Item}\n` +
            `  Cost: ${validated.Cost}\n` +
            `  Price: ${validated.Price}\n` +
            `  Errors: ${errors}`
        );
    }
    
    return result.data;
}

/**
 * Normalizes a validated raw company row to the final CompanyRow schema format.
 * This is the third step in the company row processing pipeline.
 * Converts null values to undefined and ensures all fields match the final schema.
 * 
 * @param validated - A validated row object conforming to CompanyRowRawSchema.
 * @returns A normalized CompanyRow object ready for use in the application.
 * @throws {Error} If the validated data doesn't conform to CompanyRowSchema.
 */
function normalizeCompanyRow(validated: z.infer<typeof CompanyRowRawSchema>): CompanyRow {
    return CompanyRowSchema.parse({
        MPN: String(validated.MPN),
        Item: validated.Item,
        Description: validated.Description || undefined,
        PreferredVendor: validated.PreferredVendor || undefined,
        Cost: validated.Cost,
        Price: validated.Price,
        'U/M': validated['U/M'] || undefined,
    });
}

/**
 * Parses a single company row through the complete workflow: extraction, validation, and normalization.
 * This is the main entry point for parsing individual company rows.
 * 
 * @param row - An array of values representing a single row from the company file.
 * @param headers - An array of header names that correspond to each column in the row.
 * @param rowIndex - The zero-based index of the row (used for error messages). Defaults to 0.
 * @returns A fully parsed and validated CompanyRow object.
 * @throws {Error} If any step in the parsing process fails. Error messages include row number context.
 * 
 * @example
 * parseCompanyRow(['ABC123', 'Widget', 'Description', 'Vendor', 10.50, 15.00, 'EA'], 
 *                 ['MPN', 'Item', 'Description', 'PreferredVendor', 'Cost', 'Price', 'U/M'], 0)
 */
export function parseCompanyRow(row: any[], headers: string[], rowIndex: number = 0): CompanyRow {
    try {
        // Step 1: Extract raw values
        const raw = extractRawCompanyRow(row, headers, rowIndex);
        
        // Step 2: Validate raw extraction
        const validated = validateRawCompanyRow(raw, rowIndex);
        
        // Step 3: Normalize to final schema
        return normalizeCompanyRow(validated);
    } catch (error) {
        // Re-throw with context if not already formatted
        if (error instanceof Error && !error.message.includes('[Row')) {
            throw new Error(`[Row ${rowIndex + 1}] ${error.message}`);
        }
        throw error;
    }
}

/**
 * Processes all company rows with error aggregation.
 * Parses each row individually and collects both successful results and errors.
 * Continues processing even if individual rows fail.
 * 
 * @param rows - A two-dimensional array where each inner array represents a row from the company file.
 * @param headers - An array of header names that correspond to each column in the rows.
 * @returns An object containing:
 *   - `normalized`: An array of successfully parsed CompanyRow objects.
 *   - `errors`: An array of error objects with row number (1-based) and error message for failed rows.
 * 
 * @example
 * const result = processCompanyRows([['ABC123', 'Widget', 10.50], ['DEF456', 'Gadget', 20.00]], 
 *                                   ['MPN', 'Item', 'Cost']);
 * // result.normalized contains successfully parsed rows
 * // result.errors contains any rows that failed validation
 */
export function processCompanyRows(
    rows: any[][],
    headers: string[]
): { 
    normalized: CompanyRow[]; 
    errors: Array<{ row: number; error: string }> 
} {
    if (!headers || headers.length === 0) {
        console.warn('[CompanyProcessor] Cannot process: missing headers');
        return { normalized: [], errors: [] };
    }

    console.log(`[CompanyProcessor] Starting row processing for ${rows.length} rows`);
    
    const normalized: CompanyRow[] = [];
    const errors: Array<{ row: number; error: string }> = [];
    const startTime = performance.now();

    rows.forEach((row, index) => {
        try {
            const parsed = parseCompanyRow(row, headers, index);
            normalized.push(parsed);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[CompanyProcessor] Row ${index + 1} failed:`, errorMessage);
            errors.push({
                row: index + 1,
                error: errorMessage,
            });
        }
    });

    const duration = performance.now() - startTime;
    console.log(`[CompanyProcessor] Processing completed in ${duration.toFixed(2)}ms: ${normalized.length} successful, ${errors.length} errors`);
    
    if (errors.length > 0) {
        console.warn(`[CompanyProcessor] ${errors.length} rows failed validation out of ${rows.length} total rows`);
    }
    
    return { normalized, errors };
}
