export function isInSomething(node, thing) {
  if (node.parent && node.parent.type !== thing) {
    return isInSomething(node.parent, thing)
  } else if (node.parent && node.parent.type === thing) {
    return true
  }
  return false
}
