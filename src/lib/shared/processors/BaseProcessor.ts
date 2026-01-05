// base-processor.ts
export abstract class BaseProcessor<TRaw, TFinal> {
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
    protected parseNumber(value: any): number | null {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number') return isNaN(value) ? null : value;
        if (typeof value === 'string') {
            const cleaned = value.replace(/[$,\s]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? null : parsed;
        }
        return null;
    }

    protected abstract extractRaw(row: any[], config: any, rowIndex: number): TRaw;
    protected abstract validateRaw(raw: TRaw, rowIndex: number): TRaw;
    protected abstract normalize(validated: TRaw): TFinal;
    protected abstract getLoggerName(): string;

    /**
     * Parses a single row through the complete workflow: extraction, validation, and normalization.
     * 
     * @param row - An array of values representing a single row.
     * @param config - Configuration object (mapping for vendor, headers for company).
     * @param rowIndex - The zero-based index of the row (used for error messages). Defaults to 0.
     * @returns A fully parsed and validated row object.
     * @throws {Error} If any step in the parsing process fails. Error messages include row number context.
     */
    parseRow(row: any[], config: any, rowIndex: number = 0): TFinal {
        try {
            const raw = this.extractRaw(row, config, rowIndex);
            const validated = this.validateRaw(raw, rowIndex);
            return this.normalize(validated);
        } catch (error) {
            if (error instanceof Error && !error.message.includes('[Row')) {
                throw new Error(`[Row ${rowIndex + 1}] ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Processes all rows with error aggregation.
     * Parses each row individually and collects both successful results and errors.
     * Continues processing even if individual rows fail.
     * 
     * @param rows - A two-dimensional array where each inner array represents a row.
     * @param config - Configuration object (mapping for vendor, headers for company).
     * @returns An object containing:
     *   - `normalized`: An array of successfully parsed row objects.
     *   - `errors`: An array of error objects with row number (1-based) and error message for failed rows.
     */
    processRows(
        rows: any[][],
        config: any
    ): { 
        normalized: TFinal[]; 
        errors: Array<{ row: number; error: string }> 
    } {
        if (!config) {
            console.warn(`[${this.getLoggerName()}] Cannot process: missing config`);
            return { normalized: [], errors: [] };
        }

        console.log(`[${this.getLoggerName()}] Starting row processing for ${rows.length} rows`);
        
        const normalized: TFinal[] = [];
        const errors: Array<{ row: number; error: string }> = [];
        const startTime = performance.now();

        rows.forEach((row, index) => {
            try {
                const parsed = this.parseRow(row, config, index);
                normalized.push(parsed);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[${this.getLoggerName()}] Row ${index + 1} failed:`, errorMessage);
                errors.push({ row: index + 1, error: errorMessage });
            }
        });

        const duration = performance.now() - startTime;
        console.log(
            `[${this.getLoggerName()}] Processing completed in ${duration.toFixed(2)}ms: ` +
            `${normalized.length} successful, ${errors.length} errors`
        );
        
        if (errors.length > 0) {
            console.warn(
                `[${this.getLoggerName()}] ${errors.length} rows failed validation ` +
                `out of ${rows.length} total rows`
            );
        }
        
        return { normalized, errors };
    }
}
