import { json, type RequestHandler } from '@sveltejs/kit';
import { GEMINI_API_KEY, AI_API_KEY, OPENAI_API_KEY } from '$app/env/private';
import { evaluateMetadataSemantics } from '#lib/ai/mgbSemanticEvaluator.js';
import type { MGBAIEvaluationRequest, MGBAIEvaluationResponse } from '#lib/ai/types.js';
import { get } from '#lib/request/get.js';

import fs from 'node:fs';
import path from 'node:path';

function buildGetRecordByIdUrl(baseIri: string, id: string): string {
    const baseUrl = baseIri.split('?')[0];
    return `${baseUrl}?service=CSW&version=2.0.2&request=GetRecordById&elementSetName=full&outputSchema=csw:IsoRecord&id=${encodeURIComponent(id)}`;
}

function getEnvKeys(): { geminiKey?: string; openAiKey?: string } {
    let geminiKey = GEMINI_API_KEY || AI_API_KEY || process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    let openAiKey = OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    // Se alguma das chaves não estiver no ambiente de memória (ex: servidor Vite não foi reiniciado após editar .env),
    // lê diretamente o arquivo .env do disco
    if (!geminiKey || !openAiKey) {
        try {
            const possiblePaths = [
                path.resolve(process.cwd(), '.env'),
                path.resolve('c:/desenv/AI-projetos/dbdg_inde/.env'),
                path.resolve('c:/desenv/node-des/sveltekit-dev/dbdg_inde/.env')
            ];
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    const content = fs.readFileSync(p, 'utf-8');
                    for (const line of content.split(/\r?\n/)) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith('#')) continue;
                        const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
                        if (match) {
                            const k = match[1];
                            let v = match[2].trim();
                            // Remove aspas envolventes se houver
                            if (v.startsWith('"') && v.endsWith('"') || v.startsWith("'") && v.endsWith("'")) {
                                v = v.slice(1, -1);
                            }
                            if ((k === 'GEMINI_API_KEY' || k === 'AI_API_KEY') && !geminiKey) {
                                geminiKey = v;
                            }
                            if (k === 'OPENAI_API_KEY' && !openAiKey) {
                                openAiKey = v;
                            }
                        }
                    }
                    if (geminiKey && openAiKey) break;
                }
            }
        } catch (e) {
            console.warn('Erro ao ler .env do disco:', e);
        }
    }

    // Limpa eventuais aspas residuais
    if (geminiKey) geminiKey = geminiKey.replace(/^["']|["']$/g, '').trim();
    if (openAiKey) openAiKey = openAiKey.replace(/^["']|["']$/g, '').trim();

    return { geminiKey, openAiKey };
}

export const GET: RequestHandler = async () => {
    const { geminiKey, openAiKey } = getEnvKeys();
    return json({
        hasGemini: Boolean(geminiKey),
        hasOpenAi: Boolean(openAiKey)
    });
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        let reqData: MGBAIEvaluationRequest;
        try {
            reqData = await request.json();
        } catch {
            return json(
                { success: false, error: 'Corpo da requisição inválido. Envie um JSON.' } satisfies MGBAIEvaluationResponse,
                { status: 400 }
            );
        }

        // Se o client enviou x-api-key no header, tem precedência
        const headerApiKey = request.headers.get('x-api-key') || undefined;
        if (headerApiKey && !reqData.apiKey) {
            reqData.apiKey = headerApiKey;
        }

        // Se não possui XML direto mas possui catalogIri e metadataId ou metadataUrl, busca o XML
        if (!reqData.metadataXml) {
            let fetchUrl = reqData.metadataUrl;
            if (!fetchUrl && reqData.catalogIri && reqData.metadataId) {
                fetchUrl = buildGetRecordByIdUrl(reqData.catalogIri, reqData.metadataId);
            }

            if (fetchUrl) {
                const upstreamRes = await get(fetchUrl, {
                    headers: {
                        Accept: 'application/xml, text/xml, */*'
                    }
                });
                if (!upstreamRes.ok) {
                    return json(
                        { success: false, error: `Falha ao obter metadado do servidor CSW (${upstreamRes.status}).` } satisfies MGBAIEvaluationResponse,
                        { status: 502 }
                    );
                }
                reqData.metadataXml = await upstreamRes.text();
            } else {
                return json(
                    { success: false, error: 'Informe metadataXml, metadataUrl ou o par (catalogIri, metadataId).' } satisfies MGBAIEvaluationResponse,
                    { status: 400 }
                );
            }
        }

        // Chaves de ambiente do servidor (resolvidas dinamicamente com fallback no .env do disco)
        const { geminiKey, openAiKey } = getEnvKeys();

        const evaluation = await evaluateMetadataSemantics(reqData, {
            geminiKey,
            openAiKey
        });

        return json({
            success: true,
            evaluation
        } satisfies MGBAIEvaluationResponse);
    } catch (err) {
        console.error('Erro na avaliação semântica por IA:', err);
        const message = err instanceof Error ? err.message : 'Erro interno na avaliação de metadados.';
        return json(
            { success: false, error: message } satisfies MGBAIEvaluationResponse,
            { status: 500 }
        );
    }
};
