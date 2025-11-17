<script lang="ts">
    import { readExcelFile } from './shared/api/excel';
    import { vendorStore, companyStore, mappingStore } from './shared/stores';
    import ColumnSelector from './ColumnSelector.svelte';
    import type { MappingConfig } from './shared/stores/types';
    
    let file: File | null = null;
    let currentFileType: 'vendor' | 'company' = 'vendor';
    let isLoading = false;
    let errorMessage = '';
    let fileInput: HTMLInputElement;
    let showColumnSelector = $state(false);

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
      console.log(`[FileUpload] Upload initiated for ${type} file`);
      currentFileType = type;
      file = null;
      errorMessage = '';
      
      if (fileInput) {
        fileInput.click();
      }
    }

    function handleFileSelect(event: Event) {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        file = target.files[0];
        console.log(`[FileUpload] File selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB) for ${currentFileType} file`);
        parseFile();
      }
    }

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

    async function parseFile() {
        if (!file) {
            errorMessage = 'Please select a file first';
            console.warn('[FileUpload] parseFile called but no file selected');
            return;
        }

        console.log(`[FileUpload] Starting file parsing for ${currentFileType} file: ${file.name}`);
        isLoading = true;
        errorMessage = '';

        try {
            const result = await readExcelFile(file);
            console.log(`[FileUpload] File parsed successfully: ${result.headers.length} headers, ${result.rows.length} rows`);
            
            let validation = null;
            if (currentFileType === 'company') {
                const requiredHeaders = fileTypeConfig[currentFileType].requiredHeaders;

                validation = validateHeaders(
                    result.headers, 
                    requiredHeaders
                );

                if (!validation.valid) {
                    console.error(`[FileUpload] Header validation failed: ${validation.message}`);
                    errorMessage = validation.message;
                    return;
                }
                console.log(`[FileUpload] Header validation passed for company file`);
            }

            if (currentFileType === 'vendor') {
                mappingStore.setIsMapped(false);
                vendorStore.setFile(result, file.name, file);
                console.log(`[FileUpload] Vendor file loaded: ${result.rows.length} rows, ${result.headers.length} columns`);
                
                if (fileTypeConfig.vendor.requiresMapping) {
                    showColumnSelector = true;
                    console.log('[FileUpload] Showing column selector for vendor file mapping');
                }
            } else {
                companyStore.setFile(result, file.name, file);
                console.log(`[FileUpload] Company file loaded: ${result.rows.length} rows, ${result.headers.length} columns`);
            }

            if (currentFileType === 'company' && validation) {
                errorMessage = validation.message;
            } else if (currentFileType === 'vendor') {
                errorMessage = '';
            } else {
                errorMessage = `${fileTypeConfig[currentFileType].label} loaded successfully`;
            }
            
            console.log(`[FileUpload] File upload completed successfully for ${currentFileType} file`);

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[FileUpload] File parsing failed for ${currentFileType} file:`, errorMsg, error);
            errorMessage = `Failed to parse file: ${errorMsg}`;
        } finally {
            isLoading = false;
        }
    }

    function handleMappingConfirmed(mapping: MappingConfig) {
        console.log('[FileUpload] Mapping confirmed, closing column selector');
        showColumnSelector = false;
        errorMessage = `${fileTypeConfig.vendor.label} mapped and loaded successfully`;
    }

    function handleMappingCancelled() {
        console.log('[FileUpload] Mapping cancelled by user');
        showColumnSelector = false;
    }
</script>
    
    {#if errorMessage}
        <div class="message" class:error={errorMessage.includes('Missing') || errorMessage.includes('Failed')}>
            {errorMessage}
        </div>
    {/if}

    <div class="upload-section">
        <h2>Upload Files</h2>
        <div class="button-group">
            <button on:click={() => uploadByFileType('vendor')}>
                Upload Vendor File
            </button>
            <button on:click={() => uploadByFileType('company')}>
                Upload Company File
            </button>
        </div>
        {#if isLoading}
            <p>Loading...</p>
        {/if}
    </div>

    <input 
        type="file" 
        accept=".xlsx,.xls" 
        bind:this={fileInput}
        on:change={handleFileSelect}
        style="display: none;"
    />

    {#if file}
        <div class="file-info">
            <p><strong>Selected:</strong> {file.name}</p>
            <p><strong>Size:</strong> {(file.size / 1024).toFixed(1)} KB</p>
        </div>
    {/if}

    {#if showColumnSelector}
        <ColumnSelector 
            onConfirmed={handleMappingConfirmed}
            onCancel={handleMappingCancelled}
        />
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



