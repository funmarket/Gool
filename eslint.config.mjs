import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/prisma/migrations/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['apps/miniapp/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use shared/api/http-client.ts.' },
      ],
    },
  },
  {
    files: ['apps/miniapp/src/shared/api/http-client.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
  {
    files: ['apps/api/src/http/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['@gool/database', '**/infrastructure/database/**'] },
      ],
    },
  },
);
