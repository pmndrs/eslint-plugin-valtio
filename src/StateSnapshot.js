import {
  callExpressions,
  functionTypes,
  getParentOfNodeType,
  isFuncDepthSameAsRoot,
  isFunctionHookOrComponent,
  isInCustomHookDef,
  isInReactHookDeps,
  isInReactHooks,
  isInSomething,
  isReadOnly,
} from './lib/utils'

export const PROXY_RENDER_PHASE_MESSAGE =
  'Using proxies in the render phase would cause unexpected problems.'
export const SNAPSHOT_CALLBACK_MESSAGE = 'Better to just use proxy state.'
export const UNEXPECTED_STATE_MUTATING = `Mutating a proxy object itself. this might not be expected as it's not reactive.`
export const COMPUTED_DECLARATION_ORDER =
  'Not found, If a computed field deriving value is created from another computed, the computed source should be declared first.'

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

        if (isInComputed(node) && isInProperty(node)) {
          if (
            isInMemberExpression(node) &&
            returnFirstObjectIdentifier(outerMemberExpression(node)) ===
              node.name &&
            isComputedIdentifier(node, scope) &&
            returnComputedValues(node)[0].includes(
              returnSecondObjectIdentifier(outerMemberExpression(node))
            ) &&
            !returnComputedValues(node)[1].includes(
              returnSecondObjectIdentifier(outerMemberExpression(node))
            )
          ) {
            return context.report({
              node: outerMemberExpression(node),
              message: COMPUTED_DECLARATION_ORDER,
            })
          } else if (
            isInObjectPattern(node) &&
            isInParams(node) &&
            node.parent.key === node &&
            !returnComputedValues(node)[1].includes(node.name) &&
            returnComputedValues(node)[0].includes(node.name)
          ) {
            return context.report({
              node: node,
              message: COMPUTED_DECLARATION_ORDER,
            })
          }
        }

        if (
          (isInAssignmentExpression(node) &&
            !isInMemberExpression(node) &&
            isUsedInUseProxy(node, scope)) ||
          (isInAssignmentExpression(node) &&
            isInMemberExpression(node) &&
            ((outerMemberExpression(node).property === node &&
              isUsedInUseProxy(outerMemberExpression(node), scope)) ||
              (node.parent.object === node &&
                isLiteral(node) &&
                isUsedInUseProxy(outerMemberExpression(node), scope))))
        ) {
          return context.report({
            node: node.parent.parent,
            message: UNEXPECTED_STATE_MUTATING,
          })
        }
        if (
          node.parent.type === 'MemberExpression' &&
          node.parent.property === node
        ) {
          return
        }

        const kind = which(node.name, scope)

        if (kind === 'state') {
          if (isInRender(node)) {
            return context.report({
              node,
              message: PROXY_RENDER_PHASE_MESSAGE,
            })
          }
        }

        if (kind === 'snapshot') {
          // ignore the error if the snapshot
          // is just being read in the hook and is a part of the dependency array

          // Valids
          // - allowed to read at root level for computation (new hook / render level defs) , basically anything defined at the root of the component definition
          // [x] allowed to read in a useEffect and useCallback if added in deps

          // Invalids
          // [x] if being used in a callback that isn't useEffect or useCallback

          if (isReadOnly(node)) {
            // if in a callback that's not a hook def
            // FIXME: repetetive check, can be optimized
            if (
              isInCallback(node) &&
              !isInReactHooks(node) &&
              !isInCustomHookDef(node)
            ) {
              return context.report({
                node,
                message: SNAPSHOT_CALLBACK_MESSAGE,
              })
            }

            if (isInReactHooks(node) && !isInReactHookDeps(node)) {
              return context.report({
                node,
                message: SNAPSHOT_CALLBACK_MESSAGE,
              })
            }

            if (
              isFuncDepthSameAsRoot(node) ||
              isInJSXContainer(node) ||
              isInCustomHookDef(node)
            ) {
              return
            }
          } else {
            return context.report({
              node,
              message: SNAPSHOT_CALLBACK_MESSAGE,
            })
          }

          if (isInCallback(node) && !isInReactHooks(node)) {
            return context.report({
              node,
              message: SNAPSHOT_CALLBACK_MESSAGE,
            })
          }
        }
      },
    }
  },
}

function outerMemberExpression(node) {
  if (node.parent.type !== 'MemberExpression') {
    return node
  }
  return outerMemberExpression(node.parent)
}
// eslint-disable-next-line no-unused-vars
function outerObjectExpression(node) {
  if (node.parent.type !== 'ObjectExpression') {
    return node
  }
  return outerObjectExpression(node.parent)
}
function isInComputed(node) {
  if (
    node.parent &&
    node.parent.type === 'CallExpression' &&
    node.parent.callee.name === 'proxyWithComputed' &&
    node.parent.arguments[1] === node
  ) {
    return true
  } else if (node.parent) {
    return isInComputed(node.parent)
  }
  return false
}
function isInParams(node) {
  if (node.parent && node.parent.params && node.parent.params.includes(node)) {
    return true
  } else if (node.parent) {
    return isInParams(node.parent)
  }
  return false
}

function isInObjectPattern(node) {
  return isInSomething(node, 'ObjectPattern')
}

