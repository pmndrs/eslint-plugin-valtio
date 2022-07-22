export const callExpressions = ['JSXExpressionContainer', 'CallExpression']
export const functionTypes = ['ArrowFunctionExpression', 'FunctionExpression']
export const writingOpExpressionTypes = ['UpdateExpression']

/**
 * @param {any} node ASTNode to check
 * @param {string} thing Check if the node is inside a particular type of ASTNode
 *
 * @example
 *  // if `this` in the below example is the node and
 *  // you want to check if it's a function, then
 *
 * function a(){
 *  console.log(this)
 * }
 *
 *  isInSomething(thisNode,"FunctionExpression") // true
 *  isInSomething(thisNode,"ExpressionStatement") // false
 */
export function isInSomething(node, thing) {
  if (node.parent && node.parent.type !== thing) {
    return isInSomething(node.parent, thing)
  } else if (node.parent && node.parent.type === thing) {
    return true
  }
  return false
}

/**
 * @param {any} node ASTNode
 *
 * @example
 *
 * const stateOne = proxy({
 * count: 0,
 * inc: function () {
 *   ++state.count //<== taking node from here
 *  },
 * })
 *
 * nearestCalleeName(node) //=> "proxy" //<= proxy is the nearest callee
 */
export function nearestCalleeName(node) {
  if (!(node && node.parent)) {
    return false
  }
  const hasCallee = node.parent.callee
  if (!hasCallee) {
    return nearestCalleeName(node.parent)
  }

  const isCalleeIdentifier = node.parent.callee.type === 'Identifier'
  const isCalleeMember = node.parent.callee.type === 'MemberExpression'

  if (isCalleeIdentifier) {
    return node.parent.callee.name
  }

  if (isCalleeMember) {
    return node.parent.callee.property.name
  }

  return nearestCalleeName(node.parent)
}

/**
 * @param {any} node ASTNode to start from
 * @param {string} nodeType the type of ASTNode to look for
 *
 * @returns {any} ASTNode
 * @example
 *  // if `this` in the below example is the node and
 *  // you want to check if it's a function, then
 *
 * function a(){
 *  console.log(this)
 * }
 *
 *  getParentOfNodeType(thisNode,"FunctionExpression") // ASTNode.type: "FunctionExpression"
 *  getParentOfNodeType(thisNode,"ExpressionStatement") // null
 */
export function getParentOfNodeType(node, nodeType) {
  if (!node?.parent) {
    return null
  }

  if (node.parent && node.parent.type !== nodeType) {
    return getParentOfNodeType(node.parent, nodeType)
  } else if (node.parent && node.parent.type === nodeType) {
    return node.parent
  }
  return null
}

/**
 * @description check if the node is only being read
 * and not being used to manipulate state, recursively checks in the node is
 * in a member expression as well
 * @param {*} node
 */
export function isReadOnly(node) {
  if (writingOpExpressionTypes.indexOf(node.parent.type) > -1) {
    return false
  }

  if (node.parent.type === 'AssignmentExpression' && isLeftOfAssignment(node)) {
    return false
  }

  if (node.parent.type === 'MemberExpression') {
    return isReadOnly(node.parent)
  }

  if (node.parent.type === 'CallExpression') {
    return true
  }

  return true
}

/**
 * @param {*} node
 * @returns {boolean} true if the node is on the left
 * of an assignment expression aka being modified
 */
export function isLeftOfAssignment(node) {
  if (Object.is(node.parent.left, node)) {
    return true
  }

  return false
}

/**
 * @description get the closes call expression or function defintion
 * @param {*} node
 */
export function returnFirstCallback(node) {
  if (!node.parent || !node.parent.type) return false

  if (
    callExpressions.includes(node.parent.type) &&
    functionTypes.includes(node.type)
  ) {
    return node
  } else {
    return returnFirstCallback(node.parent)
  }
}

/**
 * @description find if the node belongs to a hook or not
 * @param {*} node - the node that might be inside a hook
 * @param {boolean} returnHook - whether to return the
 * resulting node or not
 * @returns {* | boolean} - either true/false or the CallExpression node that belongs to the hook
 */
export function isInReactHooks(node, returnHook = false) {
  const hookDef = getNearestHook(node)
  if (returnHook) {
    return hookDef
  }
  return hookDef ? true : false
}

function isReactPrimitive(node) {
  if (
    node.type === 'Identifier' &&
    (node.name === 'useEffect' || node.name === 'useCallback')
  ) {
    return true
  }

  if (node.type === 'MemberExpression') {
    const flatExpr = flattenMemberExpression(node)
    return flatExpr.endsWith('useEffect') || flatExpr.endsWith('useCallback')
  }

  return false
}

