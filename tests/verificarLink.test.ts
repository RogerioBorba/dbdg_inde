import assert from 'node:assert/strict';
import test from 'node:test';
import { verificarLink } from '../src/lib/request/verificarLink.ts';
import { inspecionarLinkRemoto } from '../src/lib/request/verificarLinkRemoto.ts';

test('estratégia híbrida no navegador: considera link válido quando HEAD direto responde com sucesso (200)', async () => {
  let directHeadCalled = false;
  let checkEndpointCalled = false;

  // Simula ambiente de navegador
  (globalThis as any).window = { location: { origin: 'http://localhost:5173' } };

  try {
    const mockFetcher: typeof fetch = async (input, init) => {
      const urlStr = String(input);
      if (urlStr.includes('/api/check-link')) {
        checkEndpointCalled = true;
        return new Response(JSON.stringify({ ok: true, status: 200 }));
      }
      if (init?.method === 'HEAD') {
        directHeadCalled = true;
        return new Response(null, { status: 200, statusText: 'OK' });
      }
      throw new Error('fetcher inesperado');
    };

    await verificarLink('https://example.test/recurso.zip', {
      fetcher: mockFetcher
    });

    assert.equal(directHeadCalled, true, 'HEAD direto deve ser tentado');
    assert.equal(checkEndpointCalled, false, 'Endpoint /api/check-link não deve ser chamado se HEAD direto funcionar');
  } finally {
    delete (globalThis as any).window;
  }
});

test('estratégia híbrida no navegador: quando HEAD direto é bloqueado por CORS, recorre ao /api/check-link', async () => {
  let directHeadCalled = false;
  let checkEndpointCalled = false;

  (globalThis as any).window = { location: { origin: 'http://localhost:5173' } };

  try {
    const mockFetcher: typeof fetch = async (input, init) => {
      const urlStr = String(input);
      if (urlStr.includes('/api/check-link')) {
        checkEndpointCalled = true;
        assert.ok(urlStr.includes(encodeURIComponent('https://panorama.sipam.gov.br/Banco.mdb')));
        return new Response(JSON.stringify({ ok: true, status: 200, statusText: 'OK' }));
      }
      if (init?.method === 'HEAD') {
        directHeadCalled = true;
        throw new TypeError('Failed to fetch (CORS block)');
      }
      throw new Error('fetcher inesperado');
    };

    await verificarLink('https://panorama.sipam.gov.br/Banco.mdb', {
      fetcher: mockFetcher
    });

    assert.equal(directHeadCalled, true, 'HEAD direto deve ser tentado primeiro');
    assert.equal(checkEndpointCalled, true, 'Endpoint /api/check-link deve ser chamado após falha de CORS');
  } finally {
    delete (globalThis as any).window;
  }
});

test('estratégia híbrida no navegador: propaga erro retornado pelo /api/check-link', async () => {
  (globalThis as any).window = { location: { origin: 'http://localhost:5173' } };

  try {
    const mockFetcher: typeof fetch = async (input, init) => {
      const urlStr = String(input);
      if (urlStr.includes('/api/check-link')) {
        return new Response(JSON.stringify({
          ok: false,
          status: 404,
          error: 'O serviço respondeu com erro HTTP 404.'
        }));
      }
      if (init?.method === 'HEAD') {
        throw new TypeError('Failed to fetch (CORS block)');
      }
      throw new Error('fetcher inesperado');
    };

    await assert.rejects(
      async () => {
        await verificarLink('https://panorama.sipam.gov.br/arquivo-inexistente.zip', {
          fetcher: mockFetcher
        });
      },
      {
        message: 'O serviço respondeu com erro HTTP 404.'
      }
    );
  } finally {
    delete (globalThis as any).window;
  }
});

test('inspecionarLinkRemoto rejeita endereços de rede local/privada (proteção SSRF)', async () => {
  const resultLocalhost = await inspecionarLinkRemoto('http://127.0.0.1:8080/segredo');
  assert.equal(resultLocalhost.ok, false);
  assert.equal(resultLocalhost.status, 502);
  assert.ok(resultLocalhost.error?.includes('Destino não permitido'));

  const resultLocalIP = await inspecionarLinkRemoto('http://192.168.1.1/config');
  assert.equal(resultLocalIP.ok, false);
  assert.ok(resultLocalIP.error?.includes('Destino não permitido'));
});

test('inspecionarLinkRemoto rejeita URLs com protocolos inválidos', async () => {
  const result = await inspecionarLinkRemoto('ftp://example.test/arquivo.zip');
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
});
