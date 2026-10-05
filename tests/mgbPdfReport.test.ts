// tests/mgbPdfReport.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { generateMGBSemanticPdfReport } from '../src/lib/ai/mgbPdfReport';
import type { MGBSemanticEvaluation } from '../src/lib/ai/types';

const SAMPLE_EVALUATION: MGBSemanticEvaluation = {
    metadataId: 'test-uuid-1234',
    title: 'Aglomerados Rurais do Brasil - BC250 - 2025',
    quadroId: '86',
    quadroTitle: 'Conjunto mínimo de elementos obrigatórios para descrever CDG ou séries do SCN',
    score: 88,
    rating: 'Bom',
    summaryFeedback: 'O metadado apresenta boa qualidade semântica geral, com adequada descrição de feições e linhagem metodológica detalhada.',
    dimensions: [
        { id: 'clareza', name: 'Compreensão e Clareza Descritiva', weight: 30, score: 90, feedback: 'Excelente riqueza descritiva.' },
        { id: 'finalidade', name: 'Finalidade e Aplicabilidade', weight: 20, score: 85, feedback: 'Objetivos claros.' },
        { id: 'indexacao', name: 'Indexação e Descoberta Temática', weight: 20, score: 95, feedback: 'Palavras-chave padronizadas.' },
        { id: 'linhagem', name: 'Qualidade e Linhagem dos Dados', weight: 20, score: 85, feedback: 'Histórico metodológico satisfatório.' },
        { id: 'responsabilidade', name: 'Responsabilidade e Contatos', weight: 10, score: 90, feedback: 'Contatos institucionais completos.' }
    ],
    elementEvaluations: [
        {
            elementId: 10,
            elementName: 'Título do recurso',
            status: 'adequado',
            critique: 'Título contextualizado.',
            currentSnippet: 'Aglomerados Rurais do Brasil - BC250 - 2025'
        },
        {
            elementId: 13,
            elementName: 'Resumo do recurso',
            status: 'adequado',
            critique: 'Resumo completo e abrangente.',
            currentSnippet: 'Contém a representação vetorial...',
            suggestedImprovement: 'Adicionar indicação de escala mínima recomendada.'
        },
        {
            elementId: 25,
            elementName: 'Resolução espacial (Denominador de escala)',
            status: 'adequado',
            critique: 'Escala 1:250000 compatível com SCN.',
            currentSnippet: '1:250000'
        }
    ],
    strengths: ['Boa densidade de palavras-chave.', 'Linhagem com metodologia rastreável.'],
    priorityImprovements: ['Revisar periodicidade de manutenção dos dados.'],
    provider: 'heuristic',
    evaluatedAt: '2026-10-05T19:00:00.000Z'
};

test('generateMGBSemanticPdfReport gera documento PDF com estrutura e páginas corretas', () => {
    const doc = generateMGBSemanticPdfReport(SAMPLE_EVALUATION, 'test-uuid-1234', 'Aglomerados Rurais');

    assert.ok(doc, 'Documento PDF deve ser instanciado');
    const totalPages = doc.getNumberOfPages();
    assert.ok(totalPages >= 1, 'Documento deve conter pelo menos 1 página');

    // Verifica se consegue gerar saída binária ou base64
    const pdfOutput = doc.output('datauristring');
    assert.ok(pdfOutput.startsWith('data:application/pdf'), 'Saída deve ser um Data URI de PDF válido');
});
