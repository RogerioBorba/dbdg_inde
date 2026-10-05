// src/routes/api/ai/avaliar-metadado/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { evaluateMetadataSemantics } from '$lib/ai/mgbSemanticEvaluator';
import type { MGBAIEvaluationRequest, MGBAIEvaluationResponse } from '$lib/ai/types';
import { get } from '$lib/request/get';

function buildGetRecordByIdUrl(baseIri: string, id: string): string {
    const baseUrl = baseIri.split('?')[0];
    return `${baseUrl}?service=CSW&version=2.0.2&request=GetRecordById&elementSetName=full&outputSchema=csw:IsoRecord&id=${encodeURIComponent(id)}`;
}

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

        // Chaves de ambiente do servidor (opcionais)
        const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
        const openAiKey = process.env.OPENAI_API_KEY;

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
