
export interface CatalogoINDE {
    descricao: string;
    url: string;
    nivel_no: string;
    wmsAvailable: boolean;
    wfsAvailable: boolean;
    wcsAvailable: boolean;
    wmsGetCapabilities: string;
    wfsGetCapabilities: string | null;
    wcsGetCapabilities: string | null;
}
