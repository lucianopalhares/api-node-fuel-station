
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      'src/modules/shared/validation/**/*.ts',
      'src/modules/imports/application/staging/ImportRowValidator.ts',
      'tests/validation/**/*.ts',
    ],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['tests/validation/*.ts'],
        },
      },
    },
  },
);
