export interface IWMSLayer {
  name: string;
  title: string;
  abstract?: string;
  crs: string[];
  bbox?: {
    crs: string;
    minx: number;
    miny: number;
    maxx: number;
    maxy: number;
  };
  styles?: {
    name: string;
    title?: string;
    abstract?: string;
    legendURL?: string;
  }[];
  formats?: string[];
  queryable?: boolean;
  attribution?: string;
  metadataURLs?: {
    type?: string; // Tipo de metadado (ex: TC211, FGDC)
    format?: string; // Formato (ex: text/xml)
    url: string;
  }[];
  children?: IWMSLayer[];
};

function parseLayer(layerEl: Element): IWMSLayer {
    const name = layerEl.querySelector("Name")?.textContent ?? "";
    const title = layerEl.querySelector("Title")?.textContent ?? "";
    const abstract = layerEl.querySelector("Abstract")?.textContent ?? undefined;
    const crs = Array.from(layerEl.querySelectorAll("CRS")).map(el => el.textContent ?? "").filter(Boolean);
    const bboxEl = layerEl.querySelector("BoundingBox");
    const bbox = bboxEl
      ? {
          crs: bboxEl.getAttribute("CRS") ?? "",
          minx: parseFloat(bboxEl.getAttribute("minx") ?? "0"),
          miny: parseFloat(bboxEl.getAttribute("miny") ?? "0"),
          maxx: parseFloat(bboxEl.getAttribute("maxx") ?? "0"),
          maxy: parseFloat(bboxEl.getAttribute("maxy") ?? "0"),
        }
      : undefined;

    const styles = Array.from(layerEl.querySelectorAll("Style")).map(styleEl => ({
      name: styleEl.querySelector("Name")?.textContent ?? "",
      title: styleEl.querySelector("Title")?.textContent ?? undefined,
      abstract: styleEl.querySelector("Abstract")?.textContent ?? undefined,
      legendURL: styleEl.querySelector("LegendURL OnlineResource")?.getAttribute("xlink:href") ?? undefined,
    }));

    const metadataURLs = Array.from(layerEl.querySelectorAll("MetadataURL")).map(metaEl => ({
      type: metaEl.getAttribute("type") ?? undefined,
      format: metaEl.querySelector("Format")?.textContent ?? undefined,
      url: metaEl.querySelector("OnlineResource")?.getAttribute("xlink:href") ?? "",
    }));

    const attribution = layerEl.querySelector("Attribution Title")?.textContent ?? undefined;
    const children = Array.from(layerEl.querySelectorAll(":scope > Layer")).map(parseLayer);

    return {
      name,
      title,
      abstract,
      crs,
      bbox,
      styles: styles.length > 0 ? styles : undefined,
      metadataURLs: metadataURLs.length > 0 ? metadataURLs : undefined,
      attribution,
      children: children.length > 0 ? children : undefined,
    };
  };

export function parseWMSLayers(xml: Document): IWMSLayer[] {
  /*
  *
  Essa função:
    Recebe o XML (Document) do GetCapabilities de um WMS.
    Encontra as camadas principais dentro do nó <Capability>.
    Converte cada camada XML em um objeto IWMSLayer usando parseLayer.
    Retorna todas essas camadas em um array.
  */
  const topLayers = Array.from(xml.querySelectorAll("Capability > Layer > Layer")).map(parseLayer);
  return topLayers;
};
