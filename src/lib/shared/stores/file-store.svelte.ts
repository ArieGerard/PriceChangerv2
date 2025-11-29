import type { FileData } from "./types";

export class BaseFileStore {
    protected data = $state<FileData>({
        file: null,
        headers: null,
        rows: null,
        filename: null
    });
    
    // Getters with safe defaults
    get rows(): any[][] {
        return this.data.rows || [];
    }

    get headers(): string[] {
        return this.data.headers || [];
    }

    get filename(): string | null {
        return this.data.filename;
    }

    get file(): File | null {
        return this.data.file;
    }

    setFile(data: { headers: string[]; rows: any[][] }, filename: string, file: File | null = null) {
        this.data.file = file;
        this.data.headers = data.headers;
        this.data.rows = data.rows;
        this.data.filename = filename;
    }

    clearFile() {
        this.data.file = null;
        this.data.headers = null;
        this.data.rows = null;
        this.data.filename = null;
    }

    filteredRows(searchTerm : string): any[][] {
        if (!this.data.rows) return [];
        return this.data.rows.filter(row =>
            row.some(cell => cell?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    getOrphanedItems(){
        this.return 
    }

    protected normalizeRowsGeneric<T>(
        normalize: (row: any[], index: number) => T,
        storeName: string
    ): { 
        normalized: T[]; 
        errors: Array<{ row: number; error: string }> 
    } {
        console.log(`[${storeName}] Starting row normalization for ${this.data.rows?.length || 0} rows`);
        
        if (!this.data.rows) {
            console.warn(`[${storeName}] Cannot normalize: no rows loaded`);
            return { normalized: [], errors: [] };
        }

        const normalized: T[] = [];
        const errors: Array<{ row: number; error: string }> = [];
        const startTime = performance.now();

        this.data.rows.forEach((row, index) => {
            try {
                const normalizedRow = normalize(row, index);
                normalized.push(normalizedRow);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[${storeName}] Row ${index + 1} failed validation:`, errorMessage);
                errors.push({
                    row: index + 1,
                    error: errorMessage,
                });
            }
        });

        const duration = performance.now() - startTime;
        console.log(`[${storeName}] Normalization completed in ${duration.toFixed(2)}ms: ${normalized.length} successful, ${errors.length} errors`);

        if (errors.length > 0) {
            console.warn(`[${storeName}] ${errors.length} rows failed validation out of ${this.data.rows.length} total rows`);
        }
        
        return { normalized, errors };
    }

}