// place files you want to import through the `$lib` alias in this folder.
// Esta interface segue a estrutura dos itens da API: https://inde.gov.br/api/catalogo/get
export type IGeoservicoDescricao = { 
    descricao: string, 
    nivel_no: string, 
    wcsAvalaible: boolean, 
    wcsGetCapabilities: string, 
    wfsAvalaible: boolean,
    wfsGetCapabilities: string, 
    wmsAvalaible: boolean,
    wmsGetCapabilities: string, 

 };
 