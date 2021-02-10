const functionTypes = ['ArrowFunctionExpression', 'FunctionExpression']
const callExpressions = ['JSXExpressionContainer', 'CallExpression']
export const PROXY_RENDER_PHASE_MESSAGE =
  'Using proxies in the render phase would cause unexpected problems.'
export const SNAPSHOT_CALLBACK_MESSAGE = 'Better to just use proxy state'
export const UNEXPECTED_STATE_MUTATING =
  'Unexpected state mutating( I think we have to change that'

function outerMemberExpression(node) {
  if (node.parent.type !== 'MemberExpression') {
    return node
  }
  return outerMemberExpression(node.parent)
}
function isInSomething(node, thing) {
  if (node.parent && node.parent.type !== thing) {
    return isInSomething(node.parent, thing)
  } else if (node.parent && node.parent.type === thing) {
    return true
  }
  return false
}

function isInMemberExpression(node) {
  return isInSomething(node, 'MemberExpression')
}
function isInAssignmentExpression(node) {
  return (
    isInSomething(node, 'AssignmentExpression') ||
    isInSomething(node, 'UpdateExpression')
  )
}

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
function isSameMemmberExpression(first, second) {
  if (!first || !second) return false
  if (
    first.property.name === second.property.name ||
    first.property.value === second.property.value
  ) {
    if (
      first.object._babelType === 'MemberExpression' &&
      second.object._babelType === 'MemberExpression'
    ) {
      return isSameMemmberExpression(first.object, second.object)
    } else if (
      first.object.type === 'Identifier' &&
      second.object.type === 'Identifier'
    ) {
      return first.object.type === second.object.type
    }
  } else {
    return false
  }
  return false
}
function isUsedInUseProxy(node, scope) {
  let isUsed = false

  console.log(node.property && node.property.type === 'Literal', node)
  if (!scope) return isUsed

  scope.variables.forEach((variable) => {
    const def = variable.defs[0]
    if (!def || isUsed) return

    const init = def.node.init
    if (!init || !init.arguments) return

    if (
      (init.parent._babelType === 'CallExpression' &&
        init.parent.callee.name === 'useProxy') ||
      (init._babelType === 'CallExpression' && init.callee.name === 'useProxy')
    ) {
      if (
        init.arguments[0] &&
        init.arguments[0]._babelType === 'MemberExpression' &&
        node._babelType === 'MemberExpression'
      ) {
        console.log('here', init.arguments[0], node)

        return (isUsed = isSameMemmberExpression(node, init.arguments[0]))
      } else if (
        init.arguments[0].type === 'Identifier' &&
        node.type === 'Identifier' &&
        !isInMemberExpression(node)
      ) {
        console.log('here', init.arguments[0], node)
        return (isUsed = init.arguments[0].name === node.name)
      }
    }
  })
  isUsed && console.log('isUsed', isUsed, node)
  if (!isUsed && scope.upper)
    return (isUsed = isUsedInUseProxy(node, scope.upper))
  return isUsed
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
          (isInAssignmentExpression(node) &&
            !isInMemberExpression(node) &&
            isUsedInUseProxy(node, scope)) ||
          (isInAssignmentExpression(node) &&
            isInMemberExpression(node) &&
            ((outerMemberExpression(node).property === node &&
              isUsedInUseProxy(outerMemberExpression(node), scope)) ||
              (node.parent.object === node &&
                outerMemberExpression(node).property.type === 'Literal' &&
                isUsedInUseProxy(outerMemberExpression(node), scope))))
        ) {
          console.log(node)
          return context.report({
            node: node.parent.parent,
            message: UNEXPECTED_STATE_MUTATING,
          })
        }
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
