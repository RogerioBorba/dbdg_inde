// ----------------------------------------------------------------------
// Tipos base e utilitários
// ----------------------------------------------------------------------

export interface IBoundingBox {
  lowerCorner: [number, number];
  upperCorner: [number, number];
}

export interface IKeyword {
  value: string;
}

export interface IMetadataUrl {
  type?: string;
  format?: string;
  href: string;
}

function text(el?: Element | null): string | undefined {
  return el?.textContent?.trim() || undefined;
}

// ----------------------------------------------------------------------
// Seções principais
// ----------------------------------------------------------------------

export interface IServiceIdentification {
  title: string;
  abstract?: string;
  keywords?: string[];
  serviceType?: string;
  serviceTypeVersion?: string;
  fees?: string;
  accessConstraints?: string;
}

export interface IServiceProvider {
  providerName: string;
  contactEmail?: string;
  city?: string;
  country?: string;
  administrativeArea?: string;
}

export interface IOperation {
  name: string;
  getUrl?: string;
  postUrl?: string;
  parameters?: Record<string, string[]>;
  constraints?: Record<string, string>;
}

export interface IFeatureType {
  name: string;
  title: string;
  abstract?: string;
  keywords?: string[];
  defaultCRS?: string;
  bbox?: IBoundingBox;
  metadataURLs?: IMetadataUrl[];
}

export interface IFESConstraint {
  name: string;
  defaultValue?: string;
}

export interface IFESComparisonOperator {
  name: string;
}

export interface IFESSpatialOperator {
  name: string;
}

export interface IFESTemporalOperator {
  name: string;
}

export interface IFESFunctionArgument {
  name: string;
  type: string;
}

export interface IFESFunction {
  name: string;
  returns: string;
  arguments: IFESFunctionArgument[];
}

export interface IFilterCapabilities {
  conformance: IFESConstraint[];
  idCapabilities: string[];
  comparisonOperators: IFESComparisonOperator[];
  spatialOperators: IFESSpatialOperator[];
  temporalOperators: IFESTemporalOperator[];
  functions: IFESFunction[];
}

// ----------------------------------------------------------------------
// Estrutura principal
// ----------------------------------------------------------------------

export interface IWFSGetCapabilities {
  version: string;
  updateSequence?: string;
  serviceIdentification: IServiceIdentification;
  serviceProvider: IServiceProvider;
  operations: IOperation[];
  featureTypes: IFeatureType[];
  filterCapabilities?: IFilterCapabilities;
}

// ----------------------------------------------------------------------
// Função de parser principal
// ----------------------------------------------------------------------

