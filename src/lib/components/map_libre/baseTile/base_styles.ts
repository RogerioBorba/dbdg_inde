export type SourceType =
  | 'vector'
  | 'raster'
  | 'raster-dem'
  | 'geojson'
  | 'video'
  | 'image'
  | 'canvas';
  
export interface ISourceMapLibre {
  ttype: SourceType;
  tiles: string[];
  tileSize: number;
  attribution: string;
}
export interface ILayerMapLibre {
  id: string;
  type: string;
  source: string;
}
export interface LayerConfig {
  version: number;
  idSource: string, 
  sources:  ISourceMapLibre;
  layers: ILayerMapLibre[];
}


type BaseLayerKeys  = "osm" | "stamen" | "esri_world_street" | "esri_imagery";
// Definições de estilos base disponíveis
export const baseLayers: Record<BaseLayerKeys, LayerConfig> = {
  osm: {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster',
        source: 'osm-tiles'
      }
    ]
  },
  stamen: {
    version: 8,
    sources: {
      'stamen-tiles': {
        type: 'raster',
        tiles: ['https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: 'Map tiles by Stamen Design — CC BY 3.0 — Map data © OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'stamen-tiles-layer',
        type: 'raster',
        source: 'stamen-tiles'
      }
    ]
  },
  esri_world_street: {
   version: 8,
    sources: {
      'esri-world-street': {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: 'Tiles © Esri — Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom'
      }
    },
    layers: [
      {
        id: 'esri-world-street-layer',
        type: 'raster',
        source: 'esri-world-street'
      }
    ]
  },
  esri_imagery: {
    version: 8,
    sources: {
      'esri-world-imagery': {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
      }
    },
    layers: [
      {
        id: 'esri-world-imagery-layer',
        type: 'raster',
        source: 'esri-world-imagery'
      }
    ]
  }
};

export function baseLayerNames() {
  // Pegando as chaves com tipagem mais precisa
  return Object.keys(baseLayers) as BaseLayerKeys[];
}