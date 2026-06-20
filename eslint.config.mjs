import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

export default defineConfig(
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/out',
      'init-db.js',
      'migrate.py',
      '*.config.js',
      'postcss.config.js',
      'tailwind.config.js'
    ]
  },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,
      // Relaxed rules for existing codebase
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react-refresh/only-export-components': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      // H1 — bug-022 money divisor guard. cents↔dollars dönüşümü her zaman
      // src/shared/money.ts içindeki toCents/fromCents üzerinden olmalı; /10000
      // yasak (30 → 0.30 olarak kaydedilmiştı). Refs: GROWTH_IDEAS H1, buglog bug-022.
      'no-restricted-syntax': [
        'error',
        {
          selector: "BinaryExpression[operator='/'][right.type='Literal'][right.value=10000]",
          message:
            'Division by 10000 is forbidden (bug-022). Use toCents/fromCents from src/shared/money.ts.'
        }
      ]
    }
  },
  eslintConfigPrettier
)
