import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    // Regras recomendadas para TypeScript
    ...tseslint.configs.recommended,

    // Regras recomendadas para arquivos Svelte
    ...svelte.configs['flat/recommended'],

    // Configuração do parser TypeScript dentro de arquivos .svelte
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser
            }
        }
    },

    // Pastas e arquivos a serem ignorados pelo linter
    {
        ignores: [
            'build/',
            '.svelte-kit/',
            'dist/',
            'node_modules/',
            '*.config.js',
            '*.config.ts'
        ]
    }
);