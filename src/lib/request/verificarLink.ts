export interface VerificarLinkOptions {
  headTimeout?: number;
  getTimeout?: number;
  fetcher?: typeof fetch;
  checkEndpointOrigin?: string;
}

/**
 * Estratégia híbrida para verificação de links de metadados:
 * 1. Tenta HEAD com cabeçalho Range: bytes=0-0 diretamente no navegador caso o destino tenha CORS.
 * 2. Em caso de bloqueio por CORS, recusa de método (405) ou erro no navegador, consulta
 *    o endpoint dedicado (/api/check-link) que avalia os cabeçalhos remotos no servidor
 *    e cancela imediatamente a transmissão sem baixar corpos de arquivos grandes (ex.: .mdb, .zip, .tif).
 */
export async function verificarLink(
  url: string | URL,
  options: VerificarLinkOptions = {}
): Promise<void> {
  const {
    headTimeout = 5000,
    getTimeout = 15000,
    fetcher = fetch,
    checkEndpointOrigin
  } = options;
  const targetUrl = typeof url === 'string' ? url : url.href;

  // 1. Tenta direto caso o servidor remoto permita CORS
  try {
    const headSignal = AbortSignal.timeout(headTimeout);
    const headResponse = await fetcher(targetUrl, {
      method: 'HEAD',
      headers: { Range: 'bytes=0-0' },
      signal: headSignal
    });
    if (headResponse.ok) {
      headResponse.body?.cancel().catch(() => {});
      return;
    }
  } catch {
    // Falha direta (CORS, 405, etc.) -> prossegue para a checagem no endpoint
  }

  // 2. Consulta o endpoint dedicado no backend (/api/check-link)
  const origin = checkEndpointOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  const checkApiUrl = new URL('/api/check-link', origin || 'http://localhost');
  checkApiUrl.searchParams.set('url', targetUrl);
  const resp = await fetcher(checkApiUrl, { signal: AbortSignal.timeout(getTimeout) });
  const data = (await resp.json().catch(() => null)) as { ok?: boolean; error?: string; status?: number } | null;
  if (data && typeof data === 'object') {
    if (data.ok) return;
    throw new Error(data.error || `O serviço respondeu com erro HTTP ${data.status || 502}.`);
  }
  throw new Error('Falha ao obter diagnóstico do link.');
}
