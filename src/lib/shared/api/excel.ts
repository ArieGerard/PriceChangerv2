import * as XLSX from 'xlsx';

/**
 * Reads an Excel file and extracts headers and rows as arrays.
 * Uses FileReader to read the file asynchronously and XLSX library to parse it.
 * Reads the first worksheet in the workbook.
 * 
 * @param file - The File object to read (from a file input element).
 * @returns A Promise that resolves to an object containing:
 *   - `headers`: An array of strings from the first row of the Excel file.
 *   - `rows`: A two-dimensional array where each inner array represents a data row (excluding the header row).
 * @throws {Error} If the file cannot be read or parsed.
 * 
 * @example
 * const { headers, rows } = await readExcelFile(fileInput.files[0]);
 * // headers: ['MPN', 'Item', 'Cost']
 * // rows: [['ABC123', 'Widget', 10.50], ['DEF456', 'Gadget', 20.00]]
 */
export async function readExcelFile(file: File): Promise<{ headers: string[]; rows: any[][] }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader(); 
        // Similar to a callback though I use this because I can handle the result when its ready
        reader.onload = (e) => {
          try {
            // Check for file data 
            if (!e.target?.result) {
                reject(new Error('Failed to read file: no data'));
                return;
            }
            const workbook = XLSX.read(e.target.result, { type: 'buffer' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            resolve({
                headers: (jsonData[0] || []) as string[],
                rows: jsonData.slice(1) || []
            });
          } catch (error) {
            reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file')); 
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Exports data to an Excel file and triggers a download.
 * Creates a new workbook with a single worksheet containing the provided headers and rows.
 * 
 * @param headers - An array of strings representing the column headers.
 * @param rows - A two-dimensional array where each inner array represents a data row.
 * @param filename - The name of the file to download. Defaults to 'export.xls'.
 * 
 * @example
 * exportToExcel(['MPN', 'Item', 'Cost'], [['ABC123', 'Widget', 10.50]], 'products.xls');
 */
export function exportToExcel(headers: string[], rows: any[][], filename: string = 'export.xls'): void {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, filename);
}

