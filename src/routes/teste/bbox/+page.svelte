<script lang="ts">
import { onMount } from 'svelte';

import Map from 'ol/Map.js';
import { transformExtent } from 'ol/proj.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';
import Draw, { createBox } from 'ol/interaction/Draw.js';
let wgs84Extent = $state('')
onMount(async () => {
    const vectorSource = new VectorSource({ wrapX: false });
    const vectorLayer = new VectorLayer({ source: vectorSource });

    const map = new Map({
        target: 'id_map',
        controls:[],
        layers: [new TileLayer({ source: new OSM() }), vectorLayer],
        view: new View({ center: [0, 0], zoom: 2 }),
    });

    const drawBbox = new Draw({
        source: vectorSource,
        type: 'Circle',
        geometryFunction: createBox(),
    });

    drawBbox.on('drawend', (event) => {
        const geometry = event.feature.getGeometry();
        const boundingBoxLayer = event.feature;
        console.log(boundingBoxLayer);
        wgs84Extent = transformExtent(geometry.getExtent(), 'EPSG:3857', 'EPSG:4326');
        // Result format: [minLon, minLat, maxLon, maxLat]
        console.log('BBOX Extent (Map Projection):', wgs84Extent);
        map.removeInteraction(drawBbox);
        //map.removeLayer();
    });

    map.addInteraction(drawBbox);
});
</script>
<div>
<div>Extent: {wgs84Extent}</div>
<div id="id_map" class=" top-0 left-0 inset-0 w-screen h-screen z-0 bg-white/50" aria-hidden="true"></div>

</div>