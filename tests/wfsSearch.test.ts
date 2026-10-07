import assert from 'node:assert/strict';
import test from 'node:test';
import {
  containsBounds,
  geographicBounds,
  hasWFSAvailable,
  hasWFSGetCapabilities,
  matchesFeatureTypeKeywords,
  parseSearchTerms,
  sortWFSResults
} from '../src/lib/components/openlayers/wfs/wfsSearch.ts';

test('reconhece o campo de disponibilidade devolvido pela API da INDE', () => {
  const catalog = {
    descricao: 'IBGE', nivel_no: '1', wcsAvalaible: false, wcsGetCapabilities: '',
    wfsAvailable: true, wfsGetCapabilities: 'https://example.test/wfs',
    wmsAvalaible: false, wmsGetCapabilities: ''
  };

  assert.equal(hasWFSAvailable(catalog), true);
});

test('considera o GetCapabilities WFS como fonte de verdade para listar instituições', () => {
  assert.equal(hasWFSGetCapabilities({ wfsGetCapabilities: 'https://example.test/wfs' }), true);
  assert.equal(hasWFSGetCapabilities({ wfsGetCapabilities: '  ' }), false);
});

test('busca palavras-chave do FeatureType com operadores OU e E', () => {
  const featureType = { name: 'hidro:rios', title: 'Rios', keywords: ['Recursos Hídricos', 'Brasil'] };
  const terms = parseSearchTerms('hidricos, vegetação');

  assert.equal(matchesFeatureTypeKeywords(featureType, terms, 'OR'), true);
  assert.equal(matchesFeatureTypeKeywords(featureType, terms, 'AND'), false);
});

test('ordena resultados WFS em ordem alfabética por título ou nome de camada', () => {
  const items = [
    { catalog: { descricao: 'IBGE' }, featureType: { name: 'camada_z', title: 'Zoológico' } },
    { catalog: { descricao: 'ANA' }, featureType: { name: 'camada_a', title: 'Águas' } },
    { catalog: { descricao: 'CPRM' }, featureType: { name: 'camada_b', title: 'Barragens' } },
    { catalog: { descricao: 'DNIT' }, featureType: { name: 'camada_a2', title: 'Águas' } }
  ];

  const sorted = sortWFSResults(items);
  assert.deepEqual(
    sorted.map((item) => `${item.featureType.title} (${item.catalog.descricao})`),
    [
      'Águas (ANA)',
      'Águas (DNIT)',
      'Barragens (CPRM)',
      'Zoológico (IBGE)'
    ]
  );
});

test('busca espacial inclui somente FeatureTypes contidos no retângulo', () => {
  const search = { west: -74, south: -34, east: -34, north: 6 };
  const inside = geographicBounds({ lowerCorner: [-50, -20], upperCorner: [-40, -10] });
  const crossing = geographicBounds({ lowerCorner: [-80, -20], upperCorner: [-40, -10] });

  assert.ok(inside);
  assert.ok(crossing);
  assert.equal(containsBounds(search, inside), true);
  assert.equal(containsBounds(search, crossing), false);
});

