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
 *
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
 *
 * @example
 *
 *const stateOne = proxy({
 * count: 0,
 * inc: function () {
 *   ++state.count //<== taking node from here
 *  },
 * })
 *
 * nearestCalleeName(node) //=> "proxy" //<= proxy is the nearest callee
 *
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
 *
 */
export function getParentOfNodeType(node, nodeType) {
  if (node.parent && node.parent.type !== nodeType) {
    return getParentOfNodeType(node.parent, nodeType)
  } else if (node.parent && node.parent.type === nodeType) {
    return node.parent
  }
  return null
}
