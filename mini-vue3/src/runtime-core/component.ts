export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
  }
  return component
}
export function setupComponent(instance) {
  // TODO
  // initProps()
  // initSlots()

  // 调用setup
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  // 得到组件配置对象
  const component = instance.type
  const { setup } = component
  if (setup) {
    const setupResult = setup()
    // 处理 setup 结果
    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance, setupResult: any) {
  // function Object
  // TODO function

  // 如果 setup 返回的结果是 对象
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
  const Component = instance.type
  // 挂载 render 到组件实例上来
  if (Component.render) {
    instance.render = Component.render
  }
}
