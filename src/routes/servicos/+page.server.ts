import type { PageLoad } from './$types';
import type { CatalogoINDE } from '$lib/types/inde'; // ou caminho que preferir
export const load: PageLoad = async () => {
    try {
        const res = await fetch("https://inde.gov.br/api/catalogo/get");
        if (!res.ok) {
            throw new Error(`HTTP error: ${res.status}`);
        }
        const catalogos: CatalogoINDE[] = await res.json();
        console.log("Requisitei https://inde.gov.br/api/catalogo/get");
        return {
            catalogos_inde: catalogos
        };

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        throw error;
    }
};