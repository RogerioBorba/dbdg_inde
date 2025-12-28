
<script lang="ts">
    import {bodyToPDF} from '$lib/components/pdf/gerarPDF'
    /**
     * @type {any}
     */
     let elementHTML = $props();

    function elementHTMLToPDF() {
        bodyToPDF(elementHTML)        
    }
</script>



<button class="w-1/2 m-6 p-2 pl-3 pr-3 bg-blue-700 font-semibold text-white rounded-md flex items-center justify-center hover:bg-blue-800" on:click={elementHTMLToPDF}>
    <svg class="w-6 h-6 text-white dark:text-white mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 17v-5h1.5a1.5 1.5 0 1 1 0 3H5m12 2v-5h2m-2 3h2M5 10V8c0-.4.1-.6.3-.8l4-4 .6-.2H18c.6 0 1 .4 1 1v6M5 19v1c0 .6.4 1 1 1h12c.6 0 1-.4 1-1v-1M10 3v4c0 .6-.4 1-1 1H5m6 4v5h1.4a1.6 1.6 0 0 0 1.6-1.6v-1.8a1.6 1.6 0 0 0-1.6-1.6H11Z"/>
    </svg>
    .PDF
</button>


<!--
<button class="flex m-4 p-2 bg-blue-500 text-white rounded-full" id="buttonRemove" on:click={elementHTMLToPDF}>
    Gerar PDF 
</button>
--->
