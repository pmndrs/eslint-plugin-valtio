'use strict'

const functionTypes = ['ArrowFunctionExpression', 'FunctionExpression']
const callExpressions = ['JSXExpressionContainer', 'CallExpression']

function patternVars(node) {
  const vars = []

  if (node.type === 'Identifier') {
    vars.push(node.name)
  } else if (node.type === 'ObjectPattern') {
    node.properties.forEach((property) =>
      vars.push(...patternVars(property.value))
    )
  } else if (node.type === 'AssignmentPattern') {
    vars.push(...patternVars(node.left))
  } else if (node.type === 'ArrayPattern') {
    node.elements.forEach((element) => vars.push(...patternVars(element)))
  }

  return vars
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

function last(array) {
  return array[array.length - 1]
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
    const codePathSegmentStack = []
    return {
      onCodePathSegmentStart: (segment) => {
        segment.snapshots = []
        segment.states = []
        codePathSegmentStack.push(segment)
      },

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
            message:
              'Using proxies in the render phase would cause unexpected problems.',
          })
        }
        if (kind === 'snapshot' && isInCallback(node)) {
          return context.report({
            node,
            message: 'better to just use proxy state',
          })
        }
      },
      VariableDeclarator(node) {
        const lastSegment = last(codePathSegmentStack)
        const scope = context.getScope(node)

        const initKind = which(node.init.name, scope)
        const nodeKind = which(node.id.name, scope)

        if (initKind === 'state' || nodeKind === 'state') {
          return lastSegment.states.push(...patternVars(node.id))
        }
        if (initKind === 'snapshot' || nodeKind === 'snapshot') {
          lastSegment.snapshots.push(...patternVars(node.id))
        }
      },
    }
  },
}
