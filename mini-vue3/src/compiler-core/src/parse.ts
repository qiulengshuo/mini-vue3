import { NodeTypes } from './ast'

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  // context: { source: content }
  // ast: { children: nodes[] }
  const context = createParserContext(content)
  return createRoot(parseChildren(context))
}

function createRoot(children) {
  return {
    children,
  }
}

function parseChildren(context) {
  const nodes: any = []
  let node

  const s = context.source
  // 处理 模板字符串
  if (s.startsWith('{{')) {
    node = parseInterpolation(context)
  } else if (s[0] === '<') {
    // 处理 element 标签
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context)
    }
  }

  // 没有命中上面两种，就去处理 text
  if (!node) {
    node = parseText(context)
  }

  nodes.push(node)
  return nodes
}

function parseText(context: any) {
  const content = parseTextData(context, context.source.length)

  return {
    type: NodeTypes.TEXT,
    content,
  }
}

function parseTextData(context: any, length) {
  // 1. 获取值 2. 推进该值长度
  const content = context.source.slice(0, length)
  advanceBy(context, length)

  return content
}

function parseElement(context: any) {
  // 处理 开始标签
  const element = parseTag(context, TagType.Start)
  // 处理 结束标签
  parseTag(context, TagType.End)

  return element
}

function parseTag(context: any, type: TagType) {
  // <div></div>

  // 捕获 <div 和 </div
  const match: any = /^<\/?([a-z]*)/i.exec(context.source)
  const tag = match[1]

  // 跳过 <div 和 </div
  advanceBy(context, match[0].length)
  // 跳过 >
  advanceBy(context, 1)

  if (type === TagType.End) return

  return {
    type: NodeTypes.ELEMENT,
    tag,
  }
}

function parseInterpolation(context) {
  // {{    message     }}
  const openDelimiter = '{{'
  const closeDelimiter = '}}'

  // 获取 }} 中第一个 } 的下标，从 下标2 开始找。
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  )

  // 获取还没经过处理的 content 信息长度。
  const rawContentLength = closeIndex - openDelimiter.length

  // 去掉 {{
  advanceBy(context, openDelimiter.length)

  // 获取还没经过处理的 content 信息。
  const rawContent = parseTextData(context, rawContentLength)
  // 去掉多余模板字符串两边空格
  const content = rawContent.trim()

  // 跳过 整个模板字符串
  advanceBy(context, closeDelimiter.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  }
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length)
}

function createParserContext(content: string): any {
  return {
    source: content,
  }
}
