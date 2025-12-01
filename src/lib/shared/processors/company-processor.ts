import type { CompanyRow } from '../api/schemas';
import { CompanyRowSchema, CompanyRowRawSchema } from '../api/schemas';
import { z } from 'zod';
import { BaseProcessor } from './BaseProcessor';

type CompanyRowRaw = z.infer<typeof CompanyRowRawSchema>;

/**
 * Company processor that extends BaseProcessor to handle company row parsing.
 * Uses header-based extraction since QuickBooks exports have consistent column names.
 * Implements the extraction, validation, and normalization pipeline for company data.
 */
class CompanyProcessor extends BaseProcessor<CompanyRowRaw, CompanyRow> {
    
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
     */
    protected extractRaw(row: any[], headers: string[], rowIndex: number): any {
        if (!headers || headers.length === 0) {
            throw new Error(`[Row ${rowIndex + 1}] Headers are required for company row extraction`);
        }
        
        if (row.length !== headers.length) {
            throw new Error(
                `[Row ${rowIndex + 1}] Row has ${row.length} columns but headers has ${headers.length} columns`
            );
        }

        // Converts the array based row into a key-value object using the header names as keys
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
    protected validateRaw(raw: any, rowIndex: number): CompanyRowRaw {
        // Validate MPN exists
        if (raw.MPN === null || raw.MPN === undefined || raw.MPN === '') {
            throw new Error(`[Row ${rowIndex + 1}] MPN is required but was empty or missing`);
        }

        // Validate Item exists
        if (!raw.Item || (typeof raw.Item === 'string' && raw.Item.trim() === '')) {
            throw new Error(`[Row ${rowIndex + 1}] Item name is required but was empty or missing`);
        }

        // Parse and validate Cost
        const cost = this.parseNumber(raw.Cost);  // ← Using inherited parseNumber!
        if (cost === null) {
            throw new Error(
                `[Row ${rowIndex + 1}] Cost value "${raw.Cost}" (type: ${typeof raw.Cost}) could not be converted to a number`
            );
        }
        if (cost < 0) {
            throw new Error(`[Row ${rowIndex + 1}] Cost cannot be negative, got: ${cost}`);
        }

        // Parse and validate Price
        const price = this.parseNumber(raw.Price);  // ← Using inherited parseNumber!
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
    protected normalize(validated: CompanyRowRaw): CompanyRow {
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
     * Returns the logger name for this processor.
     * Used in console logs to identify the source of log messages.
     */
    protected getLoggerName(): string {
        return 'CompanyProcessor';
    }
}

// Create a singleton instance
const companyProcessor = new CompanyProcessor();

/**
 * @inheritDoc
 * 
 * @param headers - An array of header names that correspond to each column in the row.
 * 
 * @example
 * parseCompanyRow(['ABC123', 'Widget', 'Description', 'Vendor', 10.50, 15.00, 'EA'], 
 *                 ['MPN', 'Item', 'Description', 'PreferredVendor', 'Cost', 'Price', 'U/M'], 0)
 */
export function parseCompanyRow(row: any[], headers: string[], rowIndex: number = 0): CompanyRow {
    return companyProcessor.parseRow(row, headers, rowIndex);
}

/**
 * @inheritDoc
 * 
 * @param headers - An array of header names that correspond to each column in the rows.
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
    return companyProcessor.processRows(rows, headers);
}
