export async function GET() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 
    const res = await fetch('https://inde.gov.br/api/catalogo/get');
    const data = await res.json();
    let catalogos: { descricao: string; sigla?: string; url?: string; wmsAvailable?: boolean; wfsAvailable?: boolean; wcsAvailable?: boolean; wmsGetCapabilities?: string; wfsGetCapabilities?: string; wcsGetCapabilities?: string; url_metadados?: string; cswGetCapabilities?: string; }[] = []
    data.forEach((cat: { descricao: string; }) => {
        if (cat.descricao.startsWith('IBGE -')) {
            catalogos_ibge.forEach(cat_ibge => {
                catalogos.push(cat_ibge) 
            })        
        } else {
            catalogos.push(cat)
        }
    })
    return new Response(JSON.stringify(catalogos), {status: 200});
}

let catalogos_ibge = 
    [   {
            "descricao": "IBGE - Instituto Brasileiro de Geografia e Estatística - CGMAT",
            "sigla": "IBGE",
            "url": "https://geoservicos.ibge.gov.br/geoserver/ows",
            "wmsAvailable": true,
            "wfsAvailable": true,
            "wcsAvailable": true,
            "wmsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CGMAT/ows?service=WMS&request=GetCapabilities",
            "wfsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CGMAT/ows?service=wfs&request=GetCapabilities&version=1.3.0",
            "wcsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CGMAT/ows?service=wcs&request=GetCapabilities&version=1.1.1",
            "url_metadados": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge",
            "cswGetCapabilities": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities"
        },
        {
            "descricao": "IBGE - Instituto Brasileiro de Geografia e Estatística - CCAR",
            "sigla": "IBGE",
            "url": "https://geoservicos.ibge.gov.br/geoserver/ows",
            "wmsAvailable": true,
            "wfsAvailable": true,
            "wcsAvailable": true,
            "wmsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CCAR/ows?service=WMS&request=GetCapabilities",
            "wfsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CCAR/ows?service=wfs&request=GetCapabilities&version=1.3.0",
            "wcsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CCAR/ows?service=wcs&request=GetCapabilities&version=1.1.1",
            "url_metadados": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge",
            "cswGetCapabilities": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities"
        },
        {
            "descricao": "IBGE - Instituto Brasileiro de Geografia e Estatística - CGED",
            "sigla": "IBGE",
            "url": "https://geoservicos.ibge.gov.br/geoserver/ows",
            "wmsAvailable": true,
            "wfsAvailable": true,
            "wcsAvailable": true,
            "wmsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CGED/ows?service=WMS&request=GetCapabilities",
            "wfsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CGED/ows?service=wfs&request=GetCapabilities&version=1.3.0",
            "wcsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CGED/ows?service=wcs&request=GetCapabilities&version=1.1.1",
            "url_metadados": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge",
            "cswGetCapabilities": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities"
        },
        {
            "descricao": "IBGE - Instituto Brasileiro de Geografia e Estatística - CGEO",
            "sigla": "IBGE",
            "url": "https://geoservicos.ibge.gov.br/geoserver/ows",
            "wmsAvailable": true,
            "wfsAvailable": true,
            "wcsAvailable": true,
            "wmsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CGEO/ows?service=WMS&request=GetCapabilities",
            "wfsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CGEO/ows?service=wfs&request=GetCapabilities&version=1.3.0",
            "wcsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CGEO/ows?service=wcs&request=GetCapabilities&version=1.1.1",
            "url_metadados": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge",
            "cswGetCapabilities": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities"
        },
        {
            "descricao": "IBGE - Instituto Brasileiro de Geografia e Estatística  - CETE",
            "sigla": "IBGE",
            "url": "https://geoservicos.ibge.gov.br/geoserver/ows",
            "wmsAvailable": true,
            "wfsAvailable": true,
            "wcsAvailable": true,
            "wmsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CETE/ows?service=WMS&request=GetCapabilities",
            "wfsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CETE/ows?service=wfs&request=GetCapabilities&version=1.3.0",
            "wcsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CETE/ows?service=wcs&request=GetCapabilities&version=1.1.1",
            "url_metadados": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge",
            "cswGetCapabilities": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities"
        },
        {
            "descricao": "IBGE - Instituto Brasileiro de Geografia e Estatística - CMA",
            "sigla": "IBGE",
            "url": "https://geoservicos.ibge.gov.br/geoserver/ows",
            "wmsAvailable": true,
            "wfsAvailable": true,
            "wcsAvailable": true,
            "wmsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CREN/ows?service=WMS&request=GetCapabilities",
            "wfsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CREN/ows?service=wfs&request=GetCapabilities&version=1.3.0",
            "wcsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/CREN/ows?service=wcs&request=GetCapabilities&version=1.1.1",
            "url_metadados": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge",
            "cswGetCapabilities": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities"
        },
        {
            "descricao": "IBGE - Instituto Brasileiro de Geografia e Estatística - BDIA",
            "sigla": "IBGE",
            "url": "https://geoservicos.ibge.gov.br/geoserver/ows",
            "wmsAvailable": true,
            "wfsAvailable": true,
            "wcsAvailable": true,
            "wmsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/BDIA/ows?service=WMS&request=GetCapabilities",
            "wfsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/BDIA/ows?service=wfs&request=GetCapabilities&version=1.3.0",
            "wcsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/BDIA/ows?service=wcs&request=GetCapabilities&version=1.1.1",
            "url_metadados": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge",
            "cswGetCapabilities": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities"
        },
        {
            "descricao": "IBGE - Instituto Brasileiro de Geografia e Estatística - PNADC",
            "sigla": "IBGE",
            "url": "https://geoservicos.ibge.gov.br/geoserver/ows",
            "wmsAvailable": true,
            "wfsAvailable": true,
            "wcsAvailable": true,
            "wmsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/PNADC/ows?service=WMS&request=GetCapabilities",
            "wfsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/PNADC/ows?service=wfs&request=GetCapabilities&version=1.3.0",
            "wcsGetCapabilities": "https://geoservicos.ibge.gov.br/geoserver/PNADC/ows?service=wcs&request=GetCapabilities&version=1.1.1",
            "url_metadados": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge",
            "cswGetCapabilities": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities"
        },  
    ]