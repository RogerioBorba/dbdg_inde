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

function textOf(el: Element | null) {
  return el?.textContent?.trim() ?? "";
}

function attrHref(el: Element | null) {
  if (!el) return undefined;
  // tentar xlink:href (com namespace) ou href (sem)
  return el.getAttribute('xlink:href') ?? el.getAttribute('href') ?? undefined;
}

function parseLayer(layerEl: Element): IWMSLayer {
    // Usar seletores :scope > ... para garantir pegar apenas filhos diretos
    const name = textOf(layerEl.querySelector(':scope > Name'));
    const title = textOf(layerEl.querySelector(':scope > Title')) || name || 'Untitled layer';
    const abstract = layerEl.querySelector(':scope > Abstract')?.textContent ?? undefined;

    // CRS pode estar em <CRS> (WMS 1.3.0) ou <SRS> (WMS 1.1.1)
    const crsNodes = Array.from(layerEl.querySelectorAll(':scope > CRS, :scope > SRS'));
    const crs = crsNodes.map(el => el.textContent?.trim() ?? "").filter(Boolean);

    const bboxEl = layerEl.querySelector(':scope > BoundingBox');
    const bbox = bboxEl
      ? {
          crs: bboxEl.getAttribute('CRS') ?? bboxEl.getAttribute('SRS') ?? "",
          minx: parseFloat(bboxEl.getAttribute('minx') ?? "0"),
          miny: parseFloat(bboxEl.getAttribute('miny') ?? "0"),
          maxx: parseFloat(bboxEl.getAttribute('maxx') ?? "0"),
          maxy: parseFloat(bboxEl.getAttribute('maxy') ?? "0"),
        }
      : undefined;

    const styles = Array.from(layerEl.querySelectorAll(':scope > Style')).map(styleEl => {
      const legendUrlEl = styleEl.querySelector(':scope > LegendURL > OnlineResource') ?? styleEl.querySelector(':scope > LegendURL');
      return {
        name: textOf(styleEl.querySelector(':scope > Name')),
        title: textOf(styleEl.querySelector(':scope > Title')) || undefined,
        abstract: styleEl.querySelector(':scope > Abstract')?.textContent ?? undefined,
        legendURL: attrHref(legendUrlEl ?? null)
      };
    }).filter(s => s.name || s.title || s.legendURL);

    const metadataURLs = Array.from(layerEl.querySelectorAll(':scope > MetadataURL')).map(metaEl => {
      const online = metaEl.querySelector(':scope > OnlineResource') ?? metaEl.querySelector(':scope > MD_Metadata > OnlineResource');
      return {
        type: metaEl.getAttribute('type') ?? undefined,
        format: metaEl.querySelector(':scope > Format')?.textContent ?? undefined,
        url: attrHref(online ?? null) ?? ""
      };
    }).filter(m => m.url);

    const attribution = layerEl.querySelector(':scope > Attribution > Title')?.textContent ?? undefined;
    const children = Array.from(layerEl.querySelectorAll(':scope > Layer')).map(parseLayer);

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
  const topLayers = Array.from(xml.querySelectorAll('Capability > Layer > Layer')).map(parseLayer);
  return topLayers;
};