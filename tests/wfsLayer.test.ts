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

test('unsupported service version is replaced with a valid WFS version', () => {
  const layer = new WFSLayer(
    { name: 'CCAR:area_pub_militar', title: 'Área pública militar' },
    'https://example.test/geoserver/CCAR/ows?service=WFS&version=1.3.0&request=GetCapabilities'
  );

  const url = new URL(layer.urlGetFeatureCount()!);

  assert.equal(url.searchParams.get('version'), '2.0.0');
  assert.equal(url.searchParams.get('typeNames'), 'CCAR:area_pub_militar');
  assert.equal(url.searchParams.get('resultType'), 'hits');
});
