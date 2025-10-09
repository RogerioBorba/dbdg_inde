import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ( {url, fetch} ) => {
  const targetUrl = url.search.substring(5);
  if (targetUrl.toLowerCase().includes("https://inde.gov.br") ||
     targetUrl.toLowerCase().includes("https://treinamento.inde.gov.br")) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
     }
  console.log(`api/get >> Fetch: ${targetUrl}`)
  if (!targetUrl) {
    return new Response('Missing "url" query parameter', { status: 400 });
  }

  try {
    let response = await fetch(targetUrl);
    if (!response.ok) {
      return new Response(`Failed to fetch: ${response.status}`, { status: 500 });
    }
    
    //if (response.status == 403)
    //  response = await fetch(targetUrl)
     const contentType = response.headers.get('Content-Type');
    console.log(contentType);
    if (contentType?.includes('application/json')) {
      const a_json = await response.json();
      return new Response(JSON.stringify(a_json), { headers: {'Content-Type': `${contentType}`}});
    }
    if (contentType?.includes('application/xml') || contentType?.includes('text/xml')) {
      const xml = await response.text();
      return new Response(xml, { headers: {'Content-Type': `${contentType}`}});
    }

  } catch (err: any) {
    console.log(err)
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
};
