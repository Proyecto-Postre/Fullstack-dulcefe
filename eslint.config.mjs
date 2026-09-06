import tsPlugin from '@typescript-eslint/eslint-plugin'
import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      '.nuxt/**',
      '.output/**',
      '.vercel/**',
      '.nitro/**',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '**/*.d.ts',
      'app/types/database.types.ts'
    ]
  },
  ...tsPlugin.configs['flat/recommended'],
  ...vuePlugin.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue']
      }
    }
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      'vue/no-mutating-props': ['error', { shallowOnly: true }],
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/require-default-prop': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/attributes-order': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }]
    }
  }
]
