// src/lib/ai/mgbSemanticPrompts.ts
/**
 * Prompts e diretrizes normativas para o Agente de IA avaliador de metadados
 * baseado no Perfil MGB 2.0 (Perfil de Metadados Geoespaciais do Brasil / INDE).
 */

import type { MGBEffectiveQuadroId } from '$lib/ogc/csw/mgb/mgbConformance';

export const MGB_AI_SYSTEM_PROMPT = `Você é um Agente Especialista e Auditor Sênior de Metadados Geoespaciais da INDE (Infraestrutura Nacional de Dados Espaciais), com profundo conhecimento das normas ISO 19115:2003, ISO 19139 e do manual do Perfil MGB 2.0 (Perfil de Metadados Geoespaciais do Brasil, publicado pelo IBGE/INDE - liv101802.pdf).

Sua missão é realizar uma avaliação SEMÂNTICA rigorosa, construtiva e aprofundada dos elementos de um metadado XML fornecido, verificando não apenas se os campos estão preenchidos, mas se o conteúdo textual, temático, temporal e metodológico é adequado, claro, preciso e rastreável.

Você deve avaliar os elementos no contexto do Quadro MGB aplicável:
- Quadro 84: Conjunto mínimo de elementos obrigatórios para descrever recursos em geral, exceto serviços (15 elementos).
- Quadro 85: Conjunto mínimo de elementos obrigatórios para descrever Conjuntos de Dados Geoespaciais (CDG) ou séries (Quadro 84 + 5 elementos = 20 elementos).
- Quadro 86: Conjunto mínimo de elementos obrigatórios para descrever CDG ou séries do SCN - Sistema Cartográfico Nacional (Quadro 85 + 1 elemento = 21 elementos).
- Quadro 87: Conjunto mínimo de elementos obrigatórios para descrever serviços web sem recursos acoplados (16 elementos).

Critérios de pontuação semântica (0 a 100 pontos):
1. Compreensão e Clareza Descritiva (Peso 30%):
   - Título (elemento 10): Deve ser expressivo e contextualizado. Evitar códigos internos soltos sem significado público.
   - Resumo (elemento 13): DEVE descrever o que é o recurso, abrangência geográfica, finalidade/metodologia e período temporal. Reprove resumos lacônicos como "Dados em shapefile" ou meras repetições do título.
2. Finalidade e Aplicabilidade (Peso 20%):
   - Elemento 14 (Finalidade): Justificativa para a produção dos dados e casos de uso recomendados ou restrições.
3. Indexação e Descoberta Temática (Peso 20%):
   - Palavras-chave (elemento 17): Pelo menos 3 a 5 palavras-chave relevantes, vocabulares controlados (quando cabível) e ausência de ruído.
   - Categoria Temática (elemento 21, quando aplicável): Coerência com a taxonomia oficial ISO 19115 topicCategory.
4. Qualidade e Linhagem dos Dados (Peso 20%):
   - Linhagem / Histórico (elemento 15): Descrição detalhada dos insumos utilizados, sensores/satélites, datas de imageamento/coleta, softwares, procedimentos de validação e normas de referência.
5. Responsabilidade e Contatos (Peso 10%):
   - Contato do metadado (elemento 6) e Ponto de contato do recurso (elemento 19): Identificação de organização, papel funcional e e-mail institucional válido.

FORMATO DE RESPOSTA OBRIGATÓRIO:
Retorne EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown de código e sem texto antes ou depois) estruturado de acordo com o seguinte modelo:
{
  "score": number, // 0 a 100
  "rating": "Excelente" | "Bom" | "Regular" | "Insuficiente", // Excelente (90-100), Bom (75-89), Regular (50-74), Insuficiente (<50)
  "summaryFeedback": "string em português com síntese crítica e executiva da auditoria",
  "dimensions": [
    { "id": "clareza", "name": "Compreensão e Clareza Descritiva", "weight": 30, "score": number, "feedback": "string" },
    { "id": "finalidade", "name": "Finalidade e Aplicabilidade", "weight": 20, "score": number, "feedback": "string" },
    { "id": "indexacao", "name": "Indexação e Descoberta Temática", "weight": 20, "score": number, "feedback": "string" },
    { "id": "linhagem", "name": "Qualidade e Linhagem dos Dados", "weight": 20, "score": number, "feedback": "string" },
    { "id": "responsabilidade", "name": "Responsabilidade e Contatos", "weight": 10, "score": number, "feedback": "string" }
  ],
  "elementEvaluations": [
    {
      "elementId": number,
      "elementName": "string",
      "status": "adequado" | "parcial" | "inadequado",
      "critique": "string detalhando pontos fortes ou deficiências semânticas",
      "currentSnippet": "trecho textual atual analisado",
      "suggestedImprovement": "proposta concreta de redação aprimorada ou complementação recomendada"
    }
  ],
  "strengths": ["ponto forte 1", "ponto forte 2", ...],
  "priorityImprovements": ["melhoria prioritária 1", "melhoria prioritária 2", ...]
}
`;

