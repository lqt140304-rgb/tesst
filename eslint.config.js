import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const AUDIENCE_UI = ['src/features/public/**', 'src/features/auth/**', 'src/features/customer/**', 'src/features/booking/**'];

export default tseslint.config(
  {
    ignores: ['dist', 'dist-*', 'reference', 'review', 'test-results', 'playwright-report', '.superpowers',
      'src/features/public/hero/hero-orbit.js', 'docs'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-alert': 'error',
      'no-restricted-globals': ['error',
        { name: 'localStorage', message: 'Use the KV adapter (src/data/mock/store/kv.ts).' },
        { name: 'sessionStorage', message: 'Use the KV adapter (src/data/mock/store/kv.ts).' },
        { name: 'indexedDB', message: 'Use src/data/mock/store/blobs.ts.' }],
      'no-restricted-imports': ['error', { paths: [{ name: 'react-router', importNames: ['Link', 'NavLink', 'useNavigate'], message: 'Use AppLink / useAppNavigate from @/app/nav.' }] }],
    },
  },
  { files: ['src/data/mock/store/kv.ts', 'src/data/mock/store/blobs.ts', '**/*.test.ts', 'e2e/**'], rules: { 'no-restricted-globals': 'off' } },
  { files: ['src/app/nav.tsx', 'src/main.tsx', 'src/app/router.tsx'], rules: { 'no-restricted-imports': 'off' } },
  {
    files: AUDIENCE_UI,
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'react-router', importNames: ['Link', 'NavLink', 'useNavigate'], message: 'Use AppLink / useAppNavigate from @/app/nav.' }],
        patterns: [{ group: ['@/data/staff', '@/data/staff/*', '@/data/mock', '@/data/mock/*', '@/data/contracts/staff'], message: 'Customer-facing code may only use @/data/public and @/data/customer.' }],
      }],
    },
  },
  {
    files: ['src/data/mock/projections/customer/**'],
    rules: {
      'no-restricted-syntax': ['error',
        { selector: 'SpreadElement', message: 'Customer projections must list allowed fields explicitly.' },
        { selector: 'CallExpression[callee.object.name="Object"][callee.property.name="assign"]', message: 'Customer projections must list allowed fields explicitly.' }],
    },
  },
);
