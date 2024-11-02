import eslintPluginTypescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts'], // Áp dụng cho các file TypeScript
    languageOptions: {
      parser: typescriptParser, // Sử dụng `languageOptions.parser`
    },
    plugins: {
      '@typescript-eslint': eslintPluginTypescript,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      // '@typescript-eslint/no-explicit-any': 'error',
      'prefer-const': 'error',
      'no-console': 'off',
    },
  },
  {
    ignores: ['dist', 'node_modules'],
  },
];
