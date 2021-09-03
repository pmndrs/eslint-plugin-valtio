import {
  getParentOfNodeType,
  isInSomething,
  nearestCalleeName,
} from './lib/utils'

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
    const identifiersList = []
    return {
      Identifier(node) {
        const cachedIdentifier = getIdentifier(identifiersList, node.name)

        if (
          cachedIdentifier &&
          cachedIdentifier.hasThis &&
          isCalledByProxy(node)
        ) {
          context.report({
            node,
            message: MESSAGE_THIS_IN_PROXY,
          })
        }
      },
      ThisExpression(node) {
        const parent = getParentOfNodeType(node, 'VariableDeclarator')
        identifiersList.push({
          identifier: parent.id,
          definition: parent.init,
          hasThis: true,
        })

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

function getIdentifier(allIdentifiers, identifier) {
  for (let i = 0; i < allIdentifiers.length; i++) {
    if (allIdentifiers[i].identifier.name === identifier) {
      return allIdentifiers[i]
    }
  }
}

function isCalledByProxy(node) {
  if (nearestCalleeName(node) !== 'proxy') {
    return false
  }
  return true
}
