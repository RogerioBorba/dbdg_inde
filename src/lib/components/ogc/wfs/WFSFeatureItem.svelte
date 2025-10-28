<script lang="ts">
  import type { IFeatureType } from './wfsFeature';
  import { mapper } from '$lib/shared/map_libre/shared.svelte';

  let { feature, serviceUrl } = $props<{
    feature: IFeatureType;
    serviceUrl: string;
  }>();

  let loading = $state(false);

  async function includeFeature() {
    if (!feature?.name || !serviceUrl) {
      alert('Feature sem name ou serviço inválido.');
      return;
    }

    const map = mapper.map;
    if (!map) {
      alert('Mapa não inicializado.');
      return;
    }

    // sanitize id (evita % e caracteres estranhos)
    const safeName = (feature.name || '').replace(/[^a-z0-9-_]/gi, '_');
    const sourceId = `wfs-feature-${safeName}`;
    const layerId = `wfs-feature-layer-${safeName}`;

    if (map.getSource(sourceId) || map.getLayer(layerId)) {
      alert(`A feature "${feature.title ?? feature.name}" já foi adicionada.`);
      return;
    }

    loading = true;
    try {
      const baseUrl = serviceUrl.split('?')[0];
      const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: feature.name,
        outputFormat: 'application/json',
        // pedir GeoJSON em lon/lat (EPSG:4326) — MapLibre espera lon/lat
        srsName: 'EPSG:4326'
      });

      const url = `${baseUrl}?${params.toString()}`;
      console.log('WFS GetFeature URL:', url);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`WFS request failed: ${resp.status}`);

      const geojson = await resp.json();
      //console.log('WFS geojson:', geojson);

      if (!geojson || !geojson.type || !geojson.features || geojson.features.length === 0) {
        alert('Nenhum recurso retornado pelo WFS.');
        return;
      }

      // add geojson source
      try {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson,
         
        });
      } catch (e) {
        console.error('addSource error', e);
        throw e;
      }

      // decide layer type by first feature geometry
      const geomType = geojson.features[0]?.geometry?.type ?? 'Unknown';
      let layerDef: any;
      if (geomType.includes('Point')) {
        layerDef = {
          id: layerId,
          type: 'circle',
          source: sourceId,
          paint: { 'circle-radius': 6, 'circle-color': '#FF5722' }
        };
      } else if (geomType.includes('Line')) {
        layerDef = {
          id: layerId,
          type: 'line',
          source: sourceId,
          paint: { 'line-color': '#4CAF50', 'line-width': 2 }
        };
      } else {
        // polygons / multipolygons
        layerDef = {
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: { 'fill-color': '#3B82F6', 'fill-opacity': 0.35 }
        };
        // add outline layer (optional)
        try {
          map.addLayer({
            id: `${layerId}-outline`,
            type: 'line',
            source: sourceId,
            paint: { 'line-color': '#1E40AF', 'line-width': 1.5 }
          });
        } catch (e) {
          console.warn('outline layer add failed', e);
        }
      }

      // add main layer (tenta inserir antes de symbol, senão adiciona no fim)
      try {
        const beforeId = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;
        map.addLayer(layerDef, beforeId);
      } catch (e) {
        console.error('addLayer error', e);
        throw e;
      }

      // compute bbox and zoom to layer to ensure visibility
      try {
        const bounds = computeGeoJSONBBox(geojson);
        if (bounds) {
          map.fitBounds([[bounds.minX, bounds.minY], [bounds.maxX, bounds.maxY]], { padding: 40, maxZoom: 16 });
        }
      } catch (e) {
        console.warn('fitBounds failed', e);
      }

    } catch (err: any) {
      console.error('Erro ao adicionar feature WFS:', err);
      alert(err?.message ?? String(err));
    } finally {
      loading = false;
    }
  }

  // pequena função para calcular bbox de um GeoJSON (lon/lat)
  function computeGeoJSONBBox(geojson: any) {
    if (!geojson || !geojson.features || geojson.features.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const coordsIter = (coords: any) => {
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        const x = coords[0], y = coords[1];
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      } else {
        for (const c of coords) coordsIter(c);
      }
    };
    for (const f of geojson.features) {
      if (!f.geometry) continue;
      coordsIter(f.geometry.coordinates);
    }
    if (!isFinite(minX)) return null;
    return { minX, minY, maxX, maxY };
  }
</script>

<div class="flex items-center justify-between py-1 border-b border-gray-100">
  <div class="text-sm text-gray-800 truncate">{feature.title ?? feature.name}</div>
  <div class="flex items-center gap-1">
    <button
      type="button"
      class="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
      title="Incluir feature no mapa"
      onclick={includeFeature}
      aria-label="Incluir feature"
      disabled={loading}
    >
      <!-- ícone de camadas simples -->
      <svg class="w-4 h-4 inline-block mr-1" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2L1 7l11 5 11-5L12 2zm0 7l9 4-9 4-9-4 9-4z"/>
      </svg>
      {#if loading}Carregando...{:else}Incluir{/if}
    </button>
  </div>
</div>

<style>
  :global(.truncate) { max-width: 18rem; }
</style>