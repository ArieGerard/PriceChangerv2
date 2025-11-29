<script>
    import FileUpload from "$lib/FileUpload.svelte";
    import FileViewer from "$lib/FileViewer.svelte";
    import { vendorStore } from "$lib/shared/stores";
</script>
<FileUpload></FileUpload>
<FileViewer
    headers={vendorStore.headers}
    rows={vendorStore.rows}
    maxRows={20}
/>
