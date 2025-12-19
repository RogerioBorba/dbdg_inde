// iso19115-parser.ts
// Parser ISO 19115-1:2014 → ISO/TS 19115-3:2016 (XML) usando querySelector/All (estilo WFS)

// ----------------------------------------------------------------------
// Namespaces (obrigatório declarar para usar em seletores CSS)
// ----------------------------------------------------------------------
const NS = {
  mdb: "http://standards.iso.org/iso/19115/-3/mdb/2.0",
  cit: "http://standards.iso.org/iso/19115/-3/cit/2.0",
  mcc: "http://standards.iso.org/iso/19115/-3/mcc/2.0",
  gco: "http://standards.iso.org/iso/19115/-3/gco/1.0",
  lan: "http://standards.iso.org/iso/19115/-3/lan/1.0",
  gml: "http://www.opengis.net/gml/3.2",
  xlink: "http://www.w3.org/1999/xlink",
};

// ----------------------------------------------------------------------
// Tipos (mantidos os mais importantes, incluindo todos os campos pedidos)
// ----------------------------------------------------------------------
export enum CI_RoleCode { ORIGINATOR = "originator", PUBLISHER = "publisher", CUSTODIAN = "custodian", POINT_OF_CONTACT = "pointOfContact" }
export enum CI_DateTypeCode { CREATION = "creation", PUBLICATION = "publication", REVISION = "revision" }
export enum CI_PresentationFormCode { DOCUMENT_DIGITAL = "documentDigital", MAP_DIGITAL = "mapDigital", DOCUMENT_HARDCOPY = "documentHardcopy" }
export enum CI_OnlineFunctionCode { DOWNLOAD = "download", INFORMATION = "information", SEARCH = "search", ORDER = "order" }

export interface CharacterString { value: string }
export interface DateTime { value: string }
export interface URL { value: string }
export interface LanguageCode { code: string }

export interface CI_OnlineResource {
  linkage: URL;
  protocol?: CharacterString;
  applicationProfile?: CharacterString;
  name?: CharacterString;
  description?: CharacterString;
  function?: CI_OnlineFunctionCode;
  protocolRequest?: CharacterString;
}

export interface CI_ResponsibleParty {
  individualName?: CharacterString;
  organisationName?: CharacterString;
  positionName?: CharacterString;
  role: CI_RoleCode;
}

export interface CI_Citation {
  title: CharacterString;
  alternateTitle?: CharacterString[];
  date?: { date: DateTime; dateType: CI_DateTypeCode }[];
  edition?: CharacterString;
  editionDate?: DateTime;
  identifier?: { code: CharacterString; codeSpace?: CharacterString }[];
  citedResponsibleParty?: CI_ResponsibleParty[];
  presentationForm?: CI_PresentationFormCode[];
  series?: { name: CharacterString; issueIdentification?: CharacterString; page?: CharacterString };
  otherCitationDetails?: CharacterString;
  ISBN?: CharacterString;
  ISSN?: CharacterString;
  onlineResource?: CI_OnlineResource[];
  graphic?: { fileDescription?: CharacterString; fileType?: CharacterString; filename?: CharacterString }[];
}

export interface MD_DataIdentification {
  citation: CI_Citation;
  abstract: CharacterString;
  purpose?: CharacterString;
  language: LanguageCode[];
  topicCategory?: string[];
}

export interface MD_Metadata {
  fileIdentifier?: string;
  metadataIdentifier?: string;
  language?: string;
  characterSet?: string;
  hierarchyLevel?: string;
  contact: CI_ResponsibleParty[];
  dateStamp: string;
  metadataStandardName?: string;
  metadataStandardVersion?: string;
  identificationInfo: MD_DataIdentification[];
}

// ----------------------------------------------------------------------
// Funções auxiliares (iguais ao seu estilo WFS)
// ----------------------------------------------------------------------
const text = (el: Element | null): string | undefined => el?.textContent?.trim() || undefined;

const attr = (el: Element | null, name: string): string | undefined =>
  el?.getAttribute(name) ?? undefined;

