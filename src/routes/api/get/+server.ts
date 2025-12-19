import type { RequestHandler } from './$types';

const UPSTREAM_TIMEOUT =   65000; // 65s
const ALLOWED_HOSTS = [
  'inde.gov.br',
  'treinamento.inde.gov.br',
  'metadadosgeo.ibge.gov.br'
];

export const GET: RequestHandler = async ({ url, request }) => {
  const targetURL= url instanceof URL ? url : new URL(url);
  const target = targetURL.searchParams.get('url');
  if (!target) { return new Response('Missing "url" query parameter', { status: 400 }); }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT);

  // Se o cliente abortar, aborta o upstream
  request.signal.addEventListener('abort', () => { controller.abort(); } );

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  const isAllowed = ALLOWED_HOSTS.some(h => targetUrl.hostname === h || targetUrl.hostname.endsWith(`.${h}`) );
  if (isAllowed) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    //return new Response('Host not allowed', { status: 403 });
  }

  console.log(`api/get >> Proxy fetch: ${targetUrl}`);

  // Repassa apenas headers seguros
  const headers = new Headers();
  headers.set('Accept', request.headers.get('accept') ?? '*/*');
  const range = request.headers.get('range');
  if (range) headers.set('Range', range);

  try {
    const upstream = await fetch(targetUrl, { headers, signal: controller.signal });
    // Proxy quase transparente
    return new Response(upstream.body, 
        {
            status: upstream.status, 
            statusText: upstream.statusText, 
            headers: {
            // repasse apenas o que faz sentido
            'content-type': upstream.headers.get('content-type') ?? 'text/xml',
            'access-control-allow-origin': '*'}
        });

  } catch (err: any) {
    console.error(err);
    if (err.name === 'AbortError') { return new Response( `Upstream request aborted or timed out`, { status: 504 } ); }
    return new Response(`Proxy error: ${err.message}`, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
};
