// src/lib/ai/mgbSemanticEvaluator.ts
/**
 * Motor de Avaliação Semântica de Metadados MGB 2.0 por IA.
 * Suporta integração com Gemini API, APIs compatíveis com OpenAI e
 * um motor heurístico semântico determinístico de alta fidelidade como fallback.
 */

import {
    detectMetadataScope,
    MGB_QUADROS_INFO,
    type MGBEffectiveQuadroId,
    type MGBQuadroId
} from '#lib/ogc/csw/mgb/mgbConformance.js';
import { MGB_AI_SYSTEM_PROMPT, buildSemanticPrompt } from './mgbSemanticPrompts.ts';
import type {
    MGBAIEvaluationRating,
    MGBAIEvaluationRequest,
    MGBElementSemanticEvaluation,
    MGBSemanticDimensionScore,
    MGBSemanticEvaluation
} from './types.ts';

export interface ExtractedSemanticData {
    identifier: string;
    title: string;
    abstractText: string;
    purpose: string;
    keywords: string[];
    lineage: string[];
    topicCategories: string[];
    contacts: Array<{ organization?: string; email?: string; role?: string }>;
    spatialRepresentation?: string;
    scaleDenominator?: string;
    scopeType?: string;
    rawXmlSnippet?: string;
    resourceDate?: string;
    resourceDateType?: string;
    resourceDates?: Array<{ date: string; dateType: string }>;
    metadataDate?: string;
    metadataDateType?: string;
}

