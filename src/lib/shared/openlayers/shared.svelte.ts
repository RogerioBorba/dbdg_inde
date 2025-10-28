import Map from 'ol/Map.js';
import { FacadeOL } from '$lib/components/openlayers/facade_openlayers';
export const mapper_ol = $state<{ map: Map | null, facadeOL: FacadeOL | null }>({ map: null, facadeOL: null});
