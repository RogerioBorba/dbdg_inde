import type { RequestHandler } from './$types';
import { inspecionarLinkRemoto } from '#lib/request/verificarLinkRemoto.js';

export const GET: RequestHandler = async ({ url, request }) => {
  const target = url.searchParams.get('url');
  if (!target) {
    return Response.json({ ok: false, status: 400, error: 'Informe o destino na URL.' }, { status: 400 });
  }

  const resultado = await inspecionarLinkRemoto(target, { timeout: 20000 });
  return Response.json(resultado);
};