function cleanText(val: string | null | undefined): string {
    return (val ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Extrai campos semânticos essenciais do XML do metadado ISO 19139 / MD_Metadata.
 */
export function extractSemanticDataFromXml(xmlStringOrElement: string | Element): ExtractedSemanticData {
    let rootEl: Element;
    let rawSnippet = '';

    if (typeof xmlStringOrElement === 'string') {
        rawSnippet = xmlStringOrElement.slice(0, 4000);
        // Em ambiente Node ou Browser
        if (typeof DOMParser !== 'undefined') {
            const doc = new DOMParser().parseFromString(xmlStringOrElement, 'application/xml');
            rootEl = doc.documentElement;
        } else {
            // Se estiver em runtime Node sem DOMParser global, usamos fallback regex básico
            return extractSemanticDataFallbackRegex(xmlStringOrElement);
        }
    } else {
        rootEl = xmlStringOrElement;
        rawSnippet = (xmlStringOrElement.outerHTML || '').slice(0, 4000);
    }

    const getAllByTag = (tag: string): Element[] => Array.from(rootEl.getElementsByTagName(tag));
    const getFirstText = (tags: string[]): string => {
        for (const t of tags) {
            const els = rootEl.getElementsByTagName(t);
            for (let i = 0; i < els.length; i++) {
                const text = cleanText(els[i].textContent);
                if (text) return text;
            }
        }
        return '';
    };

    const identifier = getFirstText(['fileIdentifier', 'identifier']);

    // Título
    let title = '';
    const citationEls = rootEl.getElementsByTagName('CI_Citation');
    if (citationEls.length > 0) {
        const titleEl = citationEls[0].getElementsByTagName('title');
        if (titleEl.length > 0) title = cleanText(titleEl[0].textContent);
    }
    if (!title) title = getFirstText(['title']);

    // Resumo e Finalidade
    const abstractText = getFirstText(['abstract']);
    const purpose = getFirstText(['purpose']);

    // Palavras-chave
    const keywordEls = getAllByTag('keyword');
    const keywords: string[] = [];
    for (const el of keywordEls) {
        const txt = cleanText(el.textContent);
        if (txt && !keywords.includes(txt)) keywords.push(txt);
    }

    // Linhagem
    const lineage: string[] = [];
    const lineageEls = [...getAllByTag('LI_Lineage'), ...getAllByTag('LI_ProcessStep')];
    for (const el of lineageEls) {
        const stEls = [...Array.from(el.getElementsByTagName('statement')), ...Array.from(el.getElementsByTagName('description'))];
        for (const s of stEls) {
            const txt = cleanText(s.textContent);
            if (txt && !lineage.includes(txt)) lineage.push(txt);
        }
    }

    // Categorias Temáticas
    const topicCategories: string[] = [];
    for (const el of getAllByTag('topicCategory')) {
        const txt = cleanText(el.textContent);
        if (txt && !topicCategories.includes(txt)) topicCategories.push(txt);
    }

    // Contatos
    const contacts: Array<{ organization?: string; email?: string; role?: string }> = [];
    const respPartyEls = getAllByTag('CI_ResponsibleParty');
    for (const rp of respPartyEls) {
        const org = cleanText(rp.getElementsByTagName('organisationName')[0]?.textContent);
        const email = cleanText(rp.getElementsByTagName('electronicMailAddress')[0]?.textContent);
        const roleEl = rp.getElementsByTagName('role')[0]?.getElementsByTagName('CI_RoleCode')[0];
        const role = cleanText(roleEl?.getAttribute('codeListValue') || roleEl?.textContent);
        if (org || email) {
            contacts.push({ organization: org, email, role });
        }
    }

    // Representação espacial
    const spatialRepCodeEl = getAllByTag('MD_SpatialRepresentationTypeCode')[0];
    const spatialRepresentation = cleanText(
        spatialRepCodeEl?.getAttribute('codeListValue') || spatialRepCodeEl?.textContent
    );

    // Escala
    const scaleEl = getAllByTag('MD_RepresentativeFraction')[0]?.getElementsByTagName('denominator')[0];
    const scaleDenominator = cleanText(scaleEl?.textContent);

    // Datas do metadado (elementos 7 e 8)
    let metadataDate = '';
    const dateStampEls = rootEl.getElementsByTagName('dateStamp');
    if (dateStampEls.length > 0) {
        const dEl = dateStampEls[0].getElementsByTagName('Date')[0] || dateStampEls[0].getElementsByTagName('DateTime')[0];
        metadataDate = cleanText(dEl?.textContent || dateStampEls[0].textContent);
    }
    if (!metadataDate) {
        const dateInfoEls = rootEl.getElementsByTagName('dateInfo');
        if (dateInfoEls.length > 0) {
            const dEl = dateInfoEls[0].getElementsByTagName('Date')[0] || dateInfoEls[0].getElementsByTagName('DateTime')[0] || dateInfoEls[0].getElementsByTagName('date')[0];
            metadataDate = cleanText(dEl?.textContent);
        }
    }

    let metadataDateType = '';
    const dateInfoEls = rootEl.getElementsByTagName('dateInfo');
    if (dateInfoEls.length > 0) {
        const dtCode = dateInfoEls[0].getElementsByTagName('CI_DateTypeCode')[0];
        metadataDateType = cleanText(dtCode?.getAttribute('codeListValue') || dtCode?.textContent);
    }
    if (!metadataDateType && metadataDate) {
        metadataDateType = 'publication';
    }

    // Datas do recurso (elementos 11 e 12 - pacote Informação de Identificação > MD_Identification > CI_Citation > CI_Date)
    const resourceDates: Array<{ date: string; dateType: string }> = [];
    if (citationEls.length > 0) {
        const ciDateEls = citationEls[0].getElementsByTagName('CI_Date');
        for (let i = 0; i < ciDateEls.length; i++) {
            const dateEl = ciDateEls[i].getElementsByTagName('Date')[0] || ciDateEls[i].getElementsByTagName('DateTime')[0] || ciDateEls[i].getElementsByTagName('date')[0];
            const dVal = cleanText(dateEl?.textContent);

            const typeEl = ciDateEls[i].getElementsByTagName('CI_DateTypeCode')[0];
            const dtVal = cleanText(typeEl?.getAttribute('codeListValue') || typeEl?.textContent);
            if (dVal || dtVal) {
                resourceDates.push({ date: dVal, dateType: dtVal || 'publication' });
            }
        }
    }
    if (resourceDates.length === 0) {
        const idInfoEls = rootEl.getElementsByTagName('identificationInfo');
        if (idInfoEls.length > 0) {
            const dEl = idInfoEls[0].getElementsByTagName('Date')[0] || idInfoEls[0].getElementsByTagName('DateTime')[0];
            const dVal = cleanText(dEl?.textContent);
            if (dVal) resourceDates.push({ date: dVal, dateType: 'publication' });
        }
    }

    const pubDate = resourceDates.find((d) => d.dateType.toLowerCase().includes('pub'));
    const createDate = resourceDates.find((d) => d.dateType.toLowerCase().includes('crea') || d.dateType.toLowerCase().includes('cria'));
    const primaryDate = pubDate || createDate || resourceDates[0];
    const resourceDate = primaryDate?.date || '';
    const resourceDateType = primaryDate?.dateType || '';

    return {
        identifier,
        title,
        abstractText,
        purpose,
        keywords,
        lineage,
        topicCategories,
        contacts,
        spatialRepresentation,
        scaleDenominator,
        resourceDate,
        resourceDateType,
        resourceDates,
        metadataDate,
        metadataDateType,
        rawXmlSnippet: rawSnippet
    };
}

/**
 * Fallback de extração via Regex para ambiente server-side sem DOMParser.
 */
function extractSemanticDataFallbackRegex(xml: string): ExtractedSemanticData {
    const findFirstTag = (tagName: string): string => {
        const regex = new RegExp(`<(?:[a-zA-Z0-9]+:)?${tagName}[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9]+:)?${tagName}>`, 'i');
        const match = xml.match(regex);
        if (!match) return '';
        // Remove tags internas como gco:CharacterString
        return cleanText(match[1].replace(/<[^>]+>/g, ' '));
    };

    const findAllTags = (tagName: string): string[] => {
        const regex = new RegExp(`<(?:[a-zA-Z0-9]+:)?${tagName}[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9]+:)?${tagName}>`, 'gi');
        const results: string[] = [];
        let m: RegExpExecArray | null;
        while ((m = regex.exec(xml)) !== null) {
            const clean = cleanText(m[1].replace(/<[^>]+>/g, ' '));
            if (clean && !results.includes(clean)) results.push(clean);
        }
        return results;
    };

    const findMetadataDate = (): string => {
        const dsMatch = xml.match(/<(?:[a-zA-Z0-9]+:)?dateStamp[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9]+:)?dateStamp>/i);
        if (dsMatch) {
            const inner = dsMatch[1];
            const dateMatch = inner.match(/<(?:[a-zA-Z0-9]+:)?(?:Date|DateTime)[^>]*>([^<]+)<\//i);
            return cleanText(dateMatch ? dateMatch[1] : inner.replace(/<[^>]+>/g, ' '));
        }
        const diMatch = xml.match(/<(?:[a-zA-Z0-9]+:)?dateInfo[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9]+:)?dateInfo>/i);
        if (diMatch) {
            const inner = diMatch[1];
            const dateMatch = inner.match(/<(?:[a-zA-Z0-9]+:)?(?:Date|DateTime)[^>]*>([^<]+)<\//i);
            return cleanText(dateMatch ? dateMatch[1] : '');
        }
        return '';
    };

    const findResourceDates = (): Array<{ date: string; dateType: string }> => {
        const dates: Array<{ date: string; dateType: string }> = [];
        const citMatch = xml.match(/<(?:[a-zA-Z0-9]+:)?(?:citation|CI_Citation)[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9]+:)?(?:citation|CI_Citation)>/i);
        if (citMatch) {
            const innerCit = citMatch[1];
            const dateBlockRegex = /<(?:[a-zA-Z0-9]+:)?CI_Date[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9]+:)?CI_Date>/gi;
            let m: RegExpExecArray | null;
            while ((m = dateBlockRegex.exec(innerCit)) !== null) {
                const block = m[1];
                const dMatch = block.match(/<(?:[a-zA-Z0-9]+:)?(?:Date|DateTime)[^>]*>([^<]+)<\//i);
                const d = cleanText(dMatch ? dMatch[1] : '');
                const cMatch = block.match(/codeListValue="([^"]+)"/i);
                let dt = cMatch ? cleanText(cMatch[1]) : '';
                if (!dt) {
                    const dtMatch = block.match(/<(?:[a-zA-Z0-9]+:)?CI_DateTypeCode[^>]*>([^<]+)<\//i);
                    dt = cleanText(dtMatch ? dtMatch[1] : '');
                }
                if (d || dt) dates.push({ date: d, dateType: dt });
            }
            if (dates.length === 0) {
                const dMatch = innerCit.match(/<(?:[a-zA-Z0-9]+:)?(?:Date|DateTime)[^>]*>([^<]+)<\//i);
                if (dMatch) dates.push({ date: cleanText(dMatch[1]), dateType: '' });
            }
        }
        return dates;
    };

    const resDates = findResourceDates();
    const primaryResDate = resDates.find((d) => d.dateType.toLowerCase().includes('pub')) || resDates.find((d) => d.dateType.toLowerCase().includes('crea')) || resDates[0];
    const metaDate = findMetadataDate();

    return {
        identifier: findFirstTag('fileIdentifier'),
        title: findFirstTag('title'),
        abstractText: findFirstTag('abstract'),
        purpose: findFirstTag('purpose'),
        keywords: findAllTags('keyword'),
        lineage: findAllTags('statement'),
        topicCategories: findAllTags('topicCategory'),
        contacts: [],
        spatialRepresentation: findFirstTag('MD_SpatialRepresentationTypeCode'),
        scaleDenominator: findFirstTag('denominator'),
        resourceDate: primaryResDate?.date || '',
        resourceDateType: primaryResDate?.dateType || '',
        resourceDates: resDates,
        metadataDate: metaDate,
        metadataDateType: metaDate ? 'publication' : '',
        rawXmlSnippet: xml.slice(0, 4000)
    };
}

/**
 * Avaliador Heurístico Semântico determinístico.
 * Simula a análise de um auditor especialista em MGB 2.0 com critérios textuais avançados.
 */
export function evaluateMetadataHeuristically(
    data: ExtractedSemanticData,
    quadroId: MGBEffectiveQuadroId
): MGBSemanticEvaluation {
    const quadroInfo = MGB_QUADROS_INFO[quadroId];
    const elementEvaluations: MGBElementSemanticEvaluation[] = [];
    const strengths: string[] = [];
    const priorityImprovements: string[] = [];

    // --- 1. Dimensão: Clareza e Compreensão (30%) ---
    let clarezaScore = 0;
    const titleLen = (data.title || '').trim().length;
    const absLen = (data.abstractText || '').trim().length;

    // Elemento 10: Título
    let titleStatus: 'adequado' | 'parcial' | 'inadequado' = 'inadequado';
    let titleCritique = '';
    let titleSuggestion = '';

    if (titleLen === 0) {
        titleCritique = 'O título do recurso não foi informado no metadado.';
        titleSuggestion = 'Defina um título expressivo indicando o tema e recorte (ex: "Aglomerados Rurais do Brasil - BC250 - 2025").';
    } else if (titleLen < 15) {
        titleStatus = 'parcial';
        clarezaScore += 15;
        titleCritique = `O título "${data.title}" é muito breve e pode dificultar a identificação em catálogos.`;
        titleSuggestion = 'Enriqueça o título com o nome completo do tema, área de cobertura e edição temporal.';
    } else {
        titleStatus = 'adequado';
        clarezaScore += 30;
        titleCritique = `Título bem delimitado e claro (${titleLen} caracteres).`;
        strengths.push('Título descritivo e compreensível para usuários externos.');
    }

    elementEvaluations.push({
        elementId: 10,
        elementName: 'Título do recurso',
        status: titleStatus,
        critique: titleCritique,
        currentSnippet: data.title || '(vazio)',
        suggestedImprovement: titleSuggestion || undefined
    });

    // Elemento 13: Resumo
    let absStatus: 'adequado' | 'parcial' | 'inadequado' = 'inadequado';
    let absCritique = '';
    let absSuggestion = '';

    if (absLen === 0) {
        absCritique = 'O resumo do recurso está completamente ausente.';
        absSuggestion = 'Redija um resumo contemplando o que é o dado, abrangência territorial, período de referência e metodologia geral.';
        priorityImprovements.push('Elaborar o resumo com descrição detalhada do produto (Quadro MGB elemento 13).');
    } else if (absLen < 100) {
        absStatus = 'parcial';
        clarezaScore += 25;
        absCritique = `O resumo possui apenas ${absLen} caracteres, sendo excessivamente sintético segundo as diretrizes do MGB 2.0.`;
        absSuggestion = 'Amplie o resumo explicando a motivação, período temporal e metodologia adotada.';
        priorityImprovements.push('Expandir o resumo para incluir método de produção e recorte espacial.');
    } else {
        absStatus = 'adequado';
        clarezaScore += 55;
        absCritique = `Resumo completo e estruturado (${absLen} caracteres).`;
        strengths.push('Resumo explicativo e informativo com boa contextualização.');
    }

    // Bônus se resumo aborda metodologia/temporal
    const lowerAbs = (data.abstractText || '').toLowerCase();
    if (lowerAbs.includes('ibge') || lowerAbs.includes('brasil') || lowerAbs.includes('ano') || lowerAbs.includes('escala')) {
        clarezaScore = Math.min(100, clarezaScore + 15);
    }

    elementEvaluations.push({
        elementId: 13,
        elementName: 'Resumo do recurso',
        status: absStatus,
        critique: absCritique,
        currentSnippet: data.abstractText ? data.abstractText.slice(0, 180) + '...' : '(vazio)',
        suggestedImprovement: absSuggestion || undefined
    });

    const dimClareza: MGBSemanticDimensionScore = {
        id: 'clareza',
        name: 'Compreensão e Clareza Descritiva',
        weight: 25,
        score: Math.min(100, Math.round(clarezaScore)),
        feedback: clarezaScore >= 80 ? 'Título e resumo com excelente qualidade descritiva.' : 'Melhorar a riqueza descritiva do título e do resumo.'
    };

    // --- 2. Dimensão: Referência Temporal e Ciclo de Vida (15%) ---
    let temporalScore = 0;
    const resDate = (data.resourceDate || '').trim();
    const resDateType = (data.resourceDateType || '').trim();
    const metaDate = (data.metadataDate || '').trim();
    const metaDateType = (data.metadataDateType || '').trim();

    // Elemento 11: Valor da data do recurso
    let resDateStatus: 'adequado' | 'parcial' | 'inadequado' = 'inadequado';
    let resDateCritique = '';
    let resDateSuggestion = '';

    if (!resDate) {
        resDateCritique = 'A data de referência temporal do recurso (criação, publicação ou revisão) não foi informada.';
        resDateSuggestion = 'Informar a data temporal do recurso segundo o padrão ISO 8601 (ex: "2025-01-15" ou "2025").';
        priorityImprovements.push('Declarar a data de referência temporal do recurso (elemento 11 do MGB).');
    } else {
        const isIsoFormat = /^\d{4}(-\d{2}(-\d{2})?)?/.test(resDate);
        if (isIsoFormat) {
            resDateStatus = 'adequado';
            temporalScore += 35;
            resDateCritique = `Data do recurso informada e válida (${resDate}).`;
            strengths.push(`Data do recurso documentada (${resDate}).`);
        } else {
            resDateStatus = 'parcial';
            temporalScore += 20;
            resDateCritique = `Data do recurso informada ("${resDate}"), porém em formato não estritamente ISO 8601.`;
            resDateSuggestion = 'Padronizar a data no formato ISO 8601 (AAAA-MM-DD ou AAAA).';
        }
    }

    const snippetResDates = (data.resourceDates && data.resourceDates.length > 0)
        ? data.resourceDates.map((d) => `${d.dateType || 'data'}: ${d.date}`).join(' | ')
        : resDate;

    elementEvaluations.push({
        elementId: 11,
        elementName: 'Valor da data do recurso (MD_Identification > CI_Citation > CI_Date)',
        status: resDateStatus,
        critique: resDateCritique,
        currentSnippet: snippetResDates || '(não informada)',
        suggestedImprovement: resDateSuggestion || undefined
    });

    // Elemento 12: Tipo da data do recurso
    let resTypeStatus: 'adequado' | 'parcial' | 'inadequado' = 'inadequado';
    let resTypeCritique = '';
    let resTypeSuggestion = '';

    const validDateTypes = ['creation', 'publication', 'revision', 'criação', 'publicação', 'revisão'];
    if (!resDateType) {
        resTypeCritique = 'O tipo da data do recurso não foi especificado (criação, publicação ou revisão).';
        resTypeSuggestion = 'Especificar se a data corresponde à criação (creation), publicação (publication) ou revisão (revision) do dado.';
        priorityImprovements.push('Especificar o tipo de data do recurso no elemento 12 (creation, publication ou revision).');
    } else if (validDateTypes.some((t) => resDateType.toLowerCase().includes(t))) {
        resTypeStatus = 'adequado';
        temporalScore += 25;
        resTypeCritique = `Tipo de data do recurso explicitado como "${resDateType}".`;
        strengths.push(`Tipo de data do recurso devidamente classificado (${resDateType}).`);
    } else {
        resTypeStatus = 'parcial';
        temporalScore += 15;
        resTypeCritique = `Tipo de data "${resDateType}" não é o padrão recomendado pelo MGB/ISO (creation, publication ou revision).`;
        resTypeSuggestion = 'Adotar um dos valores padrão da lista de códigos ISO CI_DateTypeCode: creation, publication ou revision.';
    }

    if (data.resourceDates && data.resourceDates.length > 1) {
        strengths.push(`Múltiplas datas do recurso registradas em CI_Citation (${data.resourceDates.map((d) => `${d.dateType}: ${d.date}`).join(', ')}).`);
    }

    elementEvaluations.push({
        elementId: 12,
        elementName: 'Tipo da data do recurso (CI_DateTypeCode)',
        status: resTypeStatus,
        critique: resTypeCritique,
        currentSnippet: (data.resourceDates && data.resourceDates.length > 0)
            ? data.resourceDates.map((d) => d.dateType).filter(Boolean).join(', ')
            : (resDateType || '(não informado)'),
        suggestedImprovement: resTypeSuggestion || undefined
    });

    // Elemento 7: Valor da data do metadado
    let metaDateStatus: 'adequado' | 'parcial' | 'inadequado' = 'inadequado';
    let metaDateCritique = '';
    let metaDateSuggestion = '';

    if (!metaDate) {
        metaDateCritique = 'A data de publicação ou elaboração do metadado (dateStamp) não foi encontrada.';
        metaDateSuggestion = 'Informar a data do metadado (dateStamp) no formato ISO 8601 (AAAA-MM-DD).';
        priorityImprovements.push('Preencher a data do metadado (elemento 7 do MGB / dateStamp).');
    } else {
        metaDateStatus = 'adequado';
        temporalScore += 25;
        metaDateCritique = `Data do metadado informada no registro (${metaDate}).`;
        strengths.push(`Data de publicação do metadado registrada (${metaDate}).`);
    }

    elementEvaluations.push({
        elementId: 7,
        elementName: 'Valor da data do metadado',
        status: metaDateStatus,
        critique: metaDateCritique,
        currentSnippet: metaDate || '(não informada)',
        suggestedImprovement: metaDateSuggestion || undefined
    });

    // Elemento 8: Tipo da data do metadado
    let metaTypeStatus: 'adequado' | 'parcial' | 'inadequado' = metaDate ? 'adequado' : 'inadequado';
    elementEvaluations.push({
        elementId: 8,
        elementName: 'Tipo da data do metadado',
        status: metaTypeStatus,
        critique: metaDate
            ? `Tipo de data do metadado identificado (${metaDateType || 'publicação / dateStamp'}).`
            : 'Tipo da data do metadado ausente.',
        currentSnippet: metaDateType || (metaDate ? 'Implícito (dateStamp / publicação)' : '(ausente)'),
        suggestedImprovement: metaDate ? undefined : 'Especificar o evento da data do metadado (ex: publication).'
    });
    if (metaDate) temporalScore += 10;

    // Coerência Temporal entre recurso e metadado
    const matchYearRes = resDate.match(/\b(19\d\d|20\d\d)\b/);
    const matchYearMeta = metaDate.match(/\b(19\d\d|20\d\d)\b/);
    if (matchYearRes && matchYearMeta) {
        const yearRes = parseInt(matchYearRes[1], 10);
        const yearMeta = parseInt(matchYearMeta[1], 10);
        if (yearMeta >= yearRes) {
            temporalScore += 5;
            strengths.push(`Coerência cronológica confirmada: metadado (${yearMeta}) posterior ou contemporâneo aos dados (${yearRes}).`);
        } else {
            // Inconsistência: metadado datado antes da criação do dado
            temporalScore = Math.max(0, temporalScore - 20);
            priorityImprovements.push(`Ajustar inconsistência temporal: a data do metadado (${yearMeta}) é anterior à data do recurso (${yearRes}).`);
        }
    }

    const dimTemporal: MGBSemanticDimensionScore = {
        id: 'temporal',
        name: 'Referência Temporal e Ciclo de Vida',
        weight: 15,
        score: Math.min(100, Math.round(temporalScore)),
        feedback: temporalScore >= 80
            ? 'Datas do recurso e do metadado claras, consistentes e com tipologia definida.'
            : 'Completar ou padronizar as datas do recurso (criação/publicação) e a data do metadado.'
    };

    // --- 3. Dimensão: Finalidade e Aplicabilidade (15%) ---
    let finalidadeScore = 0;
    const purpLen = (data.purpose || '').trim().length;
    let purpStatus: 'adequado' | 'parcial' | 'inadequado' = 'inadequado';
    let purpCritique = '';
    let purpSuggestion = '';

    if (purpLen === 0) {
        finalidadeScore = 30; // Tolerância se resumo já explica um pouco
        purpCritique = 'O campo de finalidade (purpose) não foi explicitado individualmente.';
        purpSuggestion = 'Descrever a finalidade para a qual o conjunto de dados foi concebido e suas recomendações de uso.';
        priorityImprovements.push('Preencher o elemento 14 (Finalidade do recurso) com os casos de uso previstos.');
    } else if (purpLen < 50) {
        purpStatus = 'parcial';
        finalidadeScore = 65;
        purpCritique = `Finalidade sucinta (${purpLen} caracteres).`;
        purpSuggestion = 'Descrever as aplicações analíticas recomendadas e limites operacionais.';
    } else {
        purpStatus = 'adequado';
        finalidadeScore = 95;
        purpCritique = `Finalidade claramente estabelecida (${purpLen} caracteres).`;
        strengths.push('Finalidade do dado bem justificada com contexto de aplicação.');
    }

    elementEvaluations.push({
        elementId: 14,
        elementName: 'Finalidade do recurso',
        status: purpStatus,
        critique: purpCritique,
        currentSnippet: data.purpose || '(não preenchido)',
        suggestedImprovement: purpSuggestion || undefined
    });

    const dimFinalidade: MGBSemanticDimensionScore = {
        id: 'finalidade',
        name: 'Finalidade e Aplicabilidade',
        weight: 15,
        score: Math.min(100, finalidadeScore),
        feedback: finalidadeScore >= 80 ? 'Aplicações e objetivos do recurso bem fundamentados.' : 'Documentar explicitamente o objetivo e o público-alvo dos dados.'
    };

    // --- 4. Dimensão: Indexação e Descoberta Temática (15%) ---
    let indexacaoScore = 0;
    const kwCount = data.keywords.length;
    let kwStatus: 'adequado' | 'parcial' | 'inadequado' = 'inadequado';
    let kwCritique = '';
    let kwSuggestion = '';

    if (kwCount === 0) {
        indexacaoScore = 15;
        kwCritique = 'Nenhuma palavra-chave informada. O recurso fica invisível para buscas temáticas nos catálogos CSW.';
        kwSuggestion = 'Adicione entre 4 e 8 palavras-chave específicas (ex: "cartografia, base contínua, aglomerado rural, IBGE").';
        priorityImprovements.push('Adicionar palavras-chave padronizadas para indexação e catalogação (elemento 17).');
    } else if (kwCount < 3) {
        kwStatus = 'parcial';
        indexacaoScore = 55;
        kwCritique = `Apenas ${kwCount} palavra(s)-chave informada(s): "${data.keywords.join(', ')}". Pouco para descoberta semântica ampla.`;
        kwSuggestion = 'Amplie a lista com termos temáticos, geográficos e temporais.';
    } else {
        kwStatus = 'adequado';
        indexacaoScore = 85;
        if (kwCount >= 5) indexacaoScore = 95;
        kwCritique = `${kwCount} palavras-chave cadastradas: "${data.keywords.slice(0, 5).join(', ')}${kwCount > 5 ? '...' : ''}".`;
        strengths.push('Boa densidade de palavras-chave para busca e interoperabilidade temática.');
    }

    elementEvaluations.push({
        elementId: 17,
        elementName: 'Palavras-chave',
        status: kwStatus,
        critique: kwCritique,
        currentSnippet: data.keywords.join('; ') || '(nenhuma)',
        suggestedImprovement: kwSuggestion || undefined
    });

    // Categoria temática (Q85/Q86)
    if (quadroId === '85' || quadroId === '86') {
        const hasTopic = data.topicCategories.length > 0;
        let topicStatus: 'adequado' | 'parcial' | 'inadequado' = hasTopic ? 'adequado' : 'inadequado';
        elementEvaluations.push({
            elementId: 21,
            elementName: 'Categoria temática',
            status: topicStatus,
            critique: hasTopic
                ? `Categoria ISO identificada: ${data.topicCategories.join(', ')}.`
                : 'Categoria temática ISO ausente. Obrigatória no Quadro 85/86.',
            currentSnippet: data.topicCategories.join(', ') || '(ausente)',
            suggestedImprovement: hasTopic ? undefined : 'Selecione uma categoria temática ISO válida (ex: boundaries, location, society, farming).'
        });
        if (hasTopic) indexacaoScore = Math.min(100, indexacaoScore + 5);
        else indexacaoScore = Math.max(0, indexacaoScore - 15);
    }

    const dimIndexacao: MGBSemanticDimensionScore = {
        id: 'indexacao',
        name: 'Indexação e Descoberta Temática',
        weight: 15,
        score: Math.min(100, Math.round(indexacaoScore)),
        feedback: indexacaoScore >= 80 ? 'Excelente indexação para localização em geoportais.' : 'Incrementar palavras-chave e vocabulários controlados.'
    };

    // --- 5. Dimensão: Qualidade e Linhagem dos Dados (20%) ---
    let linhagemScore = 0;
    const lineageText = data.lineage.join(' ');
    const linLen = lineageText.trim().length;
    let linStatus: 'adequado' | 'parcial' | 'inadequado' = 'inadequado';
    let linCritique = '';
    let linSuggestion = '';

    if (linLen === 0) {
        linhagemScore = 20;
        linCritique = 'Linhagem e histórico de produção dos dados não declarados.';
        linSuggestion = 'Detalhar o histórico de elaboração, fontes primárias de dados (sensores, levantamentos de campo) e softwares/normas aplicadas.';
        priorityImprovements.push('Documentar o histórico e linhagem metodológica (elemento 15 do MGB).');
    } else if (linLen < 100) {
        linStatus = 'parcial';
        linhagemScore = 55;
        linCritique = `Linhagem informada de forma concisa (${linLen} caracteres). Faltam detalhes de insumos e processos.`;
        linSuggestion = 'Especificar as etapas de validação e controle de qualidade adotadas.';
    } else {
        linStatus = 'adequado';
        linhagemScore = 85;
        if (lineageText.toLowerCase().includes('process') || lineageText.toLowerCase().includes('fonte') || lineageText.toLowerCase().includes('ibge')) {
            linhagemScore = 95;
        }
        linCritique = `Linhagem documentada com ${linLen} caracteres e detalhamento metodológico.`;
        strengths.push('Rastreabilidade técnica e metodológica registrada na linhagem.');
    }

    elementEvaluations.push({
        elementId: 15,
        elementName: 'Linhagem (Histórico)',
        status: linStatus,
        critique: linCritique,
        currentSnippet: lineageText ? lineageText.slice(0, 180) + '...' : '(não informada)',
        suggestedImprovement: linSuggestion || undefined
    });

    // Se Q86: Resolução espacial (elemento 25)
    if (quadroId === '86') {
        const hasScale = Boolean(data.scaleDenominator);
        elementEvaluations.push({
            elementId: 25,
            elementName: 'Resolução espacial (Denominador de escala)',
            status: hasScale ? 'adequado' : 'inadequado',
            critique: hasScale
                ? `Escala declarada com denominador 1:${data.scaleDenominator}. Coerente com o SCN.`
                : 'Denominador de escala ausente para metadado do SCN (Quadro 86).',
            currentSnippet: data.scaleDenominator ? `1:${data.scaleDenominator}` : '(ausente)',
            suggestedImprovement: hasScale ? undefined : 'Informar o denominador de escala cartográfica (ex: 250000).'
        });
        if (hasScale) linhagemScore = Math.min(100, linhagemScore + 5);
        else linhagemScore = Math.max(0, linhagemScore - 15);
    }

    const dimLinhagem: MGBSemanticDimensionScore = {
        id: 'linhagem',
        name: 'Qualidade e Linhagem dos Dados',
        weight: 20,
        score: Math.min(100, Math.round(linhagemScore)),
        feedback: linhagemScore >= 80 ? 'Ótimo histórico e transparência de processamento.' : 'Complementar etapas de controle de qualidade e fontes na linhagem.'
    };

    // --- 6. Dimensão: Responsabilidade e Contatos (10%) ---
    let respScore = 0;
    const hasOrg = data.contacts.some((c) => Boolean(c.organization));
    const hasEmail = data.contacts.some((c) => Boolean(c.email && c.email.includes('@')));
    const hasRole = data.contacts.some((c) => Boolean(c.role));

    if (hasOrg && hasEmail) {
        respScore = 95;
        strengths.push('Órgão e e-mail institucional do ponto de contato devidamente preenchidos.');
    } else if (hasOrg || hasEmail) {
        respScore = 60;
    } else {
        respScore = 20;
        priorityImprovements.push('Preencher contatos com organização institucional e e-mail corporativo válido.');
    }

    elementEvaluations.push({
        elementId: 19,
        elementName: 'Ponto de contato do recurso',
        status: respScore >= 80 ? 'adequado' : respScore >= 50 ? 'parcial' : 'inadequado',
        critique: hasOrg && hasEmail
            ? `Ponto de contato com organização (${data.contacts[0]?.organization || 'N/D'}) e e-mail (${data.contacts[0]?.email || 'N/D'}).`
            : 'Faltam dados essenciais no ponto de contato (organização ou e-mail válido).',
        currentSnippet: data.contacts.map((c) => `${c.organization || ''} <${c.email || ''}>`).join(', ') || '(ausente)',
        suggestedImprovement: respScore < 80 ? 'Garantir que haja e-mail institucional e papel definido para suporte.' : undefined
    });

    const dimResponsabilidade: MGBSemanticDimensionScore = {
        id: 'responsabilidade',
        name: 'Responsabilidade e Contatos',
        weight: 10,
        score: Math.min(100, Math.round(respScore)),
        feedback: respScore >= 80 ? 'Instituição de custódia e contatos claros.' : 'Revisar e-mails e papéis dos contatos do metadado.'
    };

    // Cálculo da Nota Geral Ponderada (0 a 100)
    const weightedScore = Math.round(
        (dimClareza.score * 0.25) +
        (dimTemporal.score * 0.15) +
        (dimFinalidade.score * 0.15) +
        (dimIndexacao.score * 0.15) +
        (dimLinhagem.score * 0.20) +
        (dimResponsabilidade.score * 0.10)
    );

    let rating: MGBAIEvaluationRating = 'Insuficiente';
    if (weightedScore >= 90) rating = 'Excelente';
    else if (weightedScore >= 75) rating = 'Bom';
    else if (weightedScore >= 50) rating = 'Regular';

    let summaryFeedback = '';
    if (rating === 'Excelente') {
        summaryFeedback = `O metadado apresenta alta qualidade semântica no Quadro ${quadroId} do MGB 2.0. Os elementos textuais, espaciais e metodológicos fornecem rastreabilidade exemplar e suporte completo à catalogação na INDE.`;
    } else if (rating === 'Bom') {
        summaryFeedback = `O metadado possui boa consistência geral no Quadro ${quadroId} do MGB 2.0, permitindo localização e uso adequado, com pequenos pontos de aprimoramento em palavras-chave ou detalhamento de linhagem.`;
    } else if (rating === 'Regular') {
        summaryFeedback = `O metadado atende aos requisitos básicos do Quadro ${quadroId}, porém contém lacunas de clareza textual, linhagem sucinta ou termos de indexação limitados que reduzem seu potencial na INDE.`;
    } else {
        summaryFeedback = `O metadado necessita de revisões semânticas substanciais segundo as diretrizes do MGB 2.0. Os elementos essenciais (resumo, linhagem ou finalidade) estão ausentes ou insuficientes.`;
    }

    if (strengths.length === 0) {
        strengths.push('Estrutura XML compatível com os esquemas ISO.');
    }
    if (priorityImprovements.length === 0) {
        priorityImprovements.push('Manter a periodicidade de atualização das informações do recurso.');
    }

    return {
        metadataId: data.identifier,
        title: data.title,
        quadroId,
        quadroTitle: quadroInfo.title,
        score: weightedScore,
        rating,
        summaryFeedback,
        dimensions: [dimClareza, dimTemporal, dimFinalidade, dimIndexacao, dimLinhagem, dimResponsabilidade],
        elementEvaluations,
        strengths: strengths.slice(0, 4),
        priorityImprovements: priorityImprovements.slice(0, 4),
        provider: 'heuristic',
        evaluatedAt: new Date().toISOString()
    };
}

/**
 * Chamada à API Gemini (Google).
 */
async function callGeminiApi(
    prompt: string,
    apiKey: string,
    modelName = 'gemini-flash-lite-latest'
): Promise<MGBSemanticEvaluation> {
    const cleanKey = apiKey.replace(/^["']|["']$/g, '').trim();

    // Modelos com alta disponibilidade, priorizando versões Lite que não sofrem saturação de demanda
    const candidateModels = [
        modelName,
        'gemini-flash-lite-latest',
        'gemini-3.5-flash-lite',
        'gemini-flash-latest',
        'gemini-3.8-flash'
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    const payload = {
        system_instruction: {
            parts: [{ text: MGB_AI_SYSTEM_PROMPT }]
        },
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ],
        generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
        }
    };

    let lastError: Error | null = null;
    for (const model of candidateModels) {
        // Redireciona modelos obsoletos 1.5 e 2.0 para flash-lite
        const effectiveModel = (model.includes('1.5') || model.includes('2.0')) ? 'gemini-flash-lite-latest' : model;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${cleanKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const json = await response.json();
                const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!candidateText) {
                    throw new Error('Nenhuma resposta de texto retornada pelo Gemini.');
                }

                const cleanCandidate = candidateText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
                const parsed = JSON.parse(cleanCandidate);
                return {
                    ...parsed,
                    provider: 'gemini',
                    model: effectiveModel,
                    evaluatedAt: new Date().toISOString()
                };
            }

            const errText = await response.text();
            // Se for 503 (sobrecarga) ou 404 (obsoleto), tenta o próximo modelo da lista
            if (response.status === 503 || response.status === 404) {
                console.warn(`Modelo Gemini ${effectiveModel} retornou ${response.status}. Tentando modelo de contingência...`);
                lastError = new Error(`Modelo ${effectiveModel} indisponível (${response.status}): ${errText}`);
                continue;
            }

            throw new Error(`Falha na API Gemini (${response.status}): ${errText}`);
        } catch (err) {
            if (err instanceof Error && (err.message.includes('503') || err.message.includes('404'))) {
                lastError = err;
                continue;
            }
            throw err;
        }
    }

    throw lastError || new Error('Não foi possível conectar a nenhum dos modelos disponíveis do Google Gemini.');
}

/**
 * Utilitário seguro para extrair e interpretar o JSON retornado por qualquer LLM,
 * removendo eventuais blocos de raciocínio (<think>...</think>) e wrappers markdown (```json ... ```).
 */
function cleanJsonOutput(raw: string): any {
    // Remove tags de raciocínio de modelos como DeepSeek R1 (<think>...</think>)
    let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // Extrai bloco de markdown ```json ... ``` se houver
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch) {
        cleaned = jsonBlockMatch[1].trim();
    } else {
        // Encontra o primeiro '{' e o último '}'
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
        }
    }
    return JSON.parse(cleaned);
}

