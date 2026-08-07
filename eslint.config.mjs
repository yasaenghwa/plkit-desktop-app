import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['node_modules/', 'out/', 'dist/', 'coverage/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/renderer/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@app/*'],
              message: 'FSD 하위 레이어는 app 레이어를 참조할 수 없습니다.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/renderer/widgets/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@app/*', '@pages/*'],
              message: 'widgets는 app 또는 pages 레이어를 참조할 수 없습니다.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/renderer/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@app/*', '@pages/*', '@widgets/*'],
              message: 'features는 app, pages 또는 widgets 레이어를 참조할 수 없습니다.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/renderer/entities/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@app/*', '@pages/*', '@widgets/*', '@features/*'],
              message: 'entities는 상위 FSD 레이어를 참조할 수 없습니다.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/renderer/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@app/*', '@pages/*', '@widgets/*', '@features/*', '@entities/*'],
              message: 'shared는 상위 FSD 레이어를 참조할 수 없습니다.',
            },
          ],
        },
      ],
    },
  },
);
