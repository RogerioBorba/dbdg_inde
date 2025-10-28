// ----------------------------------------------------------------------
// Interfaces principais do WMS GetCapabilities 1.3.0
// ----------------------------------------------------------------------

export interface IWMSOnlineResource {
  href: string;
  type?: string;
  format?: string;
}

export interface IWMSMetadataURL {
  type?: string;
  format?: string;
  href: string;
}

export interface IWMSContactInformation {
  person?: string;
  organization?: string;
  position?: string;
  address?: string;
  city?: string;
  stateOrProvince?: string;
  postCode?: string;
  country?: string;
  email?: string;
}

export interface IWMSService {
  name: string;
  title: string;
  abstract?: string;
  keywords: string[];
  onlineResource?: IWMSOnlineResource;
  contactInformation?: IWMSContactInformation;
  fees?: string;
  accessConstraints?: string;
}

export interface IWMSRequestType {
  name: string;
  formats: string[];
  getURLs: string[];
  postURLs: string[];
}

export interface IWMSCapability {
  requests: IWMSRequestType[];
  exceptions: string[];
  layers: IWMSLayer[];
}

export interface IWMSBoundingBox {
  crs: string;
  minx: number;
  miny: number;
  maxx: number;
  maxy: number;
}

export interface IWMSLegendURL {
  format: string;
  width?: number;
  height?: number;
  href: string;
}

export interface IWMSStyle {
  name: string;
  title?: string;
  abstract?: string;
  legendURLs: IWMSLegendURL[];
}

export interface IWMSLayer {
  name?: string;
  title: string;
  abstract?: string;
  crs: string[];
  bbox?: IWMSBoundingBox[];
  styles: IWMSStyle[];
  metadataURLs: IWMSMetadataURL[];
  layers: IWMSLayer[]; // subcamadas
}

export interface IWMSCapabilities {
  version: string;
  updateSequence?: string;
  service: IWMSService;
  capability: IWMSCapability;
}

// ----------------------------------------------------------------------
// Funções utilitárias
// ----------------------------------------------------------------------

function textOf(el: Element | null): string | undefined {
  return el?.textContent?.trim() || undefined;
}

function parseOnlineResource(el: Element | null): IWMSOnlineResource | undefined {
  if (!el) return undefined;
  const href = el.getAttribute("xlink:href") || "";
  const type = el.getAttribute("xlink:type") || undefined;
  return { href, type };
}

function parseMetadataURLs(layerEl: Element): IWMSMetadataURL[] {
  return Array.from(layerEl.querySelectorAll(":scope > MetadataURL")).map(metaEl => ({
    type: metaEl.getAttribute("type") || undefined,
    format: textOf(metaEl.querySelector(":scope > Format")),
    href: metaEl.querySelector(":scope > OnlineResource")?.getAttribute("xlink:href") || "",
  }));
}

// ----------------------------------------------------------------------
// Função principal: parser de WMS GetCapabilities
// ----------------------------------------------------------------------

