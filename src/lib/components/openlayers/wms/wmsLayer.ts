import type { IWMSLayer } from "$lib/ogc/wms/wmsCapabilities";

export class WMSLayerBase {
  iwmsLayer: IWMSLayer;
  url: string;

  constructor(iwmsLayer: IWMSLayer, url: string) {
    this.iwmsLayer= iwmsLayer;
    this.url = url;
  };
}
