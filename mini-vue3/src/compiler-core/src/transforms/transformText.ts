import { NodeTypes } from '../ast'
import { isText } from '../utils'

// 改进一个 element 类型的 node 的 children。
// 如果 children 是 text + interpolation 就合成一个 compound_expression 类型的 node。
export function transformText(node) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node

      // children
      // <div>hi,{{message}}</div>
      // hi,{{message}} -> child: compound_expression
      let currentContainer
      for (let i = 0; i < children.length; i++) {
        const child = children[i]

        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j]
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                }
              }

              currentContainer.children.push(' + ')
              currentContainer.children.push(next)
              children.splice(j, 1)
              j--
            } else {
              currentContainer = undefined
              break
            }
          }
        }
      }
    }
  }
}
