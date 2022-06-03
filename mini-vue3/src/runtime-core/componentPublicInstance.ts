const publicPropertiesMap = {
  $el: (i) => i.vnode.el
}

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // 对于 setup 函数返回的对象
    const { setupState } = instance
    if(key in setupState) {
      return setupState[key]
    }
    // 对于 $el 的获取
    const publicGetter = publicPropertiesMap[key]
    if(publicGetter) {
      return publicGetter(instance)
    }
  }
}