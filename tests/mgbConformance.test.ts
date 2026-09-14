import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getRulesForQuadro,
  MGB_QUADROS_INFO,
  evaluateMGBRecord,
  detectMetadataScope
} from '../src/lib/ogc/csw/mgb/mgbConformance.ts';

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