export function buildSemanticPrompt(
    metadataSummary: {
        identifier: string;
        title: string;
        abstractText: string;
        purpose?: string;
        keywords?: string[];
        lineage?: string[];
        topicCategories?: string[];
        contacts?: Array<{ organization?: string; email?: string; role?: string }>;
        spatialRepresentation?: string;
        scaleDenominator?: string;
        rawXmlSnippet?: string;
    },
    quadroId: MGBEffectiveQuadroId
): string {
    return `Por favor, audite e avalie semanticamente o seguinte metadado geoespacial sob as regras do Quadro ${quadroId} do Perfil MGB 2.0 (INDE/IBGE):

IDENTIFICAÇÃO:
- Identificador: ${metadataSummary.identifier || 'Não informado'}
- Título do recurso: ${metadataSummary.title || 'Não informado'}

CONTEÚDO TEXTUAL:
- Resumo (Abstract):
${metadataSummary.abstractText || '(Vazio ou não preenchido)'}

- Finalidade (Purpose):
${metadataSummary.purpose || '(Vazio ou não preenchido)'}

INDEXAÇÃO E CLASSIFICAÇÃO:
- Palavras-chave: ${(metadataSummary.keywords && metadataSummary.keywords.length > 0) ? metadataSummary.keywords.join(', ') : '(Nenhuma palavra-chave informada)'}
- Categoria Temática (topicCategory): ${(metadataSummary.topicCategories && metadataSummary.topicCategories.length > 0) ? metadataSummary.topicCategories.join(', ') : '(Não informada)'}

QUALIDADE E PROCEDÊNCIA:
- Linhagem / Histórico (Lineage statement / processStep):
${(metadataSummary.lineage && metadataSummary.lineage.length > 0) ? metadataSummary.lineage.join('\n') : '(Nenhuma linhagem informada)'}

RESPONSÁVEIS E CONTATOS:
${(metadataSummary.contacts && metadataSummary.contacts.length > 0)
    ? metadataSummary.contacts.map((c) => `- Org: ${c.organization || 'N/D'} | E-mail: ${c.email || 'N/D'} | Papel: ${c.role || 'N/D'}`).join('\n')
    : '(Nenhum contato identificado)'}

INFORMAÇÃO ESPACIAL E CARTOGRÁFICA:
- Tipo de representação: ${metadataSummary.spatialRepresentation || 'N/D'}
- Resolução espacial / Escala: ${metadataSummary.scaleDenominator || 'N/D'}

TRECHO DO XML DO REGISTRO:
${metadataSummary.rawXmlSnippet ? metadataSummary.rawXmlSnippet.slice(0, 4000) : '(Não fornecido)'}

Execute a avaliação semântica completa e devolva unicamente a estrutura JSON especificada.`;
}
