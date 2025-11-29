<script>
    import FileUpload from "$lib/FileUpload.svelte";
    import FileViewer from "$lib/FileViewer.svelte";
    import { mappingStore, vendorStore } from "$lib/shared/stores";

    const orphanHeaders = [
        "MPN",
        "Company Cost",
        "Vendor Cost",
        "Cost Difference"
    ]

    let orphanedRows = mappingStore._orphanedItems.map(item => [
        item.MPN,
        item.companyRow.Cost,
        item.vendorRow?.Cost ?? "",
        item.costDifference ?? ""
    ]);

    console.log('Orphaned rows  = ' +  {orphanedRows});
    console.log('Orphaned headers  = ' +  {orphanHeaders});

</script>

<FileUpload />
<FileViewer
    headers={vendorStore.headers}
    rows={vendorStore.rows}
    maxRows={20}
/>

<FileViewer 
    headers={orphanHeaders}
    rows={orphanedRows}
    maxRows={20}
/>

