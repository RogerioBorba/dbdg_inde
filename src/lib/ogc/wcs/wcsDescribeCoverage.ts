export interface IWCSCoverageDetails {
  dimensions?: number[];
  axisLabels?: string[];
  gridType?: string;
  origin?: number[];
  offsets?: number[][];
  boundingBox?: { lowerCorner: number[]; upperCorner: number[] };
  nativeCRS?: string;
  supportedCRSs: string[];
  formats: string[];
  fields: string[];
  dataType?: string;
  bytesPerSample?: number;
  estimatedSizeMB?: number;
  sizeEstimateAssumption?: string;
  estimateUnavailableReason?: string;
}

const NUMBER_PATTERN = /[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g;

function elements(parent: Document | Element, localName: string): Element[] {
  return Array.from(parent.getElementsByTagName('*')).filter(
    (element) => element.localName.toLowerCase() === localName.toLowerCase()
  );
}

function first(parent: Document | Element, ...localNames: string[]): Element | undefined {
  for (const localName of localNames) {
    const element = elements(parent, localName)[0];
    if (element) return element;
  }
}

function text(element?: Element): string | undefined {
  return element?.textContent?.trim() || undefined;
}

function numbers(value?: string): number[] {
  return (value?.match(NUMBER_PATTERN) || []).map(Number).filter(Number.isFinite);
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

const DATA_TYPE_BYTES: Array<[RegExp, number]> = [
  [/\b(?:u?int8|byte|char|boolean)\b/i, 1],
  [/\b(?:u?int16|short)\b/i, 2],
  [/\b(?:u?int32|integer|int|float32|float)\b/i, 4],
  [/\b(?:u?int64|long|float64|double)\b/i, 8]
];

function detectDataType(doc: Document): { dataType?: string; bytesPerSample?: number } {
  const candidates = elements(doc, 'field')
    .flatMap((field) => [
      field.getAttribute('type') || undefined,
      field.getAttribute('definition') || undefined,
      text(first(field, 'dataType', 'DataType', 'definition'))
    ])
    .filter((value): value is string => Boolean(value));

  // Alguns servidores publicam o tipo apenas em swe:Quantity/@definition.
  for (const quantity of elements(doc, 'Quantity')) {
    const definition = quantity.getAttribute('definition');
    if (definition) candidates.push(definition);
  }

  for (const candidate of candidates) {
    const match = DATA_TYPE_BYTES.find(([pattern]) => pattern.test(candidate));
    if (match) return { dataType: candidate.split(/[\/:#]/).filter(Boolean).at(-1), bytesPerSample: match[1] };
  }
  return {};
}

function parseGridEnvelope(doc: Document): { dimensions?: number[]; axisLabels?: string[] } {
  const envelope = first(doc, 'GridEnvelope');
  if (!envelope) return {};
  const low = numbers(text(first(envelope, 'low')));
  const high = numbers(text(first(envelope, 'high')));
  const dimensions = high.length === low.length && high.length > 0
    ? high.map((value, index) => value - low[index] + 1)
    : undefined;
  const grid = first(doc, 'RectifiedGrid', 'Grid');
  const labels = (text(first(grid || doc, 'axisLabels')) || '').split(/\s+/).filter(Boolean);
  return { dimensions, axisLabels: labels.length ? labels : undefined };
}

function inferDimensionsFromEnvelope(
  boundingBox: IWCSCoverageDetails['boundingBox'],
  offsets?: number[][]
): number[] | undefined {
  if (!boundingBox || !offsets?.length) return undefined;
  const spans = boundingBox.upperCorner.map((upper, index) => Math.abs(upper - boundingBox.lowerCorner[index]));
  const dimensions = offsets.map((vector) => {
    const axis = vector.reduce(
      (largest, value, index) => Math.abs(value) > Math.abs(vector[largest] || 0) ? index : largest,
      0
    );
    const resolution = Math.abs(vector[axis]);
    return resolution && spans[axis] !== undefined ? Math.round(spans[axis] / resolution) + 1 : 0;
  });
  return dimensions.length && dimensions.every((dimension) => dimension > 0) ? dimensions : undefined;
}

function parseFields(doc: Document): string[] {
  const fieldNames = elements(doc, 'field').map((field) =>
    field.getAttribute('name') || text(first(field, 'Identifier', 'label', 'description'))
  );
  const bandKeys = elements(doc, 'AvailableKeys').flatMap((keys) => elements(keys, 'Key').map(text));
  return unique(bandKeys.length ? bandKeys : fieldNames);
}

function parseBoundingBox(doc: Document): IWCSCoverageDetails['boundingBox'] {
  const envelope = first(doc, 'Envelope', 'EnvelopeWithTimePeriod');
  const lowerCorner = numbers(text(first(envelope || doc, 'lowerCorner')));
  const upperCorner = numbers(text(first(envelope || doc, 'upperCorner')));
  return lowerCorner.length && upperCorner.length ? { lowerCorner, upperCorner } : undefined;
}

export function describeCoverage(xmlText: string): IWCSCoverageDetails {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  if (elements(doc, 'parsererror').length) throw new Error('Resposta DescribeCoverage não contém XML válido.');
  if (first(doc, 'Exception', 'ServiceException')) {
    throw new Error(text(first(doc, 'ExceptionText', 'ServiceException')) || 'O serviço recusou DescribeCoverage.');
  }

  const parsedGrid = parseGridEnvelope(doc);
  const dataType = detectDataType(doc);
  const fields = parseFields(doc);
  const grid = first(doc, 'RectifiedGrid', 'Grid');
  const origin = numbers(text(first(grid || doc, 'GridOrigin', 'pos', 'origin')));
  const offsets = [
    ...elements(grid || doc, 'offsetVector'),
    ...elements(grid || doc, 'GridOffsets')
  ].map((element) => numbers(text(element))).filter((values) => values.length);
  const boundingBox = parseBoundingBox(doc);
  const dimensions = parsedGrid.dimensions || inferDimensionsFromEnvelope(boundingBox, offsets);
  const axisLabels = parsedGrid.axisLabels;
  const bandCount = Math.max(fields.length, 1);
  const cellCount = dimensions?.reduce((total, dimension) => total * dimension, 1);
  const bytesPerSampleForEstimate = dataType.bytesPerSample || 4;
  const estimatedSizeMB = cellCount
    ? (cellCount * bandCount * bytesPerSampleForEstimate) / 1_000_000
    : undefined;
  const nativeCRS = text(first(doc, 'GridBaseCRS', 'nativeCRS'))
    || first(doc, 'Envelope')?.getAttribute('srsName')
    || undefined;
  const supportedCRSs = unique([
    ...elements(doc, 'SupportedCRS').map(text),
    ...elements(doc, 'requestResponseCRSs').map(text),
    nativeCRS
  ]);
  const formats = unique([
    ...elements(doc, 'SupportedFormat').map(text),
    ...elements(doc, 'formatSupported').map(text),
    ...elements(doc, 'nativeFormat').map(text)
  ]);

  return {
    dimensions,
    axisLabels,
    gridType: text(first(doc, 'GridType')) || grid?.localName,
    origin: origin.length ? origin : undefined,
    offsets: offsets.length ? offsets : undefined,
    boundingBox,
    nativeCRS,
    supportedCRSs,
    formats,
    fields,
    ...dataType,
    estimatedSizeMB,
    sizeEstimateAssumption: dataType.bytesPerSample
      ? `${bandCount} banda(s) × ${dataType.bytesPerSample} byte(s) por amostra`
      : `${bandCount} banda(s) × 4 bytes por amostra (tipo de dado omitido pelo serviço)`,
    estimateUnavailableReason: estimatedSizeMB
      ? undefined
      : 'dimensões da grade não informadas pelo serviço'
  };
}

export function describeCoverageUrl(serviceUrl: string, version: string, identifier: string): URL {
  const url = new URL(serviceUrl);
  const operationParameters = ['service', 'request', 'version', 'identifier', 'identifiers', 'coverageid'];
  for (const key of [...url.searchParams.keys()]) {
    if (operationParameters.includes(key.toLowerCase())) url.searchParams.delete(key);
  }
  url.searchParams.set('service', 'WCS');
  url.searchParams.set('version', version);
  url.searchParams.set('request', 'DescribeCoverage');
  url.searchParams.set(version.startsWith('2.') ? 'coverageId' : 'identifiers', identifier);
  return url;
}

// Evita disparar centenas de requisições simultâneas ao abrir um catálogo grande.
const MAX_CONCURRENT_REQUESTS = 4;
let activeRequests = 0;
const pendingRequests: Array<() => void> = [];

export async function withWCSRequestLimit<T>(request: () => Promise<T>): Promise<T> {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => pendingRequests.push(resolve));
  }
  activeRequests += 1;
  try {
    return await request();
  } finally {
    activeRequests -= 1;
    pendingRequests.shift()?.();
  }
}

const coverageDetailsCache = new Map<string, Promise<IWCSCoverageDetails>>();

export function cachedCoverageDetails(
  requestUrl: URL,
  request: () => Promise<IWCSCoverageDetails>
): Promise<IWCSCoverageDetails> {
  const key = requestUrl.toString();
  const cached = coverageDetailsCache.get(key);
  if (cached) return cached;
  const pending = withWCSRequestLimit(request).catch((error) => {
    coverageDetailsCache.delete(key);
    throw error;
  });
  coverageDetailsCache.set(key, pending);
  return pending;
}
