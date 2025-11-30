import * as XLSX from 'xlsx';

// Function to read the excel file. Takes in a default ts type for File. Uses a promise to return a structure of headers and rows. 
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

export function exportToExcel(headers: string[], rows: any[][], filename: string = 'export.xls'): void {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, filename);
}

