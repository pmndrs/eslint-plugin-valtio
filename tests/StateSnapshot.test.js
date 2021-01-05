import { RuleTester } from 'eslint'
import rule from '../src/StateSnapshot'

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 6 } })

describe('valid tests', () => {
  it('create proxy', () => {
    ruleTester.run('state-snapshot-rule', rule, {
      valid: ['const state = proxy({ count: 0 }); state.count += 1'],
    })
  })

  // TODO
})

describe('invalid tests', () => {
  // TODO
})
