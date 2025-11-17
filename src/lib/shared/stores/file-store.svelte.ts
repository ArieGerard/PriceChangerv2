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
}