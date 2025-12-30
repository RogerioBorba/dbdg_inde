
function escapeCSV(value: any) {
        if (value === null || value === undefined) return '""';
        const s = String(value);
        return '"' + s.replace(/"/g, '""') + '"';
 }

export function listToCSV(elements: object[], fileName: string='') {
    if (elements.length === 0) {
        console.warn("Nenhum elemento para converter em CSV.");
        return;
    }
    // Adiciona o cabeçalho (chaves do primeiro objeto)
    const headers = Object.keys(elements[0]).join(";");
    let csvFile = headers + "\n";

    // Adiciona os valores de cada objeto
    for (const objeto of elements) {
        const valores = Object.values(objeto).map(escapeCSV);
        csvFile += valores.join(";") + "\n";
    }
    csvDownload(csvFile, fileName);
}


/**
 * Função geral responsável por fazer o download do csv
 * @param {String} csvFile - String já em formato csv
 * @param {String} fileName - O nome do arquivo desejado
 */
export function csvDownload(csvFile: string, fileName: string) {
    const csvContent = '\uFEFF' + csvFile;
    const csvData = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const csvURL = window.URL.createObjectURL(csvData);
    const tempLink = document.createElement('a');
    tempLink.href = csvURL;
    tempLink.setAttribute('download', fileName);
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    window.URL.revokeObjectURL(csvURL); // Libera a URL do objeto
}


export function wmsListToCSV(elements: object[], filename: string = 'catalogo_wms.csv') {
     listToCSV(elements, filename);
}

export function wfsToCSV(elements: object[], filename: string = 'catalogo_wfs.csv' ) {    
    listToCSV(elements, filename);
}

export function cswToCSV(elements: object[], filename: string = 'catalogo_csw.csv' ) {    
    listToCSV(elements, filename);
}

export function wcsToCSV(elements: object[], filename: string = 'catalogo_wcs.csv' ) {    
    listToCSV(elements, filename);
}