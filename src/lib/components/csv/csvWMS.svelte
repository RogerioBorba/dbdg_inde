<script lang="ts">
    import {wmsListToCSV} from '$lib/components/csv/gerarCSV'
    import type { ICSVLayer } from './icsv';
    
     let { wmsArrayToCSV }: {wmsArrayToCSV: ICSVLayer[]} = $props();

     const csvGenerate = () => {
        wmsListToCSV(wmsArrayToCSV)     
    } 

</script>

<button class="w-1/2 m-2 p-2 bg-blue-700 font-semibold text-white rounded-md flex items-center justify-center hover:bg-blue-800" 
onclick={csvGenerate} title="Gerar CSV">
    <svg class="w-6 h-6 text-white dark:text-white mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10V8c0-.4.1-.6.3-.8l4-4 .6-.2H18c.6 0 1 .4 1 1v6M5 19v1c0 .6.4 1 1 1h12c.6 0 1-.4 1-1v-1M10 3v4c0 .6-.4 1-1 1H5m2.7 9h-1A1.6 1.6 0 0 1 5 15.4v-1.8A1.6 1.6 0 0 1 6.6 12h1m8.4 0 1.4 4.8L19 12m-6-.2h-1a1.3 1.3 0 0 0-1.4 1.2 1.3 1.3 0 0 0 1.2 1.5h.5a1.3 1.3 0 0 1 1.3 1.7c-.2.6-.7.8-1.4.8h-1"/>
    </svg>
    .CSV
</button>


<!--
<button class="flex m-4 p-2 bg-blue-500 text-white rounded-full" id="buttonRemove" on:click={csvGenerate}>
    Gerar CSV
</button>
--->