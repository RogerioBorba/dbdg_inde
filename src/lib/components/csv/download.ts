function escapeCSV(value: any) {
        if (value === null || value === undefined) return '""';
        const s = String(value);
        return '"' + s.replace(/"/g, '""') + '"';
 }

export function dateTimeNowAsString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}


export function downloadCSV(header: string[], records: any[]) {
    const rows = records.map(r => [
        r.serviceType,
        r.operation,
        r.datetime,
        r.requestTimeSeconds,
        r.name,
        r.numLayers,
        r.numLayersWithoutMetadata,
        r.numLayersWithoutKeywords,
        r.url,
        r.processadoSemErro
    ].map(escapeCSV).join(','));

    const csv = [header.map(escapeCSV).join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wms_catalogs_${dateTimeNowAsString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
/*
const header = [
    'tipo_do_servico',
    'operacao_do_servico',
    'data_e_hora_da_requisicao',
    'tempo_da_requisicao_em_segundos',
    'nome',
    'quantidade_de_camadas',
    'quantidade_de_camadas_sem_metadados_associados',
    'quantidade_de_camadas_sem_palavras_chave',
    'url',
    'processadoSemErro'
];

const records = [
    {
        serviceType: 'WMS',
        operation: 'GetCapabilities',
        datetime: '2025-12-27T12:00:00',
        requestTimeSeconds: 2.5,
        name: 'Camada 1',
        numLayers: 10,
        numLayersWithoutMetadata: 2,
        numLayersWithoutKeywords: 1,
        url: 'https://exemplo.com/wms',
        processadoSemErro: true
    }
    // Adicione mais registros conforme necessário
];

downloadCSV(header, records);
*/