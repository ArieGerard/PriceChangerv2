// base-processor.ts
export abstract class BaseProcessor<TRaw, TFinal> {
    
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

    processRows(
        // Params
        rows: any[][],
        config: any
    ): { 
        // Structured Output 
        normalized: TFinal[]; 
        errors: Array<{ row: number; error: string }> 
    } {
        // Method Body
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
