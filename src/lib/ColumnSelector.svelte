<script lang="ts">
    import { mapCompanyFile, vendorData } from "./shared/stores";
    import type { MappingConfig } from "./shared/stores/types";

    let vendorHeaders = $derived(vendorData.headers || []);
    let previewVendorRows = $derived(vendorData.rows || []);


    let requiredColumns = ["MPN", "Cost"];
    let optionalColumns = ["Unit Divider"];
    let bulkPricing;

    // Use this for UI logic
    let { onConfirmed = (mappping: MappingConfig) => {}, 
    onCancel = () => {} } = $props();

    let selections: Record<string, number | null> = {
        MPN: null,
        Cost: null,
        "Unit Divider": null,
    };

    let enabledOption: Record<string, boolean> = {
        bulkPricing: false,
        "Unit Divider": false
    };

    let canConfirm = $derived.by(() => {
        if (selections["MPN"] === null) return false;
        if (selections["Cost"] === null) return false;

        if (
            enabledOption["Unit Divider"] &&
            selections["Unit Divider"] === null
        ) {
            return false;
        }
        return true;
    })
   
   
    function selectColumn(columnType: string, headerIndex: number | null) {
        selections[columnType] = headerIndex;
    }

    function isSelected(columnType: string, headerIndex: number) {
        return selections[columnType] === headerIndex;
    }

    function toggleOptional(columnType: string) {
        enabledOption[columnType] = !enabledOption[columnType];
        if (!enabledOption[columnType]) {
            selections[columnType] = null;
        }
    }

    function handleConfirm() {
        
    }

    function handleCancel() {
        onCancel();
    }
</script>

