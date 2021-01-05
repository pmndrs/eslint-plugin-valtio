const functionTypes = ['ArrowFunctionExpression', 'FunctionExpression']
const callExpressions = ['JSXExpressionContainer', 'CallExpression']
export const PROXY_RENDER_PHASE_MESSAGE =
  'Using proxies in the render phase would cause unexpected problems.'
export const SNAPSHOT_CALLBACK_MESSAGE = 'Better to just use proxy state'

function which(name, scope) {
  let kind = null

  if (!scope) return kind

  scope.variables.forEach((variable) => {
    const def = variable.defs[0]
    if (!def || variable.name !== name) return

    const init = def.node.init
    if (!init) return
    if (init.type === 'Identifier') {
      return (kind = which(init.name, scope))
    } else if (init.type === 'CallExpression' && init.callee.name === 'proxy') {
      return (kind = 'state')
    } else if (
      init.type === 'CallExpression' &&
      init.callee.name === 'useProxy'
    ) {
      return (kind = 'snapshot')
    }
  })
  if (!kind && scope.upper) return (kind = which(name, scope.upper))

  return kind
}

function isInCallback(node) {
  if (!node.parent || !node.parent.type) return false

  if (
    callExpressions.includes(node.parent.type) &&
    functionTypes.includes(node.type)
  ) {
    return true
  } else {
    return isInCallback(node.parent)
  }
}

function isInRender(node) {
  if (!node.parent || !node.parent.type) return false

  if (isInCallback(node)) return false
  if (node.parent.type.toLowerCase().includes('jsx')) {
    return true
  } else {
    return isInRender(node.parent)
  }
}
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
      Identifier(node) {
        const scope = context.getScope(node)
        if (
          node.parent.type === 'MemberExpression' &&
          node.parent.property === node
        )
          return
        const kind = which(node.name, scope)
        if (kind === 'state' && isInRender(node)) {
          return context.report({
            node,
            message: PROXY_RENDER_PHASE_MESSAGE,
          })
        }
        if (kind === 'snapshot' && isInCallback(node)) {
          return context.report({
            node,
            message: SNAPSHOT_CALLBACK_MESSAGE,
          })
        }
      },
    }
  },
}
