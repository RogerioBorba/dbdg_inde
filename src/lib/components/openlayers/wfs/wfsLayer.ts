import type { IFeatureType, IMetadataUrl } from "$lib/ogc/wfs/wfsCapabilities";

export class WFSLayer {
  iwfsLayer: IFeatureType;
  url: string;

  constructor(iwfsLayer: IFeatureType, url: string) {
    this.iwfsLayer= iwfsLayer;
    this.url = url;
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
}
