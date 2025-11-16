<script lang="ts">
    import { readExcelFile } from './shared/api/excel';
    import { vendorStore, companyStore, mappingStore } from './shared/stores';
    // State variables
    let file: File | null = null;
    let currentFileType: 'vendor' | 'company' = 'vendor';
    let isLoading = false;
    let errorMessage = '';
    let fileInput: HTMLInputElement; 

    // File type configurations
    const fileTypeConfig = {
        vendor: {
            label: 'Vendor File',
            requiresMapping: true,
            requiredMappings: ['MPN', 'Cost'],
            optionalMappings: ['Unit Divider']
        },

        company: {
            label: 'Company File',
            requiresMapping: false,
            requiredHeaders: [
                'Preferred Vendor',
                'Item',
                'Description',
                'Cost',
                'Price',
                'MPN',
                'U/M'
            ]
        }
    };
   

    export function uploadByFileType(type: 'vendor' | 'company') {
      currentFileType = type;
      file = null; // Clear selected file when switching types
      errorMessage = '';
      
      // Trigger file input dialog
      if (fileInput) {
        fileInput.click();
      }
    }

    // Handle file selection
    function handleFileSelect(event: Event) {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        file = target.files[0];
        // Automatically parse the file after selection
        parseFile();
      }
    }

    // Validation functions
    function validateHeaders(headers: string[], requiredHeaders: string[]): { valid: boolean; message: string } {
        if (!headers || headers.length === 0) {
            return {
                valid: false,
                message: 'No headers found in the file'
            };
        }

        const missingHeaders = requiredHeaders.filter(required => 
            !headers.some(header => 
                header.toLowerCase().trim() === required.toLowerCase().trim()
            )
        );

        if (missingHeaders.length > 0) {
            return {
                valid: false,
                message: `Missing required headers: ${missingHeaders.join(', ')}`
            };
        }

        return {
            valid: true,
            message: `${fileTypeConfig[currentFileType].label} loaded successfully`
        };
    }

    // File processing
    async function parseFile() {
        if (!file) {
            errorMessage = 'Please select a file first';
            return;
        }

        isLoading = true;
        errorMessage = '';

        try {
            const result = await readExcelFile(file);
            
            // Only validate headers for company files (not vendor files)
            let validation = null;
            if (currentFileType === 'company') {
                const requiredHeaders = fileTypeConfig[currentFileType].requiredHeaders;

                validation = validateHeaders(
                    result.headers, 
                    requiredHeaders
                );

                if (!validation.valid) {
                    errorMessage = validation.message;
                    return;
                }
            }

            // Set data based on file type
            if (currentFileType === 'vendor') {
                // Reset isMapped to false when uploading new vendor file
                mappingStore.setIsMapped(false);
                vendorStore.setFile(result, file.name, file);
            } else {
                companyStore.setFile(result, file.name, file);
            }

            // Set success message based on file type
            if (currentFileType === 'company' && validation) {
                errorMessage = validation.message;
            } else {
                errorMessage = `${fileTypeConfig[currentFileType].label} loaded successfully`;
            }

        } catch (error) {
            console.error('Error parsing file:', error);
            errorMessage = `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`;
        } finally {
            isLoading = false;
        }
    }
</script>


    <!-- Status Messages -->
    {#if errorMessage}
        <div class="message" class:error={errorMessage.includes('Missing') || errorMessage.includes('Failed')}>
            {errorMessage}
        </div>
    {/if}

    <!-- Hidden file input -->
    <input 
        type="file" 
        accept=".xlsx,.xls" 
        bind:this={fileInput}
        on:change={handleFileSelect}
        style="display: none;"
    />

    <!-- File Info -->
    {#if file}
        <div class="file-info">
            <p><strong>Selected:</strong> {file.name}</p>
            <p><strong>Size:</strong> {(file.size / 1024).toFixed(1)} KB</p>
        </div>
    {/if}

<style>
    .message {
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 15px;
        background: #d1fae5;
        color: #065f46;
        border: 1px solid #a7f3d0;
    }

    .message.error {
        background: #fee2e2;
        color: #991b1b;
        border-color: #fca5a5;
    }

    .file-info {
        padding: 10px;
        background: #f8fafc;
        border-radius: 6px;
        font-size: 14px;
    }

    .file-info p {
        margin: 5px 0;
    }
</style>



