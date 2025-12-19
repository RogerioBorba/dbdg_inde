import type { RequestHandler } from './$types';
export const GET: RequestHandler = async (event) => {
  const targetUrl = event.url.search.substring(5);
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
    console.log(`Requisição no proxy. Response status: ${response.status}` );
    if (!response.ok) {
      console.log("response não OK");
      if (response.status == 403) {
        console.log("refazendo a requisição no proxy - erro 403");
        response = await fetch(targetUrl);
        if (!response.ok)
          return new Response(`Failed to fetch: ${response.status}`, { status: 403 });  
      } else return new Response(`Failed to fetch: ${response.status}`, { status: 500 });
    }
      
    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('application/json') || (contentType?.includes('application/geo+json')))  {
      const a_json = await response.json();
      console.log("retornando JSON");
      return new Response(JSON.stringify(a_json), { headers: {'Content-Type': `${contentType}`}});
    }
    if (contentType?.includes('application/xml') || contentType?.includes('text/xml')) {
      const xml = await response.text();
      console.log("retornando XML");
      return new Response(xml, { headers: {'Content-Type': `${contentType}`}});
    }

  } catch (err: any) {
    console.log(err)
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
};
