import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import eslintPluginSolid from 'eslint-plugin-solid';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

export default [
    {
        ignores: ['node_modules/**', 'dist/**']
    },
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            parser: tseslintParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'solid': eslintPluginSolid,
            'prettier': eslintPluginPrettier,
            'import': eslintPluginImport
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json'
                }
            }
        },
        rules: {
            'prettier/prettier': ['error', {
                tabWidth: 4,
                useTabs: false,
                semi: false,
                singleQuote: true,
                trailingComma: 'all',
                printWidth: 80,
                arrowParens: 'avoid'
            }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
            'solid/reactivity': 'warn',
            'indent': 'off',

            'import/order': ['error', {
                'groups': [
                    ['builtin', 'external'],
                    'internal',
                    ['parent', 'sibling', 'index'],
                    'unknown'
                ],
                'pathGroups': [
                    {
                        'pattern': 'solid-js/**',
                        'group': 'external',
                        'position': 'before'
                    },
                    {
                        'pattern': '@solidjs/**',
                        'group': 'external',
                        'position': 'before'
                    },
                    {
                        'pattern': '~/lib/**',
                        'group': 'internal',
                        'position': 'before'
                    },
                    {
                        'pattern': '~/components/**',
                        'group': 'internal',
                        'position': 'before'
                    },
                    {
                        'pattern': '~/store',
                        'group': 'internal',
                        'position': 'before'
                    },
                    {
                        'pattern': '*.{css,scss,sass,less,styl}',
                        'group': 'unknown',
                        'patternOptions': { 'matchBase': true },
                        'position': 'after'
                    }
                ],
                'pathGroupsExcludedImportTypes': ['solid-js', '@solidjs'],
                'newlines-between': 'always',
                'alphabetize': {
                    'order': 'asc',
                    'caseInsensitive': true
                }
            }],
            'import/first': 'error',
            'import/newline-after-import': 'error',
            'import/no-duplicates': 'error'
        }
    },
    prettierConfig
]; 