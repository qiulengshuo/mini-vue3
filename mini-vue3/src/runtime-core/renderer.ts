import { createComponentInstance, setupComponent } from './component'
export function render(vnode, container) {
  patch(vnode, container)
}

function patch(vnode, container) {
  // TODO 判断vnode 是不是一个 element
  // 是 element 那么就应该处理 element
  // 思考题： 如何去区分是 element 还是 component 类型呢？
  // processElement();

  // 判断 当前 vnode 类型是组件。
  processComponent(vnode, container)
}
function processComponent(vnode: any, container: any) {
  // 一开始 初始化 组件vnode
  mountComponent(vnode, container)
}

function mountComponent(vnode: any, container) {
  // 创建组件实例
  const instance = createComponentInstance(vnode)
  // 配置组件实例 props slots setup()
  setupComponent(instance)
  setupRenderEffect(instance, container)
}

function setupRenderEffect(instance: any, container) {
  // 调用组件内部的 render 函数(用户传入的 render 函数)
  const subTree = instance.render()
  // vnode -> DOM
  patch(subTree, container)
}
