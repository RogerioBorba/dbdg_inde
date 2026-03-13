# DBDG INDE

Aplicacao web em **SvelteKit** para consulta, analise e visualizacao de servicos geoespaciais (OGC), com foco em catalogos e servicos da INDE.

Repositorio oficial:
`https://github.com/RogerioBorba/dbdg_inde`

## Aviso Importante

Este projeto esta em **desenvolvimento ativo**.

- Nao ha garantias de estabilidade, disponibilidade ou compatibilidade.
- Nao ha garantias de adequacao para uso em producao.
- Funcionalidades, rotas e comportamento podem mudar sem aviso previo.

Use por sua conta e risco.

## Requisitos

- Git
- Node.js 20 ou superior
- npm 10 ou superior

## Instalacao (passo a passo)

1. Clonar o repositorio:

```bash
git clone https://github.com/RogerioBorba/dbdg_inde.git
```

2. Entrar na pasta do projeto:

```bash
cd dbdg_inde
```

3. Instalar dependencias:

```bash
npm install
```

4. Sincronizar arquivos do SvelteKit (opcional, recomendado):

```bash
npm run prepare
```

## Executar em desenvolvimento

```bash
npm run dev
```

Servidor padrao do Vite:
`http://localhost:5173`

Para expor na rede local:

```bash
npm run dev -- --host
```

## Verificacao de tipos e Svelte

```bash
npm run check
```

## Gerar build de producao

```bash
npm run build
```

## Pre-visualizar build local

```bash
npm run preview
```

## Scripts disponiveis

- `npm run dev`: inicia ambiente de desenvolvimento
- `npm run build`: gera build de producao
- `npm run preview`: sobe servidor para preview do build
- `npm run prepare`: roda `svelte-kit sync`
- `npm run check`: validacao de tipos e Svelte
- `npm run check:watch`: validacao continua em modo watch

## Stack principal

- SvelteKit
- Svelte 5
- Vite
- Tailwind CSS 4
- Flowbite / Flowbite Svelte
- OpenLayers / MapLibre / deck.gl
