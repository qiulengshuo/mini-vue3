import { getCurrentInstance } from './component'

export function provide(key, value) {
  const currentInstance: any = getCurrentInstance()
  if (currentInstance) {
    // 只能在 setup 函数使用
    let { provides } = currentInstance
    const parentProvides = currentInstance.parent.provides
    // 如果当前 provides 和 parentProvides 相等，说明该层还没有 provide 过。
    // 创建一个对象，继承原型链。
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    // 设置值。
    provides[key] = value
  }
}

export function inject(key, defaultValue) {
  const currentInstance: any = getCurrentInstance()
  if (currentInstance) {
    // 从当前组件的父组件的 provides 开始找。
    const parentProvides = currentInstance.parent.provides
    if (key in parentProvides) {
      return parentProvides[key]
    } else if (defaultValue) {
      // 可能默认值是 函数 或 值。
      if (typeof defaultValue === 'function') {
        return defaultValue()
      }
      return defaultValue
    }
  }
}
