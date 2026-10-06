// src/lib/ai/types.ts
/**
 * Tipos e contratos de domínio para o Agente de IA avaliador semântico de metadados
 * em conformidade com o Perfil MGB 2.0 (Perfil de Metadados Geoespaciais do Brasil).
 */

import type { MGBEffectiveQuadroId, MGBQuadroId } from '$lib/ogc/csw/mgb/mgbConformance';

export type MGBSemanticDimensionKey =
    | 'clareza'
    | 'temporal'
    | 'finalidade'
    | 'indexacao'
    | 'linhagem'
    | 'responsabilidade';

export interface MGBSemanticDimensionScore {
    id: MGBSemanticDimensionKey;
    name: string;
    weight: number; // percentual de peso (ex: 30 para 30%)
    score: number; // 0 a 100
    feedback: string;
}

export type MGBAIEvaluationRating = 'Excelente' | 'Bom' | 'Regular' | 'Insuficiente';

export type MGBElementSemanticStatus = 'adequado' | 'parcial' | 'inadequado';

export interface MGBElementSemanticEvaluation {
    elementId: number;
    elementName: string;
    status: MGBElementSemanticStatus;
    critique: string;
    currentSnippet?: string;
    suggestedImprovement?: string;
}

export interface MGBSemanticEvaluation {
    metadataId?: string;
    title?: string;
    quadroId: MGBEffectiveQuadroId;
    quadroTitle: string;
    score: number; // 0 a 100
    rating: MGBAIEvaluationRating;
    summaryFeedback: string;
    dimensions: MGBSemanticDimensionScore[];
    elementEvaluations: MGBElementSemanticEvaluation[];
    strengths: string[];
    priorityImprovements: string[];
    provider: 'gemini' | 'openai' | 'heuristic';
    model?: string;
    evaluatedAt: string;
}

export interface MGBAIEvaluationRequest {
    metadataXml?: string;
    metadataId?: string;
    catalogIri?: string;
    metadataUrl?: string;
    quadroId?: MGBQuadroId;
    provider?: 'auto' | 'gemini' | 'openai' | 'heuristic';
    apiKey?: string;
    apiEndpoint?: string;
    modelName?: string;
}

export interface MGBAIEvaluationResponse {
    success: boolean;
    evaluation?: MGBSemanticEvaluation;
    error?: string;
}
