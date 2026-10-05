// tests/mgbSemanticAgent.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {
    extractSemanticDataFromXml,
    evaluateMetadataHeuristically
} from '../src/lib/ai/mgbSemanticEvaluator';
import { buildSemanticPrompt, MGB_AI_SYSTEM_PROMPT } from '../src/lib/ai/mgbSemanticPrompts';

// XML de teste representativo de um metadado completo do IBGE (BC250 Aglomerado Rural)
const SAMPLE_IBGE_BC250_XML = `<?xml version="1.0" encoding="UTF-8"?>
<gmd:MD_Metadata xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco">
  <gmd:fileIdentifier>
    <gco:CharacterString>f398d323-8ed0-431f-b349-695f085e7ab0</gco:CharacterString>
  </gmd:fileIdentifier>
  <gmd:contact>
    <gmd:CI_ResponsibleParty>
      <gmd:organisationName>
        <gco:CharacterString>Instituto Brasileiro de Geografia e Estatistica - IBGE</gco:CharacterString>
      </gmd:organisationName>
      <gmd:electronicMailAddress>
        <gco:CharacterString>ibge@ibge.gov.br</gco:CharacterString>
      </gmd:electronicMailAddress>
      <gmd:role>
        <gmd:CI_RoleCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#CI_RoleCode" codeListValue="custodian">custodian</gmd:CI_RoleCode>
      </gmd:role>
    </gmd:CI_ResponsibleParty>
  </gmd:contact>
  <gmd:identificationInfo>
    <gmd:MD_DataIdentification>
      <gmd:citation>
        <gmd:CI_Citation>
          <gmd:title>
            <gco:CharacterString>Aglomerados Rurais - Base Cartografica Continua do Brasil - BC250 - 2025</gco:CharacterString>
          </gmd:title>
        </gmd:CI_Citation>
      </gmd:citation>
      <gmd:abstract>
        <gco:CharacterString>Contem a representacao vetorial dos aglomerados rurais no territorio brasileiro, mapeados a partir de imagens de satelite e pesquisas censitarias do IBGE, compondo a Base Cartografica Continua do Brasil na escala 1:250.000 (BC250), edicao 2025.</gco:CharacterString>
      </gmd:abstract>
      <gmd:purpose>
        <gco:CharacterString>Subsidiar o planejamento publico, analises demograficas e a gestao territorial integrada no âmbito do Sistema Cartografico Nacional.</gco:CharacterString>
      </gmd:purpose>
      <gmd:pointOfContact>
        <gmd:CI_ResponsibleParty>
          <gmd:organisationName>
            <gco:CharacterString>IBGE - Diretoria de Geociencias</gco:CharacterString>
          </gmd:organisationName>
          <gmd:electronicMailAddress>
            <gco:CharacterString>ccte@ibge.gov.br</gco:CharacterString>
          </gmd:electronicMailAddress>
          <gmd:role>
            <gmd:CI_RoleCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#CI_RoleCode" codeListValue="author">author</gmd:CI_RoleCode>
          </gmd:role>
        </gmd:CI_ResponsibleParty>
      </gmd:pointOfContact>
      <gmd:descriptiveKeywords>
        <gmd:MD_Keywords>
          <gmd:keyword><gco:CharacterString>cartografia</gco:CharacterString></gmd:keyword>
          <gmd:keyword><gco:CharacterString>aglomerado rural</gco:CharacterString></gmd:keyword>
          <gmd:keyword><gco:CharacterString>BC250</gco:CharacterString></gmd:keyword>
          <gmd:keyword><gco:CharacterString>IBGE</gco:CharacterString></gmd:keyword>
          <gmd:keyword><gco:CharacterString>base vetorial</gco:CharacterString></gmd:keyword>
        </gmd:MD_Keywords>
      </gmd:descriptiveKeywords>
      <gmd:spatialRepresentationType>
        <gmd:MD_SpatialRepresentationTypeCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#MD_SpatialRepresentationTypeCode" codeListValue="vector">vector</gmd:MD_SpatialRepresentationTypeCode>
      </gmd:spatialRepresentationType>
      <gmd:spatialResolution>
        <gmd:MD_Resolution>
          <gmd:equivalentScale>
            <gmd:MD_RepresentativeFraction>
              <gmd:denominator>
                <gco:Integer>250000</gco:Integer>
              </gmd:denominator>
            </gmd:MD_RepresentativeFraction>
          </gmd:equivalentScale>
        </gmd:MD_Resolution>
      </gmd:spatialResolution>
      <gmd:topicCategory>
        <gmd:MD_TopicCategoryCode>location</gmd:MD_TopicCategoryCode>
      </gmd:topicCategory>
    </gmd:MD_DataIdentification>
  </gmd:identificationInfo>
  <gmd:dataQualityInfo>
    <gmd:DQ_DataQuality>
      <gmd:lineage>
        <gmd:LI_Lineage>
          <gmd:statement>
            <gco:CharacterString>Os dados foram extraidos e compatibilizados segundo a modelagem da EDGV 3.0 pelo IBGE, utilizando insumos orbitais RapidEye e Sentinel-2, com posterior checagem topologica e validacao das feicoes em ambiente SIG.</gco:CharacterString>
          </gmd:statement>
        </gmd:LI_Lineage>
      </gmd:lineage>
    </gmd:DQ_DataQuality>
  </gmd:dataQualityInfo>
</gmd:MD_Metadata>`;