export function getNearestHook(node) {
  if (!node.parent || !node.parent.type) return false

  const parentCaller = getParentOfNodeType(node, 'CallExpression')
  if (!parentCaller) {
    return false
  }

  if (!isReactPrimitive(parentCaller.callee)) {
    return getNearestHook(parentCaller)
  }

  return parentCaller
}

/**
 * @description check if a node is part of the hook's dependencies,
 * currently checks in useEffect and useCallback based on `getHookDeps`
 * @param {*} node
 * @returns {boolean}
 */
export function isInReactHookDeps(node) {
  const hookNode = isInReactHooks(node, true)
  if (!hookNode) {
    return false
  }
  const allDepExpressions = getHookDeps(hookNode)

  let depPath
  if (node.parent.type === 'MemberExpression') {
    depPath = flattenMemberExpression(node.parent)
  } else {
    // TODO: need to make this an absolute check
    // based on future reports as it currently
    // assumes that the parent doesn't exist and it's just
    // an Identifier node
    depPath = (node.type === 'Identifier' && node.name) || false
  }

  if (!depPath) {
    return false
  }

  const flatDepPaths = []
  allDepExpressions.elements.forEach((exprNode) => {
    let exprPath
    if (exprNode.type === 'MemberExpression') {
      exprPath = flattenMemberExpression(exprNode)
    } else {
      exprPath = exprNode.name
    }
    flatDepPaths.push(exprPath)
  })

  return flatDepPaths.indexOf(depPath) > -1
}

/**
 * @description get array expression containing
 * all dependencies of a given hook parent node (CallExpression)
 * @param {*} node
 * @returns {boolean|*} false or array expression
 */
export function getHookDeps(hookNode) {
  if (!hookNode) {
    return false
  }

  if (hookNode.type !== 'CallExpression') {
    return false
  }

  if (
    !(
      hookNode.arguments.length == 2 &&
      hookNode.arguments[1] &&
      hookNode.arguments[1].type === 'ArrayExpression'
    )
  ) {
    return false
  }

  return hookNode.arguments[1]
}

/**
 * @description get the object path as a string for a given member expression
 * @param {*} expr - Member Expression
 * @param {*} key - the key across recursive functions
 * @returns {string} either a object path as string
 * or an empty string if nothing is found
 */
function flattenMemberExpression(expr, key = '') {
  if (expr.type !== 'MemberExpression') {
    return ''
  }
  if (expr.object.type === 'MemberExpression') {
    return flattenMemberExpression(expr.object, '') + expr.property.name
  }
  if (expr.object.type == 'Identifier') {
    let path = expr.object.name + '.' + expr.property.name
    if (key) {
      path += '.' + key
    }
    return path
  }
}

export function isDepthSameAsRootComponent(node) {
  const varDef = getParentOfNodeType(node, 'VariableDeclaration')
  const parentNormalFunc = getParentOfNodeType(varDef, 'FunctionDeclaration')
  const parentArrFunc = getParentOfNodeType(varDef, 'ArrowFunctionExpression')

  const parentFunc = parentNormalFunc || parentArrFunc
  if (!parentFunc) {
    return false
  }

  if (
    parentFunc?.parent.type === 'VariableDeclarator' &&
    parentFunc?.parent.parent.type === 'VariableDeclaration' &&
    parentFunc?.parent.parent.parent.type === 'Program'
  ) {
    return true
  }
}

export function isInCustomHookDef(node) {
  const nearestReturn = getParentOfNodeType(node, 'ReturnStatement')
  const returnInBlock = getParentOfNodeType(nearestReturn, 'BlockStatement')
  const normalFuncDef = getParentOfNodeType(
    returnInBlock,
    'ArrowFunctionExpression'
  )
  const arrowFuncDef = getParentOfNodeType(returnInBlock, 'FunctionExpression')

  const nearestFuncDef = normalFuncDef || arrowFuncDef || false

  if (!nearestFuncDef) {
    return false
  }

  const varDeclaratorOfFunc = getParentOfNodeType(
    nearestFuncDef,
    'VariableDeclarator'
  )
  const varDefOfFunc = getParentOfNodeType(
    varDeclaratorOfFunc,
    'VariableDeclaration'
  )

  const varDefOnRoot = varDefOfFunc.parent?.type === 'Program' || false

  return (
    varDefOnRoot &&
    varDeclaratorOfFunc.id?.type === 'Identifier' &&
    varDeclaratorOfFunc.id?.name.startsWith('use')
  )
}