const charString = (el: Element | null): CharacterString =>
  ({ value: text(el) || "" });

const urlString = (el: Element | null): URL =>
  ({ value: text(el) || "" });

// ----------------------------------------------------------------------
// Parser principal usando querySelector/All
// ----------------------------------------------------------------------
export function iso19115Metadata(xmlString: string): MD_Metadata {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");

  const error = doc.querySelector("parsererror");
  if (error) throw new Error("XML inválido: " + error.textContent);

  const root = doc.documentElement;
  if (root.localName !== "MD_Metadata" || root.namespaceURI !== NS.mdb) {
    throw new Error("Raiz esperada: mdb:MD_Metadata");
  }

  // Configura namespaces para querySelector funcionar com prefixos
  const nsResolver = (prefix: string | null): string | null => NS[prefix || ""] || null;
  const $ = <T extends Element>(selector: string): T | null =>
    doc.querySelector(selector.replace(/([a-z]+):/g, (_, p) => `ns${p}:`));
  const $$ = <T extends Element>(selector: string): T[] =>
    Array.from(doc.querySelectorAll(selector.replace(/([a-z]+):/g, (_, p) => `ns${p}:`)));

  // ====================================================================
  // MD_Metadata - campos de nível superior
  // ====================================================================
  const fileIdentifier = text(root.querySelector("mdb\\:metadataIdentifier mcc\\:MD_Identifier mcc\\:code gco\\:CharacterString"));
  const dateStamp = text(root.querySelector("mdb\\:dateInfo cit\\:CI_Date cit\\:date gco\\:Date")) ||
                    text(root.querySelector("mdb\\:dateInfo cit\\:CI_Date cit\\:date gco\\:DateTime"));

  // ====================================================================
  // Contact (obrigatório)
  // ====================================================================
  const contacts: CI_ResponsibleParty[] = $$("mdb\\:contact cit\\:CI_ResponsibleParty").map(el => ({
    individualName: charString(el.querySelector("cit\\:individualName gco\\:CharacterString")),
    organisationName: charString(el.querySelector("cit\\:organisationName gco\\:CharacterString")),
    positionName: charString(el.querySelector("cit\\:positionName gco\\:CharacterString")),
    role: (attr(el.querySelector("cit\\:role cit\\:CI_RoleCode"), "codeListValue") as CI_RoleCode) || CI_RoleCode.CUSTODIAN,
  }));

  // ====================================================================
  // IdentificationInfo → MD_DataIdentification
  // ====================================================================
  const identificationInfo: MD_DataIdentification[] = $$("mdb\\:identificationInfo mri\\:MD_DataIdentification").map(mri => {
    const citationEl = mri.querySelector("mri\\:citation cit\\:CI_Citation");

    // ------------------ CI_Citation completo ------------------
    const citation: CI_Citation = {
      title: charString(citationEl?.querySelector("cit\\:title gco\\:CharacterString")),
      alternateTitle: Array.from(citationEl?.querySelectorAll("cit\\:alternateTitle gco\\:CharacterString") || []).map(charString),
      date: Array.from(citationEl?.querySelectorAll("cit\\:date cit\\:CI_Date") || []).map(d => ({
        date: { value: text(d.querySelector("cit\\:date gco\\:Date")) || text(d.querySelector("cit\\:date gco\\:DateTime")) || "" },
        dateType: (attr(d.querySelector("cit\\:dateType cit\\:CI_DateTypeCode"), "codeListValue") as CI_DateTypeCode) || CI_DateTypeCode.PUBLICATION,
      })),
      edition: charString(citationEl?.querySelector("cit\\:edition gco\\:CharacterString")),
      editionDate: { value: text(citationEl?.querySelector("cit\\:editionDate gco\\:DateTime")) || "" } || undefined,
      identifier: Array.from(citationEl?.querySelectorAll("cit\\:identifier mcc\\:MD_Identifier") || []).map(id => ({
        code: charString(id.querySelector("mcc\\:code gco\\:CharacterString")),
        codeSpace: charString(id.querySelector("mcc\\:codeSpace gco\\:CharacterString")),
      })),
      citedResponsibleParty: Array.from(citationEl?.querySelectorAll("cit\\:citedResponsibleParty cit\\:CI_ResponsibleParty") || []).map(rp => ({
        organisationName: charString(rp.querySelector("cit\\:organisationName gco\\:CharacterString")),
        role: (attr(rp.querySelector("cit\\:role cit\\:CI_RoleCode"), "codeListValue") as CI_RoleCode) || CI_RoleCode.ORIGINATOR,
      })),
      presentationForm: Array.from(citationEl?.querySelectorAll("cit\\:presentationForm cit\\:CI_PresentationFormCode") || [])
        .map(pf => attr(pf, "codeListValue") as CI_PresentationFormCode)
        .filter(Boolean),
      series: (() => {
        const s = citationEl?.querySelector("cit\\:series cit\\:CI_Series");
        if (!s) return undefined;
        return {
          name: charString(s.querySelector("cit\\:name gco\\:CharacterString")),
          issueIdentification: charString(s.querySelector("cit\\:issueIdentification gco\\:CharacterString")),
          page: charString(s.querySelector("cit\\:page gco\\:CharacterString")),
        };
      })(),
      otherCitationDetails: charString(citationEl?.querySelector("cit\\:otherCitationDetails gco\\:CharacterString")),
      ISBN: charString(citationEl?.querySelector("cit\\:ISBN gco\\:CharacterString")),
      ISSN: charString(citationEl?.querySelector("cit\\:ISSN gco\\:CharacterString")),
      onlineResource: Array.from(citationEl?.querySelectorAll("cit\\:onlineResource cit\\:CI_OnlineResource") || []).map(or => ({
        linkage: urlString(or.querySelector("cit\\:linkage gco\\:CharacterString")),
        protocol: charString(or.querySelector("cit\\:protocol gco\\:CharacterString")),
        applicationProfile: charString(or.querySelector("cit\\:applicationProfile gco\\:CharacterString")),
        name: charString(or.querySelector("cit\\:name gco\\:CharacterString")),
        description: charString(or.querySelector("cit\\:description gco\\:CharacterString")),
        function: (attr(or.querySelector("cit\\:function cit\\:CI_OnlineFunctionCode"), "codeListValue") as CI_OnlineFunctionCode) || undefined,
        protocolRequest: charString(or.querySelector("cit\\:protocolRequest gco\\:CharacterString")),
      })),
      graphic: Array.from(citationEl?.querySelectorAll("cit\\:graphic") || []).map(g => ({
        fileDescription: charString(g.querySelector("cit\\:fileDescription gco\\:CharacterString")),
        fileType: charString(g.querySelector("cit\\:fileType gco\\:CharacterString")),
        filename: charString(g.querySelector("cit\\:filename gco\\:CharacterString")),
      })),
    };

    return {
      citation,
      abstract: charString(mri.querySelector("mri\\:abstract gco\\:CharacterString")),
      purpose: charString(mri.querySelector("mri\\:purpose gco\\:CharacterString")),
      language: Array.from(mri.querySelectorAll("mri\\:language lan\\:LanguageCode") || [])
        .map(l => ({ code: attr(l, "codeListValue") || "" }))
        .filter(l => l.code),
    };
  });

  // ====================================================================
  // Retorno final
  // ====================================================================
  return {
    fileIdentifier,
    dateStamp: dateStamp || "",
    contact: contacts.length > 0 ? contacts : [{ role: CI_RoleCode.CUSTODIAN }],
    identificationInfo,
  };
}

// ----------------------------------------------------------------------
// Exemplo de uso (igual ao seu WFS)
// ----------------------------------------------------------------------
/*
const xmlString = await fetch("metadata.xml").then(r => r.text());
try {
  const metadata = iso19115Metadata(xmlString);
  console.log("ISO 19115-1:2014 parseado com sucesso!", metadata);
} catch (err) {
  console.error("Erro:", err);
}
*/