// XML com conteúdo mínimo e deficiente (sem resumo, sem linhagem, sem finalidade)
const POOR_METADATA_XML = `<?xml version="1.0" encoding="UTF-8"?>
<gmd:MD_Metadata xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco">
  <gmd:fileIdentifier>
    <gco:CharacterString>bad-record-001</gco:CharacterString>
  </gmd:fileIdentifier>
  <gmd:identificationInfo>
    <gmd:MD_DataIdentification>
      <gmd:citation>
        <gmd:CI_Citation>
          <gmd:title>
            <gco:CharacterString>Dados</gco:CharacterString>
          </gmd:title>
        </gmd:CI_Citation>
      </gmd:citation>
      <gmd:abstract>
        <gco:CharacterString></gco:CharacterString>
      </gmd:abstract>
    </gmd:MD_DataIdentification>
  </gmd:identificationInfo>
</gmd:MD_Metadata>`;

test('extractSemanticDataFromXml extrai corretamente os campos semânticos do XML', () => {
    const extracted = extractSemanticDataFromXml(SAMPLE_IBGE_BC250_XML);

    assert.equal(extracted.identifier, 'f398d323-8ed0-431f-b349-695f085e7ab0');
    assert.ok(extracted.title.includes('Aglomerados Rurais'));
    assert.ok(extracted.abstractText.includes('representacao vetorial'));
    assert.ok(extracted.purpose.includes('planejamento publico'));
    assert.equal(extracted.keywords.length, 5);
    assert.ok(extracted.keywords.includes('BC250'));
    assert.ok(extracted.lineage.length > 0);
    assert.ok(extracted.lineage[0].includes('EDGV 3.0'));
    assert.equal(extracted.scaleDenominator, '250000');
    assert.equal(extracted.spatialRepresentation, 'vector');
    assert.ok(extracted.topicCategories.includes('location'));
});

test('evaluateMetadataHeuristically avalia metadado completo com nota alta e diagnóstico positivo', () => {
    const extracted = extractSemanticDataFromXml(SAMPLE_IBGE_BC250_XML);
    const evaluation = evaluateMetadataHeuristically(extracted, '86');

    assert.equal(evaluation.quadroId, '86');
    assert.ok(evaluation.score >= 80, `Esperado score >= 80, obtido: ${evaluation.score}`);
    assert.ok(evaluation.rating === 'Excelente' || evaluation.rating === 'Bom');
    assert.equal(evaluation.dimensions.length, 5);

    // Soma dos pesos deve ser 100%
    const sumWeights = evaluation.dimensions.reduce((acc, d) => acc + d.weight, 0);
    assert.equal(sumWeights, 100, 'A soma dos pesos das dimensões deve ser exatamente 100%');

    // Validação dos elementos do Quadro MGB
    const el10 = evaluation.elementEvaluations.find((e) => e.elementId === 10);
    assert.ok(el10);
    assert.equal(el10?.status, 'adequado');

    const el13 = evaluation.elementEvaluations.find((e) => e.elementId === 13);
    assert.ok(el13);
    assert.equal(el13?.status, 'adequado');

    const el25 = evaluation.elementEvaluations.find((e) => e.elementId === 25);
    assert.ok(el25, 'Quadro 86 deve avaliar o elemento 25 (Resolução espacial)');
    assert.equal(el25?.status, 'adequado');

    assert.ok(evaluation.strengths.length > 0);
});

test('evaluateMetadataHeuristically reprova metadado deficiente e gera sugestões acionáveis', () => {
    const extracted = extractSemanticDataFromXml(POOR_METADATA_XML);
    const evaluation = evaluateMetadataHeuristically(extracted, '85');

    assert.equal(evaluation.quadroId, '85');
    assert.ok(evaluation.score < 50, `Esperado score < 50 para metadado deficiente, obtido: ${evaluation.score}`);
    assert.equal(evaluation.rating, 'Insuficiente');

    // Elemento 13 (Resumo) deve estar inadequado e com sugestão
    const el13 = evaluation.elementEvaluations.find((e) => e.elementId === 13);
    assert.ok(el13);
    assert.equal(el13?.status, 'inadequado');
    assert.ok(el13?.suggestedImprovement, 'Deve conter sugestão para resumo ausente');

    // Elemento 17 (Palavras-chave)
    const el17 = evaluation.elementEvaluations.find((e) => e.elementId === 17);
    assert.ok(el17);
    assert.equal(el17?.status, 'inadequado');

    // Deve haver ações prioritárias de melhoria
    assert.ok(evaluation.priorityImprovements.length > 0);
});

test('buildSemanticPrompt e MGB_AI_SYSTEM_PROMPT contêm instruções normativas do MGB 2.0', () => {
    assert.ok(MGB_AI_SYSTEM_PROMPT.includes('Quadro 84'));
    assert.ok(MGB_AI_SYSTEM_PROMPT.includes('Quadro 85'));
    assert.ok(MGB_AI_SYSTEM_PROMPT.includes('Quadro 86'));
    assert.ok(MGB_AI_SYSTEM_PROMPT.includes('Quadro 87'));
    assert.ok(MGB_AI_SYSTEM_PROMPT.includes('Compreensão e Clareza Descritiva'));

    const prompt = buildSemanticPrompt(
        {
            identifier: 'test-123',
            title: 'Metadado Teste',
            abstractText: 'Descricao teste',
            keywords: ['geo', 'teste']
        },
        '85'
    );

    assert.ok(prompt.includes('Quadro 85'));
    assert.ok(prompt.includes('test-123'));
    assert.ok(prompt.includes('Metadado Teste'));
});
