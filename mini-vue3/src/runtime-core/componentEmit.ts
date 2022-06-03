import { camelize, toHandlerKey } from '../shared'

export function emit(instance, event, ...args) {
  const { props } = instance
  // 转化传过来的回调key，变成实际回调的name，然后执行。
  const handlerName = toHandlerKey(camelize(event))
  const handler = props[handlerName]
  handler && handler(...args)
}
