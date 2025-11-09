// Type definitions for stores

export type FileData = {
    file: File | null;
    headers: string[] | null;
    rows: any[][] | null;
    filename: string | null;
};

export type ColumnMapping = {
    name: string;
    index: number;
};

export type MappingConfig = Record<string, ColumnMapping> | null;
