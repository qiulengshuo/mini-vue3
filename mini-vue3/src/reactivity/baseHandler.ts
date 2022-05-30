import { track, trigger } from './effect'
import { ReactiveFlags } from '../reactivity/reactive'

const get = createGetter()
const readonlyGet = createGetter(true)
const set = createSetter()

function createGetter(isReadonly = false) {
  return function get(target, key) {
    if (ReactiveFlags.IS_REACTIVE === key) {
      return !isReadonly
    } else if (ReactiveFlags.IS_READONLY === key) {
      return isReadonly
    }

    const res = Reflect.get(target, key)
    if (!isReadonly) {
      // 收集依赖
      track(target, key)
    }
    return res
  }
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value)
    // 派发更新
    trigger(target, key)
    return res
  }
}

export const mutableHandlers = {
  get,
  set,
}

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`key ${Object(key)}, 只读不能被修改`, target)
    return true
  },
}
