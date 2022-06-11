import { createVNodeCall, NodeTypes } from '../ast'

// transform 改进一个 element 类型的 node
export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // 处理 tag，方便后续 codegen
      const vnodeTag = `'${node.tag}'`

      // props
      let vnodeProps

      // children
      // <div>hi,{{message}}</div>
      // hi,{{message}} -> child: compound_expression
      const children = node.children
      let vnodeChildren = children[0]

      // 后续 codegen element 就去遍历这个 codegenNode
      node.codegenNode = createVNodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      )
    }
  }
}