function returnComputedValues(node) {
  if (
    node.parent.parent &&
    node.parent.parent.type === 'CallExpression' &&
    node.parent.parent.callee.name === 'proxyWithComputed' &&
    node.parent.parent.arguments[1] === node.parent
  ) {
    return [
      node.parent.properties.map((v) => v.key.name),
      node.parent.properties
        .slice(0, node.parent.properties.indexOf(node) + 1)
        .map((v) => v.key.name),
    ]
  } else if (node.parent.parent) {
    return returnComputedValues(node.parent)
  }
  return []
}
function returnSecondObjectIdentifier(node) {
  if (
    node &&
    node.object.type === 'Identifier' &&
    node.property.type === 'Identifier'
  ) {
    return node.property.name
  } else if (
    node &&
    node.object.type === 'MemberExpression' &&
    node.property.type === 'Identifier'
  ) {
    return returnSecondObjectIdentifier(node.object)
  }
  return null
}
function returnFirstObjectIdentifier(node) {
  if (node && node.object.type === 'Identifier') {
    return node.object.name
  } else if (node && node.object.type === 'MemberExpression') {
    return returnFirstObjectIdentifier(node.object)
  }
  return null
}
function isComputedIdentifier(node, scope) {
  const firstIdentifier = returnFirstObjectIdentifier(
    outerMemberExpression(node)
  )

  let isIt = false
  if (!scope) {
    return false
  }
  scope.variables.forEach((variable) => {
    const def = variable.defs[0]
    if (!def || isIt) return

    const init = def.node.init

    if (init && init.type !== 'Parameter') return

    if (firstIdentifier === variable.name) {
      return (isIt = true)
    }
  })

  if (!isIt && scope.upper) {
    return (isIt = isComputedIdentifier(node, scope.upper))
  }

  return isIt
}
function isInMemberExpression(node) {
  return isInSomething(node, 'MemberExpression')
}
function isInProperty(node) {
  return isInSomething(node, 'Property')
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
      init.callee.name === 'useSnapshot'
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
      (first.object._babelType === 'MemberExpression' &&
        second.object._babelType === 'MemberExpression') ||
      (first.object.type === 'MemberExpression' &&
        second.object.type === 'MemberExpression')
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
  if (!scope) return isUsed

  scope.variables.forEach((variable) => {
    const def = variable.defs[0]
    if (!def || isUsed) return

    const init = def.node.init
    if (!init || !init.arguments) return

    if (
      (init.parent._babelType === 'CallExpression' &&
        init.parent.callee.name === 'useSnapshot') ||
      (init._babelType === 'CallExpression' &&
        init.callee.name === 'useSnapshot') ||
      (init.parent.type === 'CallExpression' &&
        init.parent.callee.name === 'useSnapshot') ||
      (init.type === 'CallExpression' && init.callee.name === 'useSnapshot')
    ) {
      if (
        (init.arguments.length > 0 &&
          init.arguments[0] &&
          init.arguments[0]._babelType === 'MemberExpression' &&
          node._babelType === 'MemberExpression') ||
        (init.arguments[0] &&
          init.arguments[0].type === 'MemberExpression' &&
          node.type === 'MemberExpression')
      ) {
        return (isUsed = isSameMemmberExpression(node, init.arguments[0]))
      } else if (
        init.arguments[0].type === 'Identifier' &&
        node.type === 'Identifier' &&
        !isInMemberExpression(node)
      ) {
        return (isUsed = init.arguments[0].name === node.name)
      }
    }
  })
  if (!isUsed && scope.upper) {
    return (isUsed = isUsedInUseProxy(node, scope.upper))
  }
  return isUsed
}

function isInCallback(node) {
  if (!node.parent || !node.parent.type) return false

  if (
    (callExpressions.includes(node.parent.type) &&
      functionTypes.includes(node.type)) ||
    (['VariableDeclarator'].includes(node.parent.type) &&
      functionTypes.includes(node.type))
  ) {
    if (!isFunctionHookOrComponent(node)) {
      return true
    }
  } else {
    return isInCallback(node.parent)
  }
}

// TODO: add in additional JSX Attribute checks to check if
// proxy is being used to update or read or write , reads should be avoided
// and write and update should be allowed.
function isInRender(node) {
  if (!node.parent || !node.parent.type) return false
  let nearestCallbackNode =
    getParentOfNodeType(node, 'ArrowFunctionExpression') ||
    getParentOfNodeType(node, 'FunctionExpression')

  if (!nearestCallbackNode) {
    return isInJSXContainer(node)
  }

  const isCallbackInJSX = isInJSXContainer(nearestCallbackNode)
  return isInJSXContainer(node) && !isCallbackInJSX
}

function isLiteral(node) {
  const memberExpression = outerMemberExpression(node)
  // backward support + handling for espree v6 + babel
  return (
    memberExpression.property.type === 'Literal' ||
    memberExpression.property.type === 'NumericLiteral'
  )
}

function isInJSXContainer(node) {
  return (
    isInSomething(node, 'JSXExpressionContainer') ||
    isInSomething(node, 'JSXElement')
  )
}

// function isInDeclaration(node) {
//   const _parentDeclaration = getParentOfNodeType(node, 'VariableDeclarator')

//   if (_parentDeclaration?.init?.callee?.name === 'useSnapshot') {
//     return true
//   }

//   return false
// }
