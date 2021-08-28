import { isInSomething, nearestCalleeName } from './lib/utils'

export const MESSAGE_THIS_IN_PROXY = `Avoid using \`this\` in valtio.proxy context.It might lead to unexpected results.
Using this is valid, but often a pitfall for beginners.`

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Warns about unexpected problems',
      category: 'Unexpected Problems',
      recommended: 'true',
    },
  },
  create(context) {
    return {
      ThisExpression(node) {
        if (isInSomething(node, 'CallExpression') && isCalledByProxy(node)) {
          context.report({
            node,
            message: MESSAGE_THIS_IN_PROXY,
          })
        }
      },
    }
  },
}

function isCalledByProxy(node) {
  if (nearestCalleeName(node) !== 'proxy') {
    return false
  }
  return true
}
