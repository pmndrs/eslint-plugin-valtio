import path from 'path'
import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import { sizeSnapshot } from 'rollup-plugin-size-snapshot'

const createBabelConfig = require('./babel.config')

const { root } = path.parse(process.cwd())
const external = (id) => !id.startsWith('.') && !id.startsWith(root)
const extensions = ['.js', '.ts', '.tsx']
const getBabelOptions = (targets) => ({
  ...createBabelConfig({ env: (env) => env === 'build' }, targets),
  extensions,
})

function createCommonJSConfig(input, output) {
  return {
    input,
    output: { file: output, format: 'cjs', exports: 'named' },
    external,
    plugins: [
      resolve({ extensions }),
      babel(getBabelOptions({ ie: 11 })),
      sizeSnapshot(),
    ],
  }
}

export default [createCommonJSConfig('src/index.js', 'dist/index.js')]
