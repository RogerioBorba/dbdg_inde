import { browser } from '$app/environment';

type GetOptions = RequestInit & { timeout?: number};

// Exemplo de chamada: await get(wmsUrl, { headers: { Accept: 'image/png' }, timeout: 20000 });
async function get( url: string | URL,  options?: GetOptions ): Promise<Response> {

  const targetUrl = url instanceof URL ? url : new URL(url);
  const timeout = options?.timeout ?? 65000; // 65s padrão
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const init: RequestInit = { ...options, signal: controller.signal};
  
  try {
    const response = await fetch(targetUrl, init);

    if (!response.ok) { throw new Error(`HTTP error ${response.status}`);}

    return response;

  } catch (error: any) {
    
    // Timeout ou abort
    if (error.name === 'AbortError') { throw new Error(`Timeout after ${timeout}ms for ${targetUrl}`); }

    // No SSR não existe window nem proxy via browser
    if (!browser) { throw error; }

    const proxyUrl = new URL('/api/get', window.location.origin);
    proxyUrl.searchParams.set('url', targetUrl.toString());

    console.warn(`Falha no fetch direto, usando proxy do servidor: ${proxyUrl}`, error);
    const proxyResponse = await fetch(proxyUrl, init);

    if (!proxyResponse.ok) { throw new Error(`Proxy fetch failed (${proxyResponse.status}) for ${targetUrl}`); }

    return proxyResponse;
  } finally {
    clearTimeout(id);
  }
}
export { get };
 