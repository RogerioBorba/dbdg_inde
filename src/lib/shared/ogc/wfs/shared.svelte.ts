import type {IWFSGetCapabilities} from '$lib/ogc/wfs/wfsCapabilities';
export const counterWFS = $state<
{   totalLayers: number,  
    totalLayersWithoutMetadata: number, 
    totalWFSProcessado: number, 
    countWFSProcessado: number, 
    currentCapability: IWFSGetCapabilities | null }>
({ totalLayers: 0, 
    totalLayersWithoutMetadata: 0, 
    totalWFSProcessado: 0, 
    countWFSProcessado: 0,
    currentCapability: null });    
