<script>
  import { onMount } from 'svelte';
  import 'ol/ol.css';

  const geojsonObject = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { tipo: "rodovia", nome: "BR-101" },
        geometry: { type: "LineString", coordinates: [[-42.0, -22.9], [-41.8, -22.7], [-41.5, -22.5], [-41.2, -22.4]] }
      },
      {
        type: "Feature",
        properties: { tipo: "ferrovia", nome: "Linha 1" },
        geometry: { type: "LineString", coordinates: [[-42.1, -22.8], [-41.7, -22.6], [-41.4, -22.3]] }
      },
      {
        type: "Feature",
        properties: { tipo: "trilha", nome: "Caminho da Serra" },
        geometry: { type: "LineString", coordinates: [[-41.9, -22.85], [-41.75, -22.75], [-41.6, -22.65], [-41.45, -22.55]] }
      }
    ]
  };

  onMount(async () => {
    // Import dinâmico de TODOS os módulos necessários
    const [
      { default: Map },
      { default: View },
      { default: VectorLayer },
      { default: VectorSource },
      { default: GeoJSON },
      { default: Style },
      { default: Stroke },
      { default: Fill },
      { default: Text },
      { default: TileLayer },   // <--- novo
      { default: OSM },         // <--- novo
      { fromLonLat }
    ] = await Promise.all([
      import('ol/Map'),
      import('ol/View'),
      import('ol/layer/Vector'),
      import('ol/source/Vector'),
      import('ol/format/GeoJSON'),
      import('ol/style/Style'),
      import('ol/style/Stroke'),
      import('ol/style/Fill'),
      import('ol/style/Text'),
      import('ol/layer/Tile'),   // camada de tiles (OSM)
      import('ol/source/OSM'),   // fonte OpenStreetMap
      import('ol/proj')
    ]);

    const styleFunction = (feature) => {
      const tipo = feature.get('tipo');
      let stroke;

      switch (tipo) {
        case 'rodovia':
          stroke = new Stroke({ color: '#dc2626', width: 6 });
          break;
        case 'ferrovia':
          stroke = new Stroke({ color: '#1f2937', width: 4, lineDash: [10, 10] });
          break;
        case 'trilha':
          stroke = new Stroke({ color: '#92400e', width: 3, lineDash: [6, 8], lineCap: 'butt' });
          break;
        default:
          stroke = new Stroke({ color: '#6b7280', width: 2 });
      }

      return new Style({
        stroke,
        text: new Text({
          text: feature.get('nome'),
          font: 'bold 14px Inter, sans-serif',
          fill: new Fill({ color: '#1f2937' }),
          stroke: new Stroke({ color: '#ffffff', width: 3 }),
          offsetY: -15,
          placement: 'line'
        })
      });
    };

    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(geojsonObject, {
        featureProjection: 'EPSG:3857'
      })
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: styleFunction
    });

    // Camada base OSM
    const osmLayer = new TileLayer({
      source: new OSM()
    });

    const map = new Map({
      target: 'map',
      layers: [osmLayer, vectorLayer],
      view: new View({
        center: fromLonLat([-41.7, -22.7]),
        zoom: 10
      })
    });

    // Legenda
    const legend = document.getElementById('legend');
    legend.innerHTML = `
      <div class="bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg mb-2">Legenda</h3>
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <div class="w-12 h-1 bg-red-600"></div><span>Rodovia</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-12 h-1 bg-gray-800 border-t-4 border-t-gray-800" style="border-style: dashed;"></div><span>Ferrovia</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-12 h-1 border-t-4 border-t-amber-800 border-dashed"></div><span>Trilha</span>
          </div>
        </div>
      </div>
    `;
  });
</script>

<svelte:head>
  <title>OpenLayers + Svelte + Tailwind</title>
  <link href="https://rsms.me/inter/inter.css" rel="stylesheet">
</svelte:head>

<div class="relative w-full h-screen bg-gray-100">
  <div id="map" class="w-full h-full"></div>

  <div id="legend" class="absolute bottom-4 left-4 z-10"></div>

  <div class="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur rounded-xl shadow-2xl px-6 py-3 text-center">
    <h1 class="text-2xl font-bold text-gray-800">Linhas estilizadas com OpenLayers</h1>
    <p class="text-sm text-gray-600">Rodovias, ferrovias e trilhas com estilos diferentes</p>
  </div>
</div>

<style>
  :global(#map) { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
</style>