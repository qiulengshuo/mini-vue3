import { NodeTypes } from './ast'
import { helperMapName, TO_DISPLAY_STRING } from './runtimeHelpers'

export function generate(ast) {
  // 创建全局上下文 context: { push, code, helper }
  const context = createCodegenContext()
  const { push } = context
  // push (render 函数前导符)
  genFunctionPreamble(ast, context)
  // push (render函数)
  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')
  push(`function ${functionName}(${signature}){`)
  push('return ')
  // 遍历生成具体的code
  genNode(ast.codegenNode, context)
  push('}')

  return {
    code: context.code,
  }
}

function genFunctionPreamble(ast, context) {
  // 前导符：依赖函数的引入 + return
  const { push } = context
  const VueBinging = 'Vue'
  const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`
  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`)
  }
  push('\n')
  push('return ')
}

function createCodegenContext() {
  const context = {
    code: '',
    push(source) {
      context.code += source
    },
    helper(key) {
      return `_${helperMapName[key]}`
    },
  }
  return context
}

function genNode(node, context) {
  // 对三种类型的处理
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    default:
      break
  }
}

function genExpression(node, context) {
  const { push } = context
  push(`${node.content}`)
}

function genInterpolation(node, context) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  // 对 内部的表达式 的处理
  genNode(node.content, context)
  push(')')
}

function genText(node, context) {
  const { push } = context
  push(`'${node.content}'`)
}
