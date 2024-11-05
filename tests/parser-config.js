const eslintVersion = require('eslint/package.json').version
const semver = require('semver')

export function getParserConfig() {
  if (semver.satisfies(eslintVersion, '>=9')) {
    return getEslintv9Config()
  }
  return getEslintv8Config()
}

function getEslintv9Config() {
  return {
    languageOptions: {
      parser: require('@babel/eslint-parser'),
      ecmaVersion: 6,
      sourceType: 'module',
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          parserOpts: {
            plugins: ['jsx'],
          },
        },
      },
    },
  }
}

function getEslintv8Config() {
  return {
    parserOptions: {
      requireConfigFile: false,
      ecmaVersion: 6,
      babelOptions: {
        babelrc: false,
        configFile: false,
        parserOpts: {
          plugins: ['jsx'],
        },
      },
    },
    parser: require.resolve('@babel/eslint-parser'),
  }
}
