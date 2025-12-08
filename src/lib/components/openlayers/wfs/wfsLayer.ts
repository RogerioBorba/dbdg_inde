import type { IFeatureType, IMetadataUrl } from "$lib/ogc/wfs/wfsCapabilities";

export class WFSLayer {
  iwfsLayer: IFeatureType;
  url: string;
  tipoGeometria: string;

  constructor(iwfsLayer: IFeatureType, url: string) {
    // IFeatureType é a interface de FeatureType que vem do GetCapabilities
    // url é a URL do GetCapabilities 
    this.iwfsLayer= iwfsLayer;
    this.url = url.split('?')[0]; // URL base do capabilities. somente o início.
    this.tipoGeometria = '';
    
  };
  
  description(): string {
    return this.iwfsLayer.title || this.iwfsLayer.name ;
  };
  
  keywords(): string[] {
    return this.iwfsLayer.keywords || [];
  };

  metadataURLs(): IMetadataUrl[] {
    return this.iwfsLayer?.metadataURLs || [];
  };

  name(): string {
        return this.iwfsLayer.name;   
  };
    
  title(): string {
        return this.iwfsLayer.title || ''
  };

 // funções para o gerar operações do WFS
 urlGetFeatureBase(version: string = '2.0.0', typeNamesOrTtypeName: string = 'typeNames'):  string  
    {   // somente parâmetros obrigatórios
        const service='WFS';
        const request='GetFeature';
        const typeNames = this.name();
        return `${this.url}?service=${service}&version=${version}&request=${request}&${typeNamesOrTtypeName}=${typeNames}`;
    }; 
  
    urlGetFeature(version: string = '2.0.0', typeNamesOrTtypeName: string = 'typeNames', outputFormat: string = 'application/json') {
        const baseURL = this.urlGetFeatureBase(version, typeNamesOrTtypeName);
        return `${baseURL}&outputFormat=${outputFormat}`;
    };

    urlGetFeatureCount(version: string = '2.0.0', typeNamesOrTtypeName: string = 'typeNames', outputFormat: string = 'GML2'): string {
        // url para retornar a quanntidade de Features
        const baseURL = this.urlGetFeatureBase(version, typeNamesOrTtypeName);
        const resultType = 'hits';
        const url =  `${baseURL}&outputFormat=${outputFormat}&resultType=${resultType}`;
        return  url;
    };
  
}