<!-- Modal Backdrop -->
<div class="modal-backdrop" on:click={handleCancel}>
    <div class="modal-container" on:click|stopPropagation>
        
        <!-- Header -->
        <header class="modal-header">
            <div>
                <h2>Select Columns</h2>
                <p>Map your Excel columns to the required fields</p>
            </div>
            <button class="close-btn" on:click={handleCancel} aria-label="Close">
                ✕
            </button>
        </header>
        
        <!-- Instructions -->
        <div class="instructions">
            <div class="instruction-item required">
                <span class="badge">Required</span>
                <span>{requiredColumns.join(', ')}</span>
            </div>
            {#if optionalColumns.length > 0}
                <div class="instruction-item optional">
                    <span class="badge">Optional</span>
                    <span>{optionalColumns.join(', ')}</span>
                </div>
            {/if}
        </div>
        
        <!-- Selection Status -->
        <div class="selection-status">
            {#each requiredColumns as columnType}
                <div class="status-item" class:selected={selections[columnType] !== null}>
                    <strong>{columnType}:</strong>
                    <span class="value">
                        {selections[columnType] !== null ? vendorHeaders[selections[columnType]] : '⚠️ Not selected'}
                    </span>
                </div>
            {/each}
            
            {#each optionalColumns as columnType}
                <div class="status-item optional-item">
                    <label class="checkbox-label">
                        <input 
                            type="checkbox" 
                            checked={enabledOption[columnType]}
                            on:change={() => toggleOptional(columnType)}
                        />
                        <strong>{columnType}:</strong>
                    </label>
                    {#if enabledOption[columnType]}
                        <span class="value">
                            {selections[columnType] !== null ? vendorHeaders[selections[columnType]] : '⚠️ Not selected'}
                        </span>
                    {/if}
                </div>
            {/each}
        </div>
        
        <!-- Preview Table -->
        <div class="preview-section">
            <h3>Click column headers to select</h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            {#each vendorHeaders as header, i}
                                <th 
                                    class:selected-mpn={isSelected('MPN', i)}
                                    class:selected-cost={isSelected('Cost', i)}
                                    class:selected-unit={isSelected('Unit Divider', i)}
                                    on:click={() => {
                                        // Smart selection - picks first unselected required field
                                        if (selections.MPN === null) {
                                            selectColumn('MPN', i);
                                        } else if (selections.Cost === null) {
                                            selectColumn('Cost', i);
                                        } else if (enabledOption['Unit Divider'] && selections['Unit Divider'] === null) {
                                            selectColumn('Unit Divider', i);
                                        } else {
                                            // Allow re-selection
                                            if (isSelected('MPN', i)) selectColumn('MPN', null);
                                            else if (isSelected('Cost', i)) selectColumn('Cost', null);
                                            else if (isSelected('Unit Divider', i)) selectColumn('Unit Divider', null);
                                            else selectColumn('MPN', i); // Default to MPN
                                        }
                                    }}
                                >
                                    <div class="header-content">
                                        <span class="header-text">{header}</span>
                                        {#if isSelected('MPN', i)}
                                            <span class="tag mpn">MPN</span>
                                        {/if}
                                        {#if isSelected('Cost', i)}
                                            <span class="tag cost">Cost</span>
                                        {/if}
                                        {#if isSelected('Unit Divider', i)}
                                            <span class="tag unit">Unit Divider</span>
                                        {/if}
                                    </div>
                                </th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each previewVendorRows.slice(0, 4) as row}
                            <tr>
                                {#each row as cell, i}
                                    <td 
                                        class:selected-mpn={isSelected('MPN', i)}
                                        class:selected-cost={isSelected('Cost', i)}
                                        class:selected-unit={isSelected('Unit Divider', i)}
                                    >
                                        {cell ?? ''}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Footer Actions -->
        <footer class="modal-footer">
            <button class="btn-cancel" on:click={handleCancel}>
                Cancel
            </button>
            <button 
                class="btn-confirm" 
                disabled={!canConfirm}
                on:click={handleConfirm}
            >
                {canConfirm ? '✓ Confirm Selection' : 'Select Required Columns'}
            </button>
        </footer>
        
    </div>
</div>

<style>
    /* Modal Backdrop */
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
        animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    /* Modal Container */
    .modal-container {
        background: white;
        border-radius: 16px;
        max-width: 1000px;
        width: 100%;
        max-height: 90vh;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s ease;
    }
    
    @keyframes slideUp {
        from { 
            opacity: 0;
            transform: translateY(20px);
        }
        to { 
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Header */
    .modal-header {
        padding: 24px 28px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        background: linear-gradient(to bottom, #ffffff, #f9fafb);
    }
    
    .modal-header h2 {
        margin: 0 0 6px 0;
        font-size: 24px;
        font-weight: 700;
        color: #111827;
    }
    
    .modal-header p {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: #9ca3af;
        cursor: pointer;
        padding: 4px;
        line-height: 1;
        transition: color 0.2s;
    }
    
    .close-btn:hover {
        color: #374151;
    }
    
    /* Instructions */
    .instructions {
        padding: 16px 28px;
        background: #f9fafb;
        display: flex;
        gap: 24px;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .instruction-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
    }
    
    .badge {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .required .badge {
        background: #fee2e2;
        color: #dc2626;
    }
    
    .optional .badge {
        background: #dbeafe;
        color: #2563eb;
    }
    
    /* Selection Status */
    .selection-status {
        padding: 20px 28px;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .status-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: #f9fafb;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    .status-item.selected {
        background: #ecfdf5;
        border-color: #10b981;
    }
    
    .status-item strong {
        color: #374151;
        min-width: 100px;
    }
    
    .status-item .value {
        color: #6b7280;
        font-family: monospace;
    }
    
    .status-item.selected .value {
        color: #059669;
        font-weight: 600;
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
    }
    
    /* Preview Section */
    .preview-section {
        flex: 1;
        padding: 20px 28px;
        overflow: auto;
    }
    
    .preview-section h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #374151;
    }
    
    .table-wrapper {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: auto;
        max-height: 280px;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
    }
    
    th {
        padding: 14px 16px;
        text-align: left;
        background: #f9fafb;
        border-bottom: 2px solid #e5e7eb;
        cursor: pointer;
        transition: all 0.2s;
        position: sticky;
        top: 0;
        z-index: 1;
        white-space: nowrap;
    }
    
    th:hover {
        background: #f3f4f6;
    }
    
    th.selected-mpn {
        background: #fee2e2;
        border-bottom-color: #dc2626;
    }
    
    th.selected-cost {
        background: #dbeafe;
        border-bottom-color: #2563eb;
    }
    
    th.selected-unit {
        background: #d1fae5;
        border-bottom-color: #10b981;
    }
    
    .header-content {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: space-between;
    }
    
    .header-text {
        font-weight: 600;
        color: #374151;
    }
    
    .tag {
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .tag.mpn {
        background: #dc2626;
        color: white;
    }
    
    .tag.cost {
        background: #2563eb;
        color: white;
    }
    
    .tag.unit {
        background: #10b981;
        color: white;
    }
    
    td {
        padding: 12px 16px;
        border-bottom: 1px solid #f3f4f6;
        color: #374151;
    }
    
    td.selected-mpn {
        background: #fef2f2;
    }
    
    td.selected-cost {
        background: #eff6ff;
    }
    
    td.selected-unit {
        background: #f0fdf4;
    }
    
    tbody tr:last-child td {
        border-bottom: none;
    }
    
    /* Footer */
    .modal-footer {
        padding: 20px 28px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        background: #f9fafb;
    }
    
    button {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .btn-cancel {
        background: white;
        color: #374151;
        border: 1px solid #d1d5db;
    }
    
    .btn-cancel:hover {
        background: #f9fafb;
    }
    
    .btn-confirm {
        background: #2563eb;
        color: white;
    }
    
    .btn-confirm:hover:not(:disabled) {
        background: #1d4ed8;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    
    .btn-confirm:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .modal-container {
            max-width: 95vw;
        }
        
        .instructions {
            flex-direction: column;
            gap: 12px;
        }
    }
</style>
