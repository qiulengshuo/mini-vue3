import { NodeTypes } from './ast'

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  // context: { source: content }
  // ast: { children: nodes[] }
  const context = createParserContext(content)
  return createRoot(parseChildren(context, []))
}

function createRoot(children) {
  return {
    children,
    type: NodeTypes.ROOT
  }
}

function parseChildren(context, ancestors) {
  const nodes: any = []

  // 如果没有遇到 结束标签 和 空字符串 就不断循环。
  while (!isEnd(context, ancestors)) {
    let node
    const s = context.source
    // 处理 模板字符串
    if (s.startsWith('{{')) {
      node = parseInterpolation(context)
    } else if (s[0] === '<') {
      // 处理 element 标签
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      }
    }

    // 没有命中上面两种，就去处理 text
    if (!node) {
      node = parseText(context)
    }

    nodes.push(node)
  }
  return nodes
}

function isEnd(context, ancestors) {
  const s = context.source
  // 遇到 结束标签 为 true
  if (s.startsWith('</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag
      if (startsWithEndTagOpen(s, tag)) {
        return true
      }
    }
  }
  // 遇到 空串 为 true
  return !s
}

function parseText(context: any) {
  let endIndex = context.source.length
  let endTokens = ['<', '{{']
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    if (index !== -1 && index < endIndex) {
      endIndex = index
    }
  }
  const content = parseTextData(context, endIndex)

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

function parseElement(context: any, ancestors) {
  // 处理 开始标签
  const element: any = parseTag(context, TagType.Start)
  ancestors.push(element)
  element.children = parseChildren(context, ancestors)
  ancestors.pop()
  if (startsWithEndTagOpen(context.source, element.tag)) {
    // 处理 结束标签
    parseTag(context, TagType.End)
  } else {
    throw new Error(`缺少结束标签:${element.tag}`)
  }

  return element
}

function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith('</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  )
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
