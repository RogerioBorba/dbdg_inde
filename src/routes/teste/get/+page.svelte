<script lang="ts">
    import { onMount } from 'svelte';
    import { get } from '$lib/request/get';

    let status = $state('');
    let headers = $state('');
    let body = $state('');

    const url = 'https://geoservicos.ibge.gov.br/geoserver/ows?service=wms&request=GetCapabilities&version=1.3.0';

    onMount(async () => {
        try {
            const finalUrl = new URL('/api/get', window.location.origin);
            finalUrl.searchParams.set('url', url);
            console.log('Making request to:', finalUrl);

            const response = await get(finalUrl);
            const visibleHeaders = Object.fromEntries(response.headers.entries());
            const responseBody = await response.text();


            status = JSON.stringify(
                {
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url
                },
                null,
                2
            );

            headers =
                Object.keys(visibleHeaders).length > 0
                    ? JSON.stringify(visibleHeaders, null, 2)
                    : 'Nenhum header visível para o navegador.';

            body = responseBody;
        } catch (error) {
            console.error('Erro ao fazer a requisição', error);
            status = 'Erro ao carregar o status da resposta.';
            headers = 'Erro ao carregar os headers.';
            body = 'Erro ao carregar o corpo da resposta.';
        }
    });
</script>

<h2>Status</h2>
<pre>{status}</pre>

<h2>Headers</h2>
<pre>{headers}</pre>

<h2>Body</h2>
<pre>{body}</pre>
