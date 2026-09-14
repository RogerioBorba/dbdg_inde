# AGENTS.md

Orientações para agentes de IA que trabalham neste repositório.

## Visão geral

O DBDG INDE é uma aplicação web de consulta, análise e visualização de geosserviços da INDE. A aplicação usa SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS 4, Flowbite Svelte, OpenLayers, MapLibre GL e deck.gl.

Antes de alterar comportamento relevante, consulte:

- `README.md` para instalação e comandos;
- `src/docs/architecture.md` para responsabilidades das camadas;
- `src/docs/PRD.md` para escopo, requisitos e mapa de rotas.

## Ambiente e comandos

- Use Node.js 20+ e npm 10+.
- Instale dependências com `npm install`.
- Inicie o ambiente local com `npm run dev`.
- Execute a verificação de Svelte e TypeScript com `npm run check`.
- Gere a versão de produção com `npm run build`.
- Os testes existentes usam `node:test` e ficam em `tests/`. Ao alterar os módulos cobertos, execute o arquivo de teste correspondente em um runtime Node com suporte à execução de TypeScript.

Antes de concluir uma mudança de código, execute pelo menos `npm run check`. Para alterações de integração, rotas ou configuração, execute também `npm run build`.

## Organização do código

- `src/routes/`: páginas, layouts, carregamento de dados e endpoints SvelteKit. Mantenha as rotas focadas em orquestração e composição.
- `src/routes/api/`: endpoints server-side e proxies para serviços externos. Nunca importe código exclusivo do navegador aqui.
- `src/lib/components/`: componentes reutilizáveis. Os componentes de mapa são separados entre `openlayers/` e `map_libre/`.
- `src/lib/ogc/`: modelos, parsers e tratamento dos protocolos WMS, WFS, WCS e CSW.
- `src/lib/metadata/`: parsing e modelos de metadados ISO 19115.
- `src/lib/inde/`: integrações e adaptações dos catálogos/geosserviços da INDE.
- `src/lib/request/`: comunicação HTTP compartilhada.
- `src/lib/shared/`: estado reativo compartilhado e integrações reutilizadas por várias telas.
- `src/lib/types/`: contratos de domínio compartilhados.
- `tests/`: testes unitários, preferencialmente próximos ao comportamento puro extraído de componentes.

## Convenções de implementação

- Escreva código TypeScript estrito; não introduza `any` sem uma justificativa concreta.
- Use o alias `$lib` para imports internos quando ele tornar a dependência mais clara.
- Em Svelte, prefira os recursos idiomáticos do Svelte 5, incluindo runes (`$state`, `$derived` e `$effect`) quando houver estado reativo.
- Mantenha componentes pequenos e coesos. Extraia parsing, filtragem, transformação e construção de URLs para módulos TypeScript testáveis.
- Não duplique regras entre OpenLayers e MapLibre. Coloque comportamento independente do renderizador em módulos compartilhados.
- Preserve a separação entre apresentação, estado, domínio OGC e transporte HTTP.
- Use Tailwind CSS de forma consistente com as telas existentes e transforme padrões visuais repetidos em componentes.
- Mantenha nomes do domínio OGC quando forem termos normativos (`GetCapabilities`, `FeatureType`, `BBOX`, CRS etc.).
- Preserve textos de interface em português, salvo quando o protocolo, a API ou uma biblioteca exigir inglês.

## Integrações externas e segurança

- Considere servidores OGC lentos, instáveis ou incompatíveis. Trate timeout, aborto, respostas não OK e XML incompleto sem travar a interface.
- Requisições sujeitas a CORS devem passar pelas abstrações existentes em `src/lib/request/` e `src/routes/api/`; não espalhe soluções de proxy pelos componentes.
- Alterações no proxy devem validar protocolo e destino e não podem ampliar acesso a localhost, redes privadas ou hosts não confiáveis.
- Não desative validação TLS globalmente. Se uma exceção legada precisar ser modificada, limite-a à requisição estritamente necessária e documente o risco.
- Não registre tokens, credenciais, conteúdo sensível ou respostas externas completas no console.
- Preserve códigos HTTP e `Content-Type` relevantes ao repassar respostas externas.

## Testes e critérios de aceite

- Para bugs em lógica pura, adicione primeiro um teste de regressão em `tests/`.
- Cubra casos felizes e falhas comuns: versões OGC diferentes, campos ausentes, coordenadas inválidas, timeout e respostas malformadas.
- Evite testes que dependam de servidores públicos da INDE. Prefira fixtures pequenas e determinísticas.
- Para alterações cartográficas, verifique carregamento, remoção, projeção, BBOX e gerenciamento de camadas no renderizador afetado.
- Não considere a tarefa concluída com erros novos em `npm run check` ou `npm run build`.

## Escopo e manutenção

- Faça mudanças pequenas e focadas; não reformate nem renomeie arquivos sem relação com a tarefa.
- Preserve arquivos legados (`*.old`, `*.copy`, protótipos e rotas de teste) a menos que a tarefa peça explicitamente sua remoção.
- Atualize `src/docs/architecture.md` ou `src/docs/PRD.md` quando uma mudança alterar responsabilidades, fluxos, requisitos ou rotas documentadas.
- Não adicione dependências quando a plataforma ou uma dependência existente já resolver o problema adequadamente.
- Nunca inclua segredos, arquivos de ambiente locais, artefatos de build ou dependências instaladas no controle de versão.

## Entrega

Ao finalizar, informe de forma objetiva:

1. o que foi alterado;
2. quais validações foram executadas;
3. riscos, limitações ou validações manuais ainda necessárias.
