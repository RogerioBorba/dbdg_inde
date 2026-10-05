import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getRulesForQuadro,
  MGB_QUADROS_INFO,
  evaluateMGBRecord,
  detectMetadataScope
} from '../src/lib/ogc/csw/mgb/mgbConformance';

test('getRulesForQuadro retorna a quantidade correta de elementos obrigatórios por quadro', () => {
  const rules84 = getRulesForQuadro('84');
  const rules85 = getRulesForQuadro('85');
  const rules86 = getRulesForQuadro('86');
  const rules87 = getRulesForQuadro('87');

  assert.equal(rules84.length, 15, 'Quadro 84 deve ter exatamente 15 elementos obrigatórios');
  assert.equal(rules85.length, 20, 'Quadro 85 deve ter exatamente 20 elementos obrigatórios');
  assert.equal(rules86.length, 21, 'Quadro 86 deve ter exatamente 21 elementos obrigatórios');
  assert.equal(rules87.length, 16, 'Quadro 87 deve ter exatamente 16 elementos obrigatórios');
});

test('informações dos quadros MGB 84, 85, 86 e 87 estão corretamente mapeadas', () => {
  assert.ok(MGB_QUADROS_INFO['84'].title.includes('Quadro 84'));
  assert.ok(MGB_QUADROS_INFO['85'].title.includes('Quadro 85'));
  assert.ok(MGB_QUADROS_INFO['86'].title.includes('Quadro 86'));
  assert.ok(MGB_QUADROS_INFO['87'].title.includes('Quadro 87'));
});

test('detectMetadataScope identifica corretamente os diferentes escopos de metadado', () => {
  // 1. Simulação de Geosserviço
  const serviceMock = {
    querySelector(sel: string) {
      if (sel.includes('MD_ScopeCode')) {
        return { getAttribute: () => 'service', textContent: 'service' };
      }
      return null;
    },
    getElementsByTagName() { return []; }
  } as unknown as Element;
  const serviceScope = detectMetadataScope(serviceMock);
  assert.equal(serviceScope.scopeType, 'service');
  assert.equal(serviceScope.recommendedQuadro, '87');

  // 2. Simulação de Produto Geoespacial (CDG / Dataset)
  const datasetMock = {
    querySelector(sel: string) {
      if (sel.includes('MD_ScopeCode')) {
        return { getAttribute: () => 'dataset', textContent: 'dataset' };
      }
      return null;
    },
    getElementsByTagName() { return []; }
  } as unknown as Element;
  const datasetScope = detectMetadataScope(datasetMock);
  assert.equal(datasetScope.scopeType, 'dataset');
  assert.equal(datasetScope.recommendedQuadro, '85');

  // 3. Simulação de Produto Não Geoespacial
  const nonGeoMock = {
    querySelector(sel: string) {
      if (sel.includes('MD_ScopeCode')) {
        return { getAttribute: () => 'nonGeographicDataset', textContent: 'nonGeographicDataset' };
      }
      return null;
    },
    getElementsByTagName() { return []; }
  } as unknown as Element;
  const nonGeoScope = detectMetadataScope(nonGeoMock);
  assert.equal(nonGeoScope.scopeType, 'nonGeographic');
  assert.equal(nonGeoScope.recommendedQuadro, '84');
});

test('evaluateMGBRecord em modo AUTO seleciona o quadro correto pelo escopo', () => {
  const serviceMock = {
    querySelector(sel: string) {
      if (sel.includes('MD_ScopeCode')) {
        return { getAttribute: () => 'service', textContent: 'service' };
      }
      if (sel.includes('title')) {
        return { textContent: 'Geosserviço WMS de Hidrografia' };
      }
      return null;
    },
    getElementsByTagName() { return []; }
  } as unknown as Element;

  const resultAuto = evaluateMGBRecord(serviceMock, 'AUTO');
  assert.equal(resultAuto.quadroId, '87', 'Modo AUTO deve escolher o Quadro 87 para geosserviço');
  assert.equal(resultAuto.totalElements, 16);
});

