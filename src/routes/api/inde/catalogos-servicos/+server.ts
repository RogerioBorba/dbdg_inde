export async function GET() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 
    const res = await fetch('https://inde.gov.br/api/catalogo/get');
    const data = await res.json();
    return new Response(JSON.stringify(data), {status: 200});
}
