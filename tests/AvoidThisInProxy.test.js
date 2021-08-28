import { RuleTester } from 'eslint'
import rule, { MESSAGE_THIS_IN_PROXY } from '../src/AvoidThisInProxy'

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 6 },
  parser: require.resolve('babel-eslint'),
})

const testCases = {
  valid: [],
  invalid: [],
}

// Valid Cases *Start*

testCases.valid.push(`const state = proxy({
  count: 0,
  inc() {
    ++state.count
  },
})
`)

testCases.valid.push(`const state = proxy({
  count: 0,
  inc: function () {
    ++state.count
  },
})
`)

testCases.valid.push(`const state = proxy({
  count: 0,
  inc: () => {
    ++state.count
  },
})
`)

testCases.valid.push(`const state = proxy({
  arr: [],
  inc: () => {
    state.arr = [1, 2, 3].map(function (x) {
      return x / this
    }, 10)
  },
})`)

testCases.valid.push(`
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
`)

// Valid Cases *End*

// Invalid Cases *Start*

testCases.invalid.push({
  code: `const state = proxy({
    count: 0,
    inc: function () {
      ++this.count
    },
  })`,
  errors: [MESSAGE_THIS_IN_PROXY],
})

testCases.invalid.push({
  code: `const state = proxy({
    count: [],
    inc() {
      (() => { ++this.count })()
    },
  })`,
  errors: [MESSAGE_THIS_IN_PROXY],
})

// invalid (technically possible though)
testCases.invalid.push({
  code: `const state = proxy({
    count: 0,
    inc: () => {
      ++this.count
    },
  })
  `,
  errors: [MESSAGE_THIS_IN_PROXY],
})

testCases.invalid.push({
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
})

testCases.invalid.push({
  code: `const state = proxy({
    count: 0,
    inc() {
      ++this.count
    },
  })
  `,
  errors: [MESSAGE_THIS_IN_PROXY],
})

// Invalid Cases *End*

ruleTester.run('avoid-this-in-proxy', rule, testCases)
