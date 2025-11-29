<script lang="ts">
    // I want this Component to do one soul purpose, take in rows, and display them 
    export let headers: string[];
    export let rows: any[][];
    export let maxRows: number | null = null;
</script>

<table>
    <thead>
        <tr>
            {#each headers as header}
                <th>{header}</th>
            {/each}
        </tr>
    </thead>
    <tbody>
        {#each (maxRows ? rows.slice(0, maxRows) : rows) as row}
            <tr>
                {#each row as cell}
                    <td>{cell ?? ''}</td>
                {/each}
            </tr>
        {/each}
    </tbody>
</table>