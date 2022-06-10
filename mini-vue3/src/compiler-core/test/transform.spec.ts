import { NodeTypes } from '../src/ast'
import { baseParse } from '../src/parse'
import { transform } from '../src/transform'

describe('transform', () => {
  it('happy path', () => {
    // 转换成 ast 树
    const ast = baseParse('<div>hi,{{message}}</div>')
    
    // transform 的时候 去修改 ast 树 的插件
    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content = node.content + ' mini-vue'
      }
    }
    transform(ast, {
      nodeTransforms: [plugin],
    })

    const nodeText = ast.children[0].children[0]
    expect(nodeText.content).toBe('hi, mini-vue')
  })
})
