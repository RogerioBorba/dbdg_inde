import type { IWMSLayer } from '$lib/ogc/wms/wmsCapabilities';
import type { IGeoservicoDescricao } from '$lib/inde';

export type SearchOperator = 'OR' | 'AND';

export function hasWMSAvailable(catalog: IGeoservicoDescricao & { wmsAvailable?: boolean }): boolean {
    return Boolean(catalog.wmsAvalaible ?? catalog.wmsAvailable);
}

export function hasWMSGetCapabilities(catalog: Pick<IGeoservicoDescricao, 'wmsGetCapabilities'>): boolean {
    return typeof catalog.wmsGetCapabilities === 'string' && catalog.wmsGetCapabilities.trim().length > 0;
}

export function normalizeSearchTerm(value: string): string {
    return value.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function parseSearchTerms(value: string): string[] {
    return value.split(/[\n,;]+/).map(normalizeSearchTerm).filter(Boolean);
}

export function flattenLayers<T extends { layers?: T[] }>(layers: T[]): T[] {
    const flattened: T[] = [];

    function visit(layer: T) {
        flattened.push(layer);
        for (const child of layer.layers ?? []) {
            visit(child);
        }
    }

    for (const layer of layers) {
        visit(layer);
    }

    return flattened;
}

export function matchesLayerKeywords(
    layer: Pick<IWMSLayer, 'keywords'>,
    terms: string[],
    operator: SearchOperator
): boolean {
    const keywords = (layer.keywords ?? []).map(normalizeSearchTerm).filter(Boolean);
    if (keywords.length === 0 || terms.length === 0) return false;

    const matches = (term: string) => keywords.some((keyword) => keyword.includes(term));
    return operator === 'AND' ? terms.every(matches) : terms.some(matches);
}

export function sortWMSResults<T extends { layer: Pick<IWMSLayer, 'title' | 'name'>; catalog: { descricao: string } }>(
    items: T[]
): T[] {
    return [...items].sort((a, b) => {
        const titleA = a.layer.title || a.layer.name || '';
        const titleB = b.layer.title || b.layer.name || '';
        const comp = titleA.localeCompare(titleB, 'pt-BR', { sensitivity: 'base' });
        if (comp !== 0) return comp;
        return a.catalog.descricao.localeCompare(b.catalog.descricao, 'pt-BR', { sensitivity: 'base' });
    });
}
