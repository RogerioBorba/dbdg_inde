import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { RequestOptions } from 'node:https';
import { enderecoPublico, certificadoInvalido } from './proxySeguro.ts';

export interface ResultadoVerificacaoLink {
  ok: boolean;
  status: number;
  statusText?: string;
  error?: string;
}

interface RequestAttemptOptions {
  method: 'HEAD' | 'GET';
  signal: AbortSignal;
  rejectUnauthorized?: boolean;
}

async function dispararRequisicaoLeve(
  target: URL,
  attempt: RequestAttemptOptions
): Promise<{ status: number; statusText: string; location?: string }> {
  attempt.signal.throwIfAborted();

  const addresses = await new Promise<{ address: string; family: number }[]>((resolve, reject) => {
    const onAbort = () => reject(attempt.signal.reason);
    attempt.signal.addEventListener('abort', onAbort, { once: true });
    void lookup(target.hostname, { all: true })
      .then(resolve, reject)
      .finally(() => attempt.signal.removeEventListener('abort', onAbort));
  });

  attempt.signal.throwIfAborted();
  if (!addresses.length || addresses.some((item) => !enderecoPublico(item.address))) {
    throw new Error('Destino não permitido.');
  }

  const chosen = addresses[0];

  return new Promise((resolve, reject) => {
    const isHttps = target.protocol === 'https:';
    const requester = isHttps ? httpsRequest : httpRequest;

    const headers: Record<string, string> = {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    };

    if (attempt.method === 'GET') {
      // Solicita apenas 1 byte; servidores com suporte a Range respondem 206 Partial Content
      headers['Range'] = 'bytes=0-0';
    }

    const options: RequestOptions & { autoSelectFamily: boolean } = {
      method: attempt.method,
      signal: attempt.signal,
      rejectUnauthorized: attempt.rejectUnauthorized ?? true,
      autoSelectFamily: false,
      headers,
      lookup: (_hostname, _opts, callback) => callback(null, chosen.address, chosen.family)
    };

    const req = requester(target, options, (res) => {
      const status = res.statusCode ?? 502;
      const statusText = res.statusMessage ?? '';
      const location = res.headers.location;

      // Destroi o fluxo do corpo imediatamente para evitar transferir arquivos grandes
      res.resume();
      res.destroy();
      req.destroy();

      resolve({ status, statusText, location });
    });

    req.on('error', (err) => {
      req.destroy();
      reject(err);
    });

    req.end();
  });
}

/**
 * Inspeciona o link no lado do servidor:
 * - Valida endereço IP público (proteção SSRF)
 * - Tenta HEAD primeiro e faz fallback para GET com Range: bytes=0-0 se 405/501
 * - Segue redirecionamentos (3xx) com validação de segurança a cada salto
 * - Cancela imediatamente o socket após o recebimento dos cabeçalhos (sem baixar o corpo)
 */
export async function inspecionarLinkRemoto(
  urlInput: string,
  options: { timeout?: number; maxRedirects?: number } = {}
): Promise<ResultadoVerificacaoLink> {
  const { timeout = 15000, maxRedirects = 5 } = options;

  let currentUrl: URL;
  try {
    currentUrl = new URL(urlInput);
  } catch {
    return { ok: false, status: 400, error: 'URL inválida.' };
  }

  if (!['https:', 'http:'].includes(currentUrl.protocol)) {
    return { ok: false, status: 400, error: 'Protocolo não suportado.' };
  }

  if (currentUrl.username || currentUrl.password) {
    return { ok: false, status: 400, error: 'Destino não permitido.' };
  }

  const signal = AbortSignal.timeout(timeout);
  let redirectsCount = 0;

  try {
    while (true) {
      signal.throwIfAborted();

      // 1. Tenta primeiramente com HEAD
      let attemptResult: { status: number; statusText: string; location?: string } | null = null;
      try {
        attemptResult = await dispararRequisicaoLeve(currentUrl, { method: 'HEAD', signal });
      } catch (err: unknown) {
        if (currentUrl.protocol === 'https:' && certificadoInvalido(err) && !signal.aborted) {
          try {
            attemptResult = await dispararRequisicaoLeve(currentUrl, {
              method: 'HEAD',
              signal,
              rejectUnauthorized: false
            });
          } catch {
            // Falha no HEAD -> segue para tentativa com GET
          }
        }
      }

      // 2. Se HEAD não retornou sucesso (status >= 400, como 400 em ArcGIS Server ou 405/501 em outros servlets, ou exceção), tenta GET com Range
      if (!attemptResult || attemptResult.status >= 400) {
        try {
          attemptResult = await dispararRequisicaoLeve(currentUrl, { method: 'GET', signal });
        } catch (err: unknown) {
          if (currentUrl.protocol === 'https:' && certificadoInvalido(err) && !signal.aborted) {
            attemptResult = await dispararRequisicaoLeve(currentUrl, {
              method: 'GET',
              signal,
              rejectUnauthorized: false
            });
          } else {
            throw err;
          }
        }
      }

      // Trata redirecionamentos
      if ([301, 302, 303, 307, 308].includes(attemptResult.status) && attemptResult.location) {
        redirectsCount++;
        if (redirectsCount > maxRedirects) {
          return { ok: false, status: attemptResult.status, error: 'Excesso de redirecionamentos.' };
        }
        currentUrl = new URL(attemptResult.location, currentUrl.href);
        continue;
      }

      const isOk = (attemptResult.status >= 200 && attemptResult.status < 400);
      return {
        ok: isOk,
        status: attemptResult.status,
        statusText: attemptResult.statusText,
        error: isOk ? undefined : `O serviço respondeu com erro HTTP ${attemptResult.status}.`
      };
    }
  } catch (err: any) {
    if (signal.aborted) {
      return { ok: false, status: 504, error: 'O serviço excedeu o tempo limite.' };
    }
    return {
      ok: false,
      status: 502,
      error: err?.message || 'Falha ao conectar ao serviço.'
    };
  }
}
