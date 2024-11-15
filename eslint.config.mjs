import eslintPluginTypescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import eslint from '@eslint/js';
export default [
  {
    // Áp dụng cho các file TypeScript
    files: ['**/*.ts'],
    // Sử dụng `languageOptions.parser`
    languageOptions: {
      parser: typescriptParser,
      globals: {
        console: 'readonly',
        Buffer: 'readonly',
        // Khai báo 'module' cho môi trường Node.js
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        // Nếu bạn đang sử dụng Express
        Express: 'readonly',
        // Nếu bạn sử dụng Document
        Document: 'readonly',
      },
    },

    plugins: {
      '@typescript-eslint': eslintPluginTypescript,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      // '@typescript-eslint/no-explicit-any': 'error',
      'prefer-const': 'error',
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
  {
    ignores: ['dist', 'node_modules', '**/test/**'],
  },

  eslint.configs.recommended,
  prettierConfig,
];
