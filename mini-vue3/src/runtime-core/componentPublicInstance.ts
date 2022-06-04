import { hasOwn } from '../shared'

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots
}

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // 对于 setup 函数返回的对象
    const { setupState, props } = instance
    if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (hasOwn(props, key)) {
      return props[key]
    }

    // 对于 $el 的获取
    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  },
}
