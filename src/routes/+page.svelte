<script lang="ts">
    import FileUpload from "$lib/FileUpload.svelte";
    import FileViewer from "$lib/FileViewer.svelte";
    import { vendorStore, companyStore, mappingStore } from "$lib/shared/stores";
    import { matchItems } from "$lib/shared/api/match";

    // Reactive data
    let vendorNormalizedRows = $derived(vendorStore.normalizedRows);
    let companyNormalizedRows = $derived(companyStore.normalizedRows);
    let matchedItems = $derived(mappingStore.matchedItems);
    let orphanedItems = $derived(mappingStore._orphanedItems);

    // Can match when both files have normalized data
    let canMatch = $derived(
        vendorNormalizedRows.length > 0 && companyNormalizedRows.length > 0
    );

    function handleMatch() {
        console.log('[TestingPage] Starting item matching');
        console.log(`[TestingPage] Vendor rows: ${vendorNormalizedRows.length}, Company rows: ${companyNormalizedRows.length}`);

        const result = matchItems(companyNormalizedRows, vendorNormalizedRows);
        mappingStore.setMatchedItems(result);

        console.log(`[TestingPage] Matching complete: ${result.length} items matched`);
    }

    // Convert normalized vendor rows to display format
    const vendorDisplayHeaders = $derived(['MPN', 'Cost', 'Unit Divider']);
    const vendorDisplayRows = $derived(
        vendorNormalizedRows.map(row => [
            row.MPN,
            row.Cost,
            row.UnitDivider ?? 'N/A'
        ])
    );

    // Convert normalized company rows to display format
    const companyDisplayHeaders = $derived(['MPN', 'Item', 'Cost', 'Price', 'Preferred Vendor']);
    const companyDisplayRows = $derived(
        companyNormalizedRows.map(row => [
            row.MPN,
            row.Item,
            row.Cost,
            row.Price,
            row.PreferredVendor ?? 'N/A'
        ])
    );

    // Convert matched items to display format
    const matchedDisplayHeaders = $derived(['MPN', 'Item', 'Company Cost', 'Vendor Cost', 'Difference', 'Status']);
    const matchedDisplayRows = $derived(
        matchedItems.map(item => [
            item.MPN,
            item.companyRow.Item,
            item.companyRow.Cost,
            item.vendorRow?.Cost ?? 'N/A',
            item.costDifference?.toFixed(2) ?? 'N/A',
            item.isOrphaned ? '⚠️ Orphaned' : '✓ Matched'
        ])
    );

    // Orphaned items only
    const orphanedDisplayHeaders = $derived(['MPN', 'Item', 'Company Cost']);
    const orphanedDisplayRows = $derived(
        orphanedItems.map(item => [
            item.MPN,
            item.companyRow.Item,
            item.companyRow.Cost
        ])
    );
</script>

<div class="container">
    <h1>PriceChanger v2 - Testing</h1>

    <!-- File Upload Section -->
    <section class="section">
        <FileUpload />
    </section>

    <!-- Vendor Data Section -->
    {#if vendorNormalizedRows.length > 0}
        <section class="section">
            <h2>Vendor Data ({vendorNormalizedRows.length} rows normalized)</h2>
            <div class="table-container">
                <FileViewer
                    headers={vendorDisplayHeaders}
                    rows={vendorDisplayRows}
                    maxRows={10}
                />
            </div>
        </section>
    {/if}

    <!-- Company Data Section -->
    {#if companyNormalizedRows.length > 0}
        <section class="section">
            <h2>Company Data ({companyNormalizedRows.length} rows normalized)</h2>
            <div class="table-container">
                <FileViewer
                    headers={companyDisplayHeaders}
                    rows={companyDisplayRows}
                    maxRows={10}
                />
            </div>
        </section>
    {/if}

    <!-- Match Button -->
    {#if canMatch && matchedItems.length === 0}
        <section class="section">
            <button class="match-btn" onclick={handleMatch}>
                🔗 Match Items
            </button>
        </section>
    {/if}

    <!-- Matched Results Section -->
    {#if matchedItems.length > 0}
        <section class="section">
            <h2>Matched Items ({matchedItems.length} total, {orphanedItems.length} orphaned)</h2>
            <div class="table-container">
                <FileViewer
                    headers={matchedDisplayHeaders}
                    rows={matchedDisplayRows}
                    maxRows={20}
                />
            </div>
        </section>
    {/if}

    <!-- Orphaned Items Section -->
    {#if orphanedItems.length > 0}
        <section class="section">
            <h2>⚠️ Orphaned Items ({orphanedItems.length})</h2>
            <p class="warning">These items exist in the company file but have no matching vendor.</p>
            <div class="table-container">
                <FileViewer
                    headers={orphanedDisplayHeaders}
                    rows={orphanedDisplayRows}
                    maxRows={10}
                />
            </div>
        </section>
    {/if}
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, sans-serif;
        background: #f9fafb;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px;
    }

    h1 {
        margin: 0 0 32px 0;
        font-size: 32px;
        font-weight: 700;
        color: #111827;
    }

    h2 {
        margin: 0 0 16px 0;
        font-size: 20px;
        font-weight: 600;
        color: #374151;
    }

    .section {
        background: white;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        padding: 24px;
        margin-bottom: 24px;
    }

    .table-container {
        overflow-x: auto;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
    }

    .match-btn {
        padding: 16px 32px;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .match-btn:hover {
        background: #059669;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .warning {
        color: #dc2626;
        background: #fef2f2;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #fca5a5;
        margin-bottom: 16px;
    }

    :global(table) {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
    }

    :global(th) {
        padding: 12px;
        text-align: left;
        background: #f9fafb;
        border-bottom: 2px solid #e5e7eb;
        font-weight: 600;
        color: #374151;
        white-space: nowrap;
    }

    :global(td) {
        padding: 12px;
        border-bottom: 1px solid #f3f4f6;
        color: #1f2937;
    }

    :global(tbody tr:hover) {
        background: #f9fafb;
    }

    :global(tbody tr:last-child td) {
        border-bottom: none;
    }
</style>