export function parseWFSGetCapabilities(xml: Document): IWFSGetCapabilities {
  const version = xml.documentElement.getAttribute("version") ?? "";
  const updateSequence = xml.documentElement.getAttribute("updateSequence") ?? undefined;

  // ------------------ ServiceIdentification ------------------
  const serviceEl = xml.querySelector("ows\\:ServiceIdentification, ServiceIdentification");
  const serviceIdentification: IServiceIdentification = {
    title: text(serviceEl?.querySelector("ows\\:Title")) ?? "",
    abstract: text(serviceEl?.querySelector("ows\\:Abstract")),
    keywords: Array.from(serviceEl?.querySelectorAll("ows\\:Keyword") ?? []).map(k => text(k) ?? ""),
    serviceType: text(serviceEl?.querySelector("ows\\:ServiceType")),
    serviceTypeVersion: text(serviceEl?.querySelector("ows\\:ServiceTypeVersion")),
    fees: text(serviceEl?.querySelector("ows\\:Fees")),
    accessConstraints: text(serviceEl?.querySelector("ows\\:AccessConstraints")),
  };

  // ------------------ ServiceProvider ------------------
  const providerEl = xml.querySelector("ows\\:ServiceProvider, ServiceProvider");
  const serviceProvider: IServiceProvider = {
    providerName: text(providerEl?.querySelector("ows\\:ProviderName")) ?? "",
    contactEmail: text(providerEl?.querySelector("ows\\:ElectronicMailAddress")),
    city: text(providerEl?.querySelector("ows\\:City")),
    country: text(providerEl?.querySelector("ows\\:Country")),
    administrativeArea: text(providerEl?.querySelector("ows\\:AdministrativeArea")),
  };

  // ------------------ OperationsMetadata ------------------
  const operations: IOperation[] = Array.from(xml.querySelectorAll("ows\\:Operation")).map(op => ({
    name: op.getAttribute("name") ?? "",
    getUrl: op.querySelector("ows\\:Get")?.getAttribute("xlink:href") ?? undefined,
    postUrl: op.querySelector("ows\\:Post")?.getAttribute("xlink:href") ?? undefined,
    parameters: Object.fromEntries(
      Array.from(op.querySelectorAll("ows\\:Parameter")).map(p => [
        p.getAttribute("name") ?? "",
        Array.from(p.querySelectorAll("ows\\:Value")).map(v => text(v) ?? "")
      ])
    ),
    constraints: Object.fromEntries(
      Array.from(op.querySelectorAll("ows\\:Constraint")).map(c => [
        c.getAttribute("name") ?? "",
        text(c.querySelector("ows\\:DefaultValue")) ?? ""
      ])
    )
  }));

  // ------------------ FeatureTypeList ------------------
  const featureTypes: IFeatureType[] = Array.from(xml.querySelectorAll("FeatureType")).map(ft => {
    const lowerCorner = text(ft.querySelector("ows\\:LowerCorner"));
    const upperCorner = text(ft.querySelector("ows\\:UpperCorner"));
    return {
      name: text(ft.querySelector("Name")) ?? "",
      title: text(ft.querySelector("Title")) ?? "",
      abstract: text(ft.querySelector("Abstract")),
      keywords: Array.from(ft.querySelectorAll("ows\\:Keyword")).map(k => text(k) ?? ""),
      defaultCRS: text(ft.querySelector("DefaultCRS")),
      bbox: lowerCorner && upperCorner
        ? {
            lowerCorner: lowerCorner.split(" ").map(Number) as [number, number],
            upperCorner: upperCorner.split(" ").map(Number) as [number, number],
          }
        : undefined,
      metadataURLs: Array.from(ft.querySelectorAll("MetadataURL")).map(m => ({
        type: m.getAttribute("type") ?? undefined,
        format: text(m.querySelector("Format")),
        href: m.getAttribute("xlink:href") ?? "",
      })),
    };
  });

  // ------------------ Filter_Capabilities (FES 2.0) ------------------
  const filterEl = xml.querySelector("fes\\:Filter_Capabilities");
  let filterCapabilities: IFilterCapabilities | undefined;

  if (filterEl) {
    // Conformance constraints
    const conformance: IFESConstraint[] = Array.from(filterEl.querySelectorAll("fes\\:Conformance > fes\\:Constraint"))
      .map(c => ({
        name: c.getAttribute("name") ?? "",
        defaultValue: text(c.querySelector("ows\\:DefaultValue")),
      }));

    // Id_Capabilities
    const idCapabilities = Array.from(filterEl.querySelectorAll("fes\\:Id_Capabilities fes\\:ResourceIdentifier"))
      .map(id => id.getAttribute("name") ?? "");

    // ComparisonOperators
    const comparisonOperators = Array.from(filterEl.querySelectorAll("fes\\:ComparisonOperators fes\\:ComparisonOperator"))
      .map(op => ({ name: op.getAttribute("name") ?? "" }));

    // SpatialOperators
    const spatialOperators = Array.from(filterEl.querySelectorAll("fes\\:SpatialOperators fes\\:SpatialOperator"))
      .map(op => ({ name: op.getAttribute("name") ?? "" }));

    // TemporalOperators
    const temporalOperators = Array.from(filterEl.querySelectorAll("fes\\:TemporalOperators fes\\:TemporalOperator"))
      .map(op => ({ name: op.getAttribute("name") ?? "" }));

    // Functions
    const functions = Array.from(filterEl.querySelectorAll("fes\\:Functions fes\\:Function")).map(f => ({
      name: f.getAttribute("name") ?? "",
      returns: text(f.querySelector("fes\\:Returns")) ?? "",
      arguments: Array.from(f.querySelectorAll("fes\\:Argument")).map(arg => ({
        name: arg.getAttribute("name") ?? "",
        type: text(arg.querySelector("fes\\:Type")) ?? "",
      })),
    }));

    filterCapabilities = {
      conformance,
      idCapabilities,
      comparisonOperators,
      spatialOperators,
      temporalOperators,
      functions,
    };
  }

  // ------------------ Retorno completo ------------------
  return {
    version,
    updateSequence,
    serviceIdentification,
    serviceProvider,
    operations,
    featureTypes,
    filterCapabilities,
  };
};

export function iWFSFeatureTypes(xmlString: string): IFeatureType[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  const iwfs_capabilties = parseWFSGetCapabilities(xmlDoc);
  let layers: IFeatureType[] = iwfs_capabilties.featureTypes;
  return layers
};


// ----------------------------------------------------------------------
// Exemplo de uso
// ----------------------------------------------------------------------
// const xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");
// const capabilities = parseWFSGetCapabilities(xmlDoc);
// console.log(capabilities);