test('construção do link de visualização de metadado para a rota /metadado', () => {
  const baseIri = 'https://metadados.inde.gov.br/geonetwork/srv/por/csw';
  const identifier = 'ca310739-6d45-4a00-bca0-2d7a424763b4';

  const baseUrl = baseIri.split('?')[0];
  const recordUrl = `${baseUrl}?service=CSW&version=2.0.2&request=GetRecordById&elementSetName=full&outputSchema=csw:IsoRecord&id=${encodeURIComponent(identifier)}`;
  const expectedUrl = 'https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetRecordById&elementSetName=full&outputSchema=csw:IsoRecord&id=ca310739-6d45-4a00-bca0-2d7a424763b4';
  assert.equal(recordUrl, expectedUrl);

  const viewMetadataHref = `/metadado?link=${encodeURIComponent(recordUrl)}`;
  const expectedHref = '/metadado?link=https%3A%2F%2Fmetadados.inde.gov.br%2Fgeonetwork%2Fsrv%2Fpor%2Fcsw%3Fservice%3DCSW%26version%3D2.0.2%26request%3DGetRecordById%26elementSetName%3Dfull%26outputSchema%3Dcsw%3AIsoRecord%26id%3Dca310739-6d45-4a00-bca0-2d7a424763b4';
  assert.equal(viewMetadataHref, expectedHref);
});

test('reconhece código de caracteres do metadado e dos dados via atributo codeListValue', () => {
  const mockElement = {
    querySelector(sel: string) {
      if (sel.includes('MD_CharacterSetCode')) {
        return {
          getAttribute(attr: string) {
            if (attr === 'codeListValue') return 'utf8';
            return null;
          },
          textContent: ''
        };
      }
      return null;
    },
    getElementsByTagName() {
      return [];
    }
  } as unknown as Element;

  const rules84 = getRulesForQuadro('84');
  const rule3 = rules84.find((r) => r.id === 3)!;
  const result3 = rule3.check(mockElement);
  assert.equal(result3.compliant, true);
  assert.equal(result3.value, 'utf8');
});
<<<<<<< HEAD

test('cálculo de parâmetros de amostragem e paginação para catálogos com grande volume', () => {
  // Simulação de catálogo volumoso (ex: IBGE com 22.000 registros)
  const totalInCatalog = 22000;
  const PAGE_SIZE = 20;

  // Caso 1: Usuário informou início 101 e limite de 50 registros
  const userStart = 101;
  const userLimit = 50;
  const startPos = (userStart && userStart > 0) ? Math.floor(userStart) : 1;
  assert.equal(startPos, 101);

  let loaded = 0;
  let currentStart = startPos;
  while (loaded < userLimit) {
    const remaining = userLimit - loaded;
    const batchSize = Math.min(PAGE_SIZE, remaining);
    assert.ok(batchSize <= 20);
    assert.ok(batchSize <= remaining);
    loaded += batchSize;
    currentStart += batchSize;
  }
  assert.equal(loaded, 50, 'Deve ter avaliado exatamente o limite solicitado (50)');
  assert.equal(currentStart, 151, 'Posição final deve avançar exatamente 50 posições');

  // Caso 2: Usuário não informou parâmetros (avaliação completa de todos os registros)
  const emptyStart = null;
  const emptyLimit = null;
  const defaultStart = (emptyStart && emptyStart > 0) ? Math.floor(emptyStart) : 1;
  assert.equal(defaultStart, 1, 'Início padrão deve ser 1');
  const targetAll = emptyLimit !== null ? emptyLimit : totalInCatalog;
  assert.equal(targetAll, 22000, 'Deve visar a totalidade do catálogo');
});

=======
>>>>>>> 049489398e5e86a05609f21ec4400f9605ffe0a9
