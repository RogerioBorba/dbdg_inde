import assert from 'node:assert/strict';
import test from 'node:test';
import { WFSLayer } from '../src/lib/components/openlayers/wfs/wfsLayer.ts';

test('GetFeature GeoJSON is requested in the viewer interchange projection', () => {
  const layer = new WFSLayer(
    {
      name: 'anp:bacias_sedimentares',
      title: 'Bacias Sedimentares',
      defaultCRS: 'urn:ogc:def:crs:EPSG::4674'
    },
    'https://example.test/geoserver/ows?service=WFS&version=2.0.0&request=GetCapabilities'
  );

  const url = new URL(layer.urlGetFeature());

  assert.equal(url.searchParams.get('srsName'), 'EPSG:4326');
  assert.equal(url.searchParams.get('outputFormat'), 'application/json');
});
