import { isInSomething } from './lib/utils'

export const MESSAGE_THIS_IN_PROXY =
  'Avoid using `this` in valtio.proxy context. It might lead to unexpected results'

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
        if (isInSomething(node, 'CallExpression') && isInProxy(node)) {
          context.report({
            node,
            message: MESSAGE_THIS_IN_PROXY,
          })
        }
      },
    }
  },
}

function isInProxy(node) {
  if (
    node.parent &&
    node.parent.type !== 'Identifier' &&
    node.parent.name !== 'proxy'
  ) {
    return node.parent
  } else if (
    node.parent &&
    node.parent.type === 'Identifier' &&
    node.parent.name === 'proxy'
  ) {
    return true
  }
  return false
}
