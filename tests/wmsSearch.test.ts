import assert from 'node:assert/strict';
import test from 'node:test';
import {
  flattenLayers,
  hasWMSAvailable,
  hasWMSGetCapabilities,
  matchesLayerKeywords,
  parseSearchTerms,
  sortWMSResults
} from '../src/lib/components/openlayers/wms/wmsSearch.ts';

test('reconhece disponibilidade de WMS do catálogo', () => {
  const catalog = {
    descricao: 'IBGE',
    nivel_no: '1',
    wcsAvalaible: false,
    wcsGetCapabilities: '',
    wfsAvailable: false,
    wfsGetCapabilities: '',
    wmsAvalaible: true,
    wmsAvailable: true,
    wmsGetCapabilities: 'https://example.test/wms'
  };

  assert.equal(hasWMSAvailable(catalog), true);
  assert.equal(hasWMSGetCapabilities(catalog), true);
});

test('achata árvore de camadas WMS recursivamente', () => {
  const tree = [
    {
      name: 'root',
      title: 'Root',
      layers: [
        { name: 'child1', title: 'Child 1' },
        {
          name: 'child2',
          title: 'Child 2',
          layers: [{ name: 'grandchild', title: 'Grandchild' }]
        }
      ]
    }
  ];

  const flattened = flattenLayers(tree);
  assert.equal(flattened.length, 4);
  assert.deepEqual(flattened.map((l) => l.name), ['root', 'child1', 'child2', 'grandchild']);
});

test('busca palavras-chave de camada WMS com operadores OU e E', () => {
  const layer = {
    name: 'ferrovia',
    title: 'Linhas Ferroviárias',
    keywords: ['Ferrovia', 'Transporte Ferroviário', 'Brasil']
  };

  const termsOr = parseSearchTerms('ferroviario, rodovia');
  assert.equal(matchesLayerKeywords(layer, termsOr, 'OR'), true);

  const termsAndPass = parseSearchTerms('ferrovia, brasil');
  assert.equal(matchesLayerKeywords(layer, termsAndPass, 'AND'), true);

  const termsAndFail = parseSearchTerms('ferrovia, rodovia');
  assert.equal(matchesLayerKeywords(layer, termsAndFail, 'AND'), false);
});

test('ordena resultados WMS em ordem alfabética por título ou nome de camada', () => {
  const items = [
    { catalog: { descricao: 'IBGE' }, layer: { name: 'camada_z', title: 'Zoológico' } },
    { catalog: { descricao: 'ANA' }, layer: { name: 'camada_a', title: 'Águas' } },
    { catalog: { descricao: 'CPRM' }, layer: { name: 'camada_b', title: 'Barragens' } },
    { catalog: { descricao: 'DNIT' }, layer: { name: 'camada_a2', title: 'Águas' } }
  ];

  const sorted = sortWMSResults(items);
  assert.deepEqual(
    sorted.map((item) => `${item.layer.title} (${item.catalog.descricao})`),
    [
      'Águas (ANA)',
      'Águas (DNIT)',
      'Barragens (CPRM)',
      'Zoológico (IBGE)'
    ]
  );
});
