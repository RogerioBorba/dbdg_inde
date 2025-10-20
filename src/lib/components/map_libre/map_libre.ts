interface TileLayer {
    id: string;
    tiles: [string];
}

export const None: TileLayer = {
    id: 'none',
    tiles: ['']
};

export const Osm: TileLayer = {
    id: 'osm',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png']
};

export const Esri_world_street: TileLayer = {
            id: 'esri_world_street',
            tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}']
};

export const recordTileLayer: Record<string, TileLayer> = {
    'none': None,
    'osm': Osm,
    'esri_world_street': Esri_world_street       
};

export function addBaseLayer(map: maplibregl.Map | null | undefined, tileLayer: TileLayer) {
    // Verificação mais rigorosa
    if (!map?.getLayer) {
        console.error("addBaseLayer>> Map não está disponível ou não é válido", map);
        return;
    }
    
    try {
    
        map.addSource(tileLayer.id, {
            type: 'raster',
            tiles: tileLayer.tiles,
            tileSize: 256
        });
        
        map.addLayer({
            id: tileLayer.id,
            type: 'raster',
            source: tileLayer.id,
            paint: {}
        });
        
        console.log("addBaseLayer>> Camada adicionada com sucesso:", tileLayer.id);
    } catch (error) {
        console.error("addBaseLayer>> Erro ao adicionar camada:", error);
    }
}

export function removeLayer(map: maplibregl.Map | null | undefined, currentBaseId: string | null) {
    if (!map || typeof map !== 'object' || typeof map.getLayer !== 'function' || !currentBaseId) {
        return;
    }
    
    try {
        if (map.getLayer(currentBaseId)) {
            map.removeLayer(currentBaseId);
        }
        if (map.getSource(currentBaseId)) {
            map.removeSource(currentBaseId);
        }
    } catch (error) {
        console.error("removeLayer>> Erro ao remover camada:", error);
    }
}