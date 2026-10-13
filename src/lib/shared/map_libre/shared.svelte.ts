import { baseLayers } from '#lib/components/map_libre/baseTile/base_styles.js';
import maplibregl from 'maplibre-gl';
import type { LayerConfig } from '#lib/components/map_libre/baseTile/base_styles.js';
export const mapper = $state<{ map: maplibregl.Map | null }>({ map: null});
const style = baseLayers['osm'];
export let current_styler = $state<{style: LayerConfig}>({style: style});
