export function getParserConfig() {
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
