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
- páginas da aplicação;
- layouts;
- parâmetros de rota;
- carregamento de dados associado à navegação;
- endpoints quando houver.

As rotas devem focar orquestração, fluxo de tela e composição de componentes.

### `src/lib/components`
Responsável por:
- componentes reutilizáveis de interface;
- blocos visuais compartilhados;
- encapsulamento de padrões recorrentes de UI.

Os componentes devem ser pequenos, coesos e semanticamente nomeados.

### `src/lib/request`
Responsável por:
- chamadas HTTP;

Evitar espalhar lógica de comunicação diretamente por páginas e componentes.

### `src/lib/shared`
Responsável por:
- estado compartilhado entre partes da aplicação;
- sincronização de estado quando necessário;
- abstrações de estado reutilizáveis.

Usar apenas quando o compartilhamento realmente fizer sentido.

### `src/lib/utils`
Responsável por:
- funções auxiliares puras;
- transformação de dados;
- lógica reaproveitável sem dependência forte de UI.

### `src/lib/metadata`
Responsável por:

-  parser para metadados através da ISO 19115.

### `src/lib/inde`
Responsável por:
-  adapatações de chamadas aos geosserviços

### `src/lib/ogc`
-  Tratamentos dos serviços OGC: WMS, WFS, WCS, CSW

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