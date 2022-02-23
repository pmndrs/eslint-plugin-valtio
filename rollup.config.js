import path from 'path'
import babelPlugin from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'

const createBabelConfig = require('./babel.config')

const { root } = path.parse(process.cwd())
const extensions = ['.js']

function external(id) {
  return !id.startsWith('.') && !id.startsWith(root)
}

function getBabelOptions(targets) {
  return {
    ...createBabelConfig({ env: (env) => env === 'build' }, targets),
    extensions,
    comments: false,
    babelHelpers: 'bundled',
  }
}

function createCommonJSConfig(input, output) {
  return {
    input,
    output: { file: `${output}.js`, format: 'cjs', exports: 'named' },
    external,
    plugins: [
      resolve({ extensions }),
      babelPlugin(getBabelOptions({ ie: 11 })),
    ],
  }
}

export default function () {
  return [createCommonJSConfig(`src/index.js`, `dist/index`)]
}
