# Arquitetura do Projeto

## Objetivo
O projeto `dbdg_inde` é uma aplicação web construída com SvelteKit, Svelte 5, Tailwind CSS e TypeScript.

A arquitetura deve favorecer:
- organização clara entre rotas, componentes, estado e serviços;
- boa experiência de manutenção;
- tipagem consistente;
- interface previsível;
- evolução incremental sem acoplamento desnecessário.

## Princípios arquiteturais
- separar apresentação, estado e acesso a dados;
- manter componentes pequenos e reutilizáveis;
- evitar duplicação de lógica;
- Código que funcione com a menor tamanho possível;
- centralizar contratos e integrações;
- preservar clareza da reatividade;
- manter alinhamento com o fluxo idiomático do SvelteKit.

## Estrutura sugerida

### `src/routes`
Responsável por:
- páginas da aplicação e layouts;
- orquestração e fluxo de tela;
- carregamento de dados associado à navegação;
- endpoints server-side (`src/routes/api/`), incluindo proxy transparente (`/api/get`), adaptadores de formato (`/get-json-response`, `/get-xml-response`) e integração INDE (`/api/inde/`).

### `src/lib/components`
Responsável por:
- componentes reutilizáveis de interface;
- blocos visuais compartilhados e encapsulamento de padrões de UI;
- componentes cartográficos separados por renderizador (`openlayers/` e `map_libre/`);
- componentes de metadados (`metadata/MetadataViewer.svelte` para renderização completa de documentos ISO 19115 / CSW);
- componentes de geosserviços e CSW (`ogc/csw/MGBMetadataCard.svelte`, `CSWCatalogSelector.svelte`);
- geradores de saída no cliente (`pdf/` e `csv/`).

Os componentes devem ser pequenos, coesos e semanticamente nomeados.

### `src/lib/request`
Responsável por:
- comunicação HTTP compartilhada do lado do cliente;
- centralização do redirecionamento para o proxy interno quando necessário.

Evitar espalhar lógica de comunicação diretamente por páginas e componentes.

### `src/lib/shared`
Responsável por:
- estado reativo compartilhado entre páginas e componentes usando Runes do Svelte 5 (`$state`, `$derived`);
- gerenciamento de catálogos ativos, camadas e seleção geográfica (BBOX).

Usar apenas quando o compartilhamento realmente fizer sentido.

### `src/lib/utils`
Responsável por:
- funções auxiliares puras;
- transformação e normalização de dados;
- lógica reaproveitável sem dependência de UI ou estado do navegador.

### `src/lib/metadata`
Responsável por:
- parsing, validação e modelos de metadados na norma ISO 19115 / ISO 19139.

### `src/lib/inde`
Responsável por:
- integrações e adaptações específicas para as APIs e catálogos da INDE e do IBGE.

### `src/lib/ogc`
Responsável por:
- modelos de domínio, parsers XML e construtores de requisição dos padrões OGC: WMS, WFS, WCS e CSW;
- regras normativas e validador do Perfil MGB 2.0 da INDE (`src/lib/ogc/csw/mgb/mgbConformance.ts`), com suporte à detecção automática de escopo e avaliação dos Quadros 84, 85, 86 e 87.

### `src/lib/types`
Responsável por:
- contratos de domínio compartilhados, interfaces e definições TypeScript transversais.

### `tests`
Responsável por:
- testes unitários e de regressão executados com o test runner nativo do Node.js (`node:test`);
- validação de regras de conformidade MGB, parsers de XML, transformações de BBOX e comportamento puro com fixtures estáticas.

## Diretrizes de responsabilidade
- lógica de apresentação deve ficar em componentes e páginas;
- integração externa deve ficar concentrada em services;
- contratos devem ficar tipados e reutilizáveis;
- transformações de dados devem ser explícitas;
- estado compartilhado deve ser limitado ao necessário.

## Fluxo conceitual
De forma simplificada:

1. a navegação entra por uma rota;
2. a rota ou layout obtém os dados necessários;
3. serviços fazem a comunicação externa;
4. tipos definem o contrato dos dados;
5. componentes recebem os dados e exibem a interface;
6. estado local ou compartilhado coordena interações do usuário.

## Convenções recomendadas
- componentes reutilizáveis em `src/lib/components`;
- chamadas a API em `src/routes/api`;
- helpers puros em `src/lib/utils`;
- evitar colocar regra transversal diretamente em arquivos de rota.

## Tailwind CSS
- usar Tailwind de forma consistente;
- evitar poluição visual por classes excessivas;
- consolidar padrões recorrentes em componentes;
- manter coerência entre espaçamento, tipografia e estados visuais.

## TypeScript
- evitar `any`;
- manter contratos próximos do domínio da aplicação;
- tipar props, respostas de API e estruturas compartilhadas;
- revisar impacto de qualquer mudança de tipo em cadeia.

## Segurança e Comunicação de Rede (Proxy HTTP)
- O proxy server-side em `src/routes/api/get/+server.ts` existe para contornar restrições de CORS impostas por navegadores ao consumir servidores da INDE/IBGE.
- **Proteção contra SSRF:** Requisições a localhost (`127.0.0.1`, `::1`), redes locais privadas (RFC 1918) ou esquemas que não sejam `http:` / `https:` devem ser bloqueadas.
- **Validação de TLS:** Não desative globalmente a validação TLS via `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'`. Quando for estritamente indispensável para certificados legados da INDE, restrinja o bypass ao dispatcher HTTP da requisição específica.
- **Resiliência:** Manter timeout explícito (ex: 30s-65s) com `AbortController` e repassar códigos de status HTTP e `Content-Type` adequados para o cliente.

## Qualidade de Código e Testes
- **Tipagem Estrita:** Uso de TypeScript 5 com validação estrita via `npm run check` (`svelte-check`).
- **Linter & Boas Práticas:** Padronização com ESLint (Flat Config) para regras de qualidade e consistência em TypeScript e Svelte 5.
- **Testes Unitários:** Concentrados em `tests/`, focados em lógica pura (parsers XML de WMS/WFS/WCS/CSW, normalização de metadados e manipulação de BBOX).
- **Fixtures Determinísticas:** Utilizar payloads XML gravados em vez de depender da disponibilidade de servidores externos em tempo de teste.

## Manutenção
Ao alterar a arquitetura, verificar:
- impacto nas rotas existentes;
- impacto nos componentes reutilizáveis;
- impacto em tipagem compartilhada;
- risco de duplicação de lógica;
- impacto em navegação, carregamento e renderização.

## Evolução
Novas funcionalidades devem:
- respeitar a estrutura do SvelteKit;
- preservar simplicidade;
- melhorar a legibilidade do projeto;
- evitar acoplamento excessivo;
- manter clareza sobre onde cada responsabilidade pertence.