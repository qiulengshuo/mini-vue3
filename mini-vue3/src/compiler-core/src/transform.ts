import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING } from './runtimeHelpers'

export function transform(root, options = {}) {
  // 创建 全局上下文 context: { root, nodeTransforms, helpers, helper() }
  const context = createTransformContext(root, options)
  // 深度遍历 node
  traverseNode(root, context)
  // 创建 codegen 遍历的开始节点
  createRootCodegen(root)
  // 挂载需要用到的函数名
  root.helpers = [...context.helpers.keys()]
}

function createRootCodegen(root) {
  const child = root.children[0]
  // 如果 child 是 element 会把 codegen 开始遍历节点 放到 child 改进的 codegenNode。
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode
  } else {
    root.codegenNode = root.children[0]
  }
}

function createTransformContext(root, options) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1)
    },
  }
  return context
}

function traverseNode(node, context) {
  // 把每个节点传入到插件函数中
  const nodeTransforms = context.nodeTransforms
  const exitFns: any = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    // 执行 transformExpression 保存 transformElement transformText
    const onExit = transform(node, context)
    if (onExit) exitFns.push(onExit)
  }

  // 对三种类型进行处理
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context)
      break
    default:
      break
  }

  // 等到 node 所有 children 节点遍历一遍，transform 了一遍。
  // 再去 transformText 合并text和interpolation
  // 最后 transformElement 添加 element node 的 codegenNode
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}
// 遍历children dfs
function traverseChildren(node, context) {
  const children = node.children

  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    traverseNode(node, context)
  }
}
