import { RuleTester } from 'eslint'
import rule, { MESSAGE_THIS_IN_PROXY } from '../src/AvoidThisInProxy'

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 6 },
  parser: require.resolve('babel-eslint'),
})

ruleTester.run('avoid-this-in-proxy', rule, {
  valid: [
    `
    export const store = proxy({
      toast: {
        success: null,
        error: null,
        open: false,
      },
      resetToast: () => {
        store.toast = {
          success: null,
          error: null,
          open: false,
        };
      },
    });
  `,
  ],
  invalid: [
    {
      code: `
      export const store = proxy({
        toast: {
          success: null,
          error: null,
          open: false,
        },
        resetToast() {
          this.toast = {
            success: null,
            error: null,
            open: false,
          };
        },
      });
      `,
      errors: [MESSAGE_THIS_IN_PROXY],
    },
  ],
})