export function parseWMSCapabilities(xml: Document): IWMSCapabilities {
  const root = xml.documentElement;
  const version = root.getAttribute("version") || "";
  const updateSequence = root.getAttribute("updateSequence") || undefined;

  // --------------------------------------------------------------------
  // Service
  // --------------------------------------------------------------------
  const serviceEl = root.querySelector("Service");
  const service: IWMSService = {
    name: textOf(serviceEl?.querySelector("Name")) || "",
    title: textOf(serviceEl?.querySelector("Title")) || "",
    abstract: textOf(serviceEl?.querySelector("Abstract")),
    keywords: Array.from(serviceEl?.querySelectorAll("KeywordList > Keyword") || []).map(k => k.textContent?.trim() || ""),
    onlineResource: parseOnlineResource(serviceEl?.querySelector("OnlineResource")),
    contactInformation: {
      organization: textOf(serviceEl?.querySelector("ContactOrganization")),
      email: textOf(serviceEl?.querySelector("ContactElectronicMailAddress")),
    },
    fees: textOf(serviceEl?.querySelector("Fees")),
    accessConstraints: textOf(serviceEl?.querySelector("AccessConstraints")),
  };

  // --------------------------------------------------------------------
  // Capability / Request
  // --------------------------------------------------------------------
  const capabilityEl = root.querySelector("Capability");

  const requestEls = Array.from(capabilityEl?.querySelectorAll("Request > *") || []);
  const requests: IWMSRequestType[] = requestEls.map(reqEl => ({
    name: reqEl.nodeName,
    formats: Array.from(reqEl.querySelectorAll("Format")).map(f => f.textContent?.trim() || ""),
    getURLs: Array.from(reqEl.querySelectorAll("DCPType > HTTP > Get > OnlineResource")).map(
      o => o.getAttribute("xlink:href") || ""
    ),
    postURLs: Array.from(reqEl.querySelectorAll("DCPType > HTTP > Post > OnlineResource")).map(
      o => o.getAttribute("xlink:href") || ""
    ),
  }));

  // --------------------------------------------------------------------
  // Exception
  // --------------------------------------------------------------------
  const exceptions = Array.from(capabilityEl?.querySelectorAll("Exception > Format") || []).map(
    e => e.textContent?.trim() || ""
  );

  // --------------------------------------------------------------------
  // Layers
  // --------------------------------------------------------------------
  function parseLayer(layerEl: Element): IWMSLayer {
    const styles = Array.from(layerEl.querySelectorAll(":scope > Style")).map(styleEl => ({
      name: textOf(styleEl.querySelector(":scope > Name")) || "",
      title: textOf(styleEl.querySelector(":scope > Title")),
      abstract: textOf(styleEl.querySelector(":scope > Abstract")),
      legendURLs: Array.from(styleEl.querySelectorAll(":scope > LegendURL")).map(legEl => ({
        format: textOf(legEl.querySelector(":scope > Format")) || "",
        width: legEl.getAttribute("width") ? Number(legEl.getAttribute("width")) : undefined,
        height: legEl.getAttribute("height") ? Number(legEl.getAttribute("height")) : undefined,
        href: legEl.querySelector("OnlineResource")?.getAttribute("xlink:href") || "",
      })),
    }));

    const metadataURLs = parseMetadataURLs(layerEl);

    const sublayers = Array.from(layerEl.querySelectorAll(":scope > Layer")).map(parseLayer);

    const bboxes = Array.from(layerEl.querySelectorAll(":scope > BoundingBox")).map(bboxEl => ({
      crs: bboxEl.getAttribute("CRS") || "",
      minx: Number(bboxEl.getAttribute("minx")),
      miny: Number(bboxEl.getAttribute("miny")),
      maxx: Number(bboxEl.getAttribute("maxx")),
      maxy: Number(bboxEl.getAttribute("maxy")),
    }));

    return {
      name: textOf(layerEl.querySelector(":scope > Name")),
      title: textOf(layerEl.querySelector(":scope > Title")) || "",
      abstract: textOf(layerEl.querySelector(":scope > Abstract")),
      crs: Array.from(layerEl.querySelectorAll(":scope > CRS")).map(c => c.textContent?.trim() || ""),
      bbox: bboxes,
      styles,
      metadataURLs,
      layers: sublayers,
      url: null,
      layerApp: null
    };
  }

  const layers = Array.from(capabilityEl?.querySelectorAll(":scope > Layer > Layer") || []).map(parseLayer);

  // --------------------------------------------------------------------
  // Resultado final
  // --------------------------------------------------------------------
  return {
    version,
    updateSequence,
    service,
    capability: { requests, exceptions, layers },
  };
};

export function iWMSLayers(xmlString: string, urlCapabilities: string | null): IWMSLayer[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  const iwms_capabilties = parseWMSCapabilities(xmlDoc);
  let layers: IWMSLayer[] = iwms_capabilties.capability.layers;
  return layers
};

export class WMSLayerBase {
  iwmsLayer: IWMSLayer;
  url: string;

  constructor(iwmsLayer: IWMSLayer, url: string) {
    this.iwmsLayer= iwmsLayer;
    this.url = url;
  };
}
