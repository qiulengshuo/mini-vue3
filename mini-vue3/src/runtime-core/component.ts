import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { initProps } from './componentProps'
import { shallowReadonly } from '../reactivity/reactive'
import { emit } from './componentEmit'
import { initSlots } from './componentSlot'

export function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    emit: () => {},
  }
  // 柯里化先传 component 实例
  component.emit = emit.bind(null, component) as any
  return component
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props)
  initSlots(instance, instance.vnode.children)
  // 调用setup
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  // 得到组件配置对象
  const component = instance.type
  // 组件实例的代理对象，方便 render 函数内部通过 this.key 去获取值
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

  const { setup } = component
  if (setup) {
    // 设置 currentInstance 的值
    setCurrentInstance(instance)
    // { emit }
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    })
    // setup 函数调用完就置为 null，防止在其他地方被调用
    setCurrentInstance(null)
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

let currentInstance = null

export function setCurrentInstance(instance) {
  currentInstance = instance
}

export function getCurrentInstance() {
  return currentInstance
}
