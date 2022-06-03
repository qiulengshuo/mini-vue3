import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
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
  // 组件实例的代理对象，方便 render 函数内部通过 this.key 去获取值。
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

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
  instance.render = Component.render
}