/**
 * Chamada à API OpenRouter (openrouter.ai).
 * Suporta ampla variedade de modelos gratuitos (:free) como Llama 3.3 70B, DeepSeek R1, Qwen 2.5, Gemini 2.0, etc.
 */
async function callOpenRouterApi(
    prompt: string,
    apiKey: string,
    modelName = 'openrouter/free'
): Promise<MGBSemanticEvaluation> {
    const cleanKey = apiKey.replace(/^["']|["']$/g, '').trim();
    const effectiveModel = modelName || 'openrouter/free';
    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const buildPayload = (withResponseFormat: boolean) => ({
        model: effectiveModel,
        temperature: 0.2,
        ...(withResponseFormat ? { response_format: { type: 'json_object' } } : {}),
        messages: [
            { role: 'system', content: MGB_AI_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
        ]
    });

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`,
        'HTTP-Referer': 'https://inde.gov.br',
        'X-Title': 'DBDG INDE - Avaliador Semantico MGB'
    };

    let response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(buildPayload(true))
    });

    // Se o modelo OpenRouter falhar devido a response_format (alguns modelos gratuitos não suportam strict json_object), tenta sem ele
    if (!response.ok && response.status === 400) {
        const errPeek = await response.clone().text();
        if (errPeek.includes('response_format') || errPeek.includes('structured') || errPeek.includes('schema') || errPeek.includes('support')) {
            response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(buildPayload(false))
            });
        }
    }

    // Se o modelo OpenRouter retornar 404 ("unavailable for free") ou 429 ("rate-limited upstream"),
    // aciona contingência automática via "openrouter/free"
    let modelUsed = effectiveModel;
    if (!response.ok && (response.status === 404 || response.status === 429)) {
        const errPeek = await response.clone().text();
        if (errPeek.includes('unavailable for free') || errPeek.includes('rate-limited') || errPeek.includes('temporarily') || effectiveModel !== 'openrouter/free') {
            console.warn(`Modelo ${effectiveModel} no OpenRouter retornou ${response.status}. Tentando contingência com openrouter/free...`);
            const fallbackResponse = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: 'openrouter/free',
                    temperature: 0.2,
                    messages: [
                        { role: 'system', content: MGB_AI_SYSTEM_PROMPT },
                        { role: 'user', content: prompt }
                    ]
                })
            });
            if (fallbackResponse.ok) {
                response = fallbackResponse;
                modelUsed = 'openrouter/free';
            }
        }
    }

    if (!response.ok) {
        const errText = await response.text();
        if (response.status === 401) {
            throw new Error('Chave da API OpenRouter inválida (401). Obtenha sua chave gratuita em https://openrouter.ai/settings/keys.');
        }
        if (response.status === 404) {
            throw new Error(`O modelo gratuito solicitado (${effectiveModel}) está temporariamente indisponível no OpenRouter. Selecione "OpenRouter Free Router (openrouter/free)" nas configurações.`);
        }
        if (response.status === 429) {
            throw new Error('Limite de taxa (rate limit) excedido no OpenRouter (429). Aguarde alguns segundos ou troque para "OpenRouter Free Router (openrouter/free)".');
        }
        throw new Error(`Falha na API OpenRouter (${response.status}): ${errText}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error(`Nenhuma resposta de texto retornada pelo modelo ${modelUsed} no OpenRouter.`);
    }

    const parsed = cleanJsonOutput(content);
    return {
        ...parsed,
        provider: 'openrouter',
        model: modelUsed,
        evaluatedAt: new Date().toISOString()
    };
}

/**
 * Chamada à API Groq (groq.com).
 * Provedor com inferência ultra-rápida e cota gratuita generosa para Llama 3.3 70B, etc.
 */
async function callGroqApi(
    prompt: string,
    apiKey: string,
    modelName = 'llama-3.3-70b-versatile'
): Promise<MGBSemanticEvaluation> {
    const cleanKey = apiKey.replace(/^["']|["']$/g, '').trim();
    const effectiveModel = modelName || 'llama-3.3-70b-versatile';
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const payload = {
        model: effectiveModel,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: MGB_AI_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
        ]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        if (response.status === 401) {
            throw new Error('Chave da API Groq inválida (401). Obtenha sua chave gratuita em https://console.groq.com/keys.');
        }
        throw new Error(`Falha na API Groq (${response.status}): ${errText}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error(`Nenhuma resposta retornada pelo Groq (${effectiveModel}).`);
    }

    const parsed = cleanJsonOutput(content);
    return {
        ...parsed,
        provider: 'groq',
        model: effectiveModel,
        evaluatedAt: new Date().toISOString()
    };
}

/**
 * Chamada a API OpenAI-compatível (ex: OpenAI, Ollama, etc.).
 */
async function callOpenAiApi(
    prompt: string,
    apiKey: string,
    endpoint = 'https://api.openai.com/v1',
    modelName = 'gpt-4o-mini'
): Promise<MGBSemanticEvaluation> {
    const cleanKey = apiKey.replace(/^["']|["']$/g, '').trim();
    const url = `${endpoint.replace(/\/+$/, '')}/chat/completions`;

    const payload = {
        model: modelName,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: MGB_AI_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
        ]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429 && (errText.includes('insufficient_quota') || errText.includes('credit_balance_exhausted'))) {
            throw new Error('Sua conta OpenAI está sem saldo de créditos (insufficient_quota). A API paga da OpenAI requer créditos pré-pagos cadastrados em https://platform.openai.com/settings/organization/billing/. Enquanto não houver créditos na OpenAI, utilize o motor Google Gemini ou OpenRouter (:free) nas configurações.');
        }
        throw new Error(`Falha na API OpenAI (${response.status}): ${errText}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('Nenhuma resposta de texto retornada pela API compatível com OpenAI.');
    }

    const parsed = cleanJsonOutput(content);
    return {
        ...parsed,
        provider: 'openai',
        model: modelName,
        evaluatedAt: new Date().toISOString()
    };
}

/**
 * Orquestrador principal da avaliação semântica.
 */
export async function evaluateMetadataSemantics(
    req: MGBAIEvaluationRequest,
    envKeys?: { geminiKey?: string; openAiKey?: string; openRouterKey?: string; groqKey?: string }
): Promise<MGBSemanticEvaluation> {
    if (!req.metadataXml && !req.metadataUrl) {
        throw new Error('O XML ou a URL do metadado deve ser informada para avaliação.');
    }

    let xmlText = req.metadataXml || '';
    if (!xmlText && req.metadataUrl) {
        const res = await fetch(req.metadataUrl);
        if (!res.ok) throw new Error(`Falha ao obter XML de ${req.metadataUrl}`);
        xmlText = await res.text();
    }

    const extracted = extractSemanticDataFromXml(xmlText);

    // Determina quadro efetivo
    let effectiveQuadro: MGBEffectiveQuadroId = '85';
    if (!req.quadroId || req.quadroId === 'AUTO') {
        // Detecta via tags
        if (xmlText.includes('MD_ScopeCode') && xmlText.includes('codeListValue="service"')) {
            effectiveQuadro = '87';
        } else if (xmlText.includes('scaleDenominator') || xmlText.includes('SCN')) {
            effectiveQuadro = '86';
        } else {
            effectiveQuadro = '85';
        }
    } else {
        effectiveQuadro = req.quadroId;
    }

    const geminiKey = req.apiKey || envKeys?.geminiKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
    const openAiKey = (req.provider === 'openai' ? req.apiKey : '') || envKeys?.openAiKey || (typeof process !== 'undefined' ? process.env?.OPENAI_API_KEY : '');
    const openRouterKey = (req.provider === 'openrouter' ? req.apiKey : '') || envKeys?.openRouterKey || (typeof process !== 'undefined' ? process.env?.OPENROUTER_API_KEY : '');
    const groqKey = (req.provider === 'groq' ? req.apiKey : '') || envKeys?.groqKey || (typeof process !== 'undefined' ? process.env?.GROQ_API_KEY : '');

    // Se o usuário selecionou explicitamente heurístico
    if (req.provider === 'heuristic') {
        return evaluateMetadataHeuristically(extracted, effectiveQuadro);
    }

    // Se o usuário selecionou explicitamente OpenRouter
    if (req.provider === 'openrouter') {
        if (!openRouterKey) {
            throw new Error('Chave da API OpenRouter não encontrada. Configure OPENROUTER_API_KEY no arquivo .env ou informe sua chave nas configurações do modal (ícone ⚙️). Chaves gratuitas disponíveis em https://openrouter.ai/settings/keys.');
        }
        if (openRouterKey.startsWith('AQ.') || openRouterKey.startsWith('AIza')) {
            throw new Error('A chave informada pertence ao Google Gemini (inicia com "AQ." ou "AIza"), mas o motor selecionado é o OpenRouter. As chaves do OpenRouter iniciam com "sk-or-".');
        }
        const prompt = buildSemanticPrompt(extracted, effectiveQuadro);
        return await callOpenRouterApi(prompt, openRouterKey, req.modelName || 'openrouter/free');
    }

    // Se o usuário selecionou explicitamente Groq
    if (req.provider === 'groq') {
        if (!groqKey) {
            throw new Error('Chave da API Groq não encontrada. Configure GROQ_API_KEY no arquivo .env ou informe sua chave nas configurações do modal (ícone ⚙️). Chaves gratuitas disponíveis em https://console.groq.com/keys.');
        }
        const prompt = buildSemanticPrompt(extracted, effectiveQuadro);
        return await callGroqApi(prompt, groqKey, req.modelName);
    }

    // Se o usuário selecionou explicitamente Gemini
    if (req.provider === 'gemini') {
        if (!geminiKey) {
            throw new Error('Chave da API Gemini não encontrada. Configure GEMINI_API_KEY no arquivo .env ou informe sua chave nas configurações do modal (ícone ⚙️).');
        }
        if (geminiKey.startsWith('sk-')) {
            throw new Error('A chave informada pertence à OpenAI / OpenRouter (inicia com "sk-"), mas o motor selecionado é o Google Gemini. Alterne o motor ou informe uma chave válida do Google Gemini (obtida no Google AI Studio).');
        }
        const prompt = buildSemanticPrompt(extracted, effectiveQuadro);
        return await callGeminiApi(prompt, geminiKey, req.modelName);
    }

    // Se o usuário selecionou explicitamente OpenAI
    if (req.provider === 'openai') {
        if (!openAiKey) {
            throw new Error('Chave da API OpenAI não encontrada. Configure OPENAI_API_KEY no arquivo .env ou informe sua chave nas configurações do modal (ícone ⚙️).');
        }
        if (openAiKey.startsWith('AQ.') || openAiKey.startsWith('AIza')) {
            throw new Error('A chave informada pertence ao Google Gemini (inicia com "AQ." ou "AIza"), mas o motor selecionado é o OpenAI / ChatGPT. Para usar o ChatGPT, informe uma chave válida da OpenAI (iniciada em "sk-", obtida em platform.openai.com/api-keys) ou alterne o motor para "Google Gemini API".');
        }
        const prompt = buildSemanticPrompt(extracted, effectiveQuadro);
        return await callOpenAiApi(prompt, openAiKey, req.apiEndpoint, req.modelName);
    }

    // Modo 'auto' ou provedor não especificado
    if (geminiKey) {
        try {
            const prompt = buildSemanticPrompt(extracted, effectiveQuadro);
            return await callGeminiApi(prompt, geminiKey, req.modelName);
        } catch (err) {
            console.warn('Falha na chamada Gemini em modo automático:', err);
        }
    }

    if (openRouterKey) {
        try {
            const prompt = buildSemanticPrompt(extracted, effectiveQuadro);
            return await callOpenRouterApi(prompt, openRouterKey, req.modelName || 'openrouter/free');
        } catch (err) {
            console.warn('Falha na chamada OpenRouter em modo automático:', err);
        }
    }

    if (groqKey) {
        try {
            const prompt = buildSemanticPrompt(extracted, effectiveQuadro);
            return await callGroqApi(prompt, groqKey, req.modelName);
        } catch (err) {
            console.warn('Falha na chamada Groq em modo automático:', err);
        }
    }

    if (openAiKey) {
        try {
            const prompt = buildSemanticPrompt(extracted, effectiveQuadro);
            return await callOpenAiApi(prompt, openAiKey, req.apiEndpoint, req.modelName);
        } catch (err) {
            console.warn('Falha na chamada OpenAI em modo automático:', err);
        }
    }

    // Padrão sem chave: Heurístico
    return evaluateMetadataHeuristically(extracted, effectiveQuadro);
}
