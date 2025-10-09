import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ( {url, fetch, request} ) => {
  // const targetUrl = url.searchParams.get('url');
 // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const targetUrl = url.search.substring(5);
  if (targetUrl.toLowerCase().includes("https://inde.gov.br") ||
     targetUrl.toLowerCase().includes("https://treinamento.inde.gov.br")) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
     }
  console.log(`api/get-xml >> Fetch: ${targetUrl}`)
  if (!targetUrl) {
    return new Response('Missing "url" query parameter', { status: 400 });
  }

  try {
    let response = await fetch(targetUrl, { method: "GET",  headers: {"Content-type": 'application/xml'}});
    if (!response.ok) {
      return new Response(`Failed to fetch: ${response.status}`, { status: 500 });
    }
    
    //if (response.status == 403)
    //  response = await fetch(targetUrl)
    
    const xml = await response.text();

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8'
      }
    });
  } catch (err: any) {
    console.log(err)
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
};
