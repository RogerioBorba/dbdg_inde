import type { IFeatureType, IMetadataUrl } from "$lib/ogc/wfs/wfsCapabilities";

export class WFSLayer {
  iwfsLayer: IFeatureType;
  url: string;
  version: string;
  tipoGeometria: string;

  constructor(
    iwfsLayer: IFeatureType,
    capabilitiesUrl: string,
    version?: string
  ) {
    this.iwfsLayer = iwfsLayer;

    // URL base (sem query string)
    const urlObj = new URL(capabilitiesUrl);
    this.url = `${urlObj.origin}${urlObj.pathname}`;

    // versão: prioridade
    // 1) parâmetro explícito
    // 2) parâmetro version da URL do GetCapabilities
    // 3) fallback
    this.version =
      version ||
      urlObj.searchParams.get("version") ||
      "2.0.0";

    this.tipoGeometria = "";
  }

  description(): string {
    return this.iwfsLayer.title || this.iwfsLayer.name;
  }

  keywords(): string[] {
    return this.iwfsLayer.keywords || [];
  }

  metadataURLs(): IMetadataUrl[] {
    return this.iwfsLayer?.metadataURLs || [];
  }

  name(): string {
    return this.iwfsLayer.name;
  }

  title(): string {
    return this.iwfsLayer.title || "";
  }

  // =========================
  // Helpers internos
  // =========================

  private typeNameParam(version: string): string {
    // WFS 2.0.0 -> typeNames
    // WFS 1.1.0 / 1.0.0 -> typeName
    return version.startsWith("2.") ? "typeNames" : "typeName";
  }

  // =========================
  // URLs WFS
  // =========================

  urlGetFeatureBase(version: string = this.version): string {
    const service = "WFS";
    const request = "GetFeature";
    const typeNameParam = this.typeNameParam(version);
    const typeName = this.name();

    return `${this.url}?service=${service}&version=${version}&request=${request}&${typeNameParam}=${typeName}`;
  }

  urlGetFeature(version: string = this.version,outputFormat: string = "application/json"): string {
    const baseURL = this.urlGetFeatureBase(version);
    return `${baseURL}&outputFormat=${outputFormat}`;
  }

  urlGetFeatureCount(version: string = this.version, outputFormat: string = "GML2" ): string | null {
    if (version =="1.0.0") {
      // WFS 1.0.0 não suporta resultType=hits
      //return this.urlGetFeatureBase(version) + `&outputFormat=${outputFormat}`;
      return null; // Indica que a contagem de feições não é suportada para esta versão
    }
    const baseURL = this.urlGetFeatureBase(version);
    return `${baseURL}&outputFormat=${outputFormat}&resultType=hits`;
  }
}
