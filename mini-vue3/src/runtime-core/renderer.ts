import { createComponentInstance, setupComponent } from './component'
import { ShapeFlags } from '../shared/ShapeFlags'

export function render(vnode, container) {
  patch(vnode, container)
}

function patch(vnode, container) {
  // 判断 vnode 是不是一个 element
  const { shapeFlag } = vnode
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container)
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 判断 当前 vnode 类型是组件。
    processComponent(vnode, container)
  }
}
function processComponent(vnode: any, container: any) {
  // 一开始 初始化 组件vnode
  mountComponent(vnode, container)
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container)
}

function mountElement(vnode: any, container) {
  const el = (vnode.el = document.createElement(vnode.type))

  // children
  const { children, shapeFlag } = vnode
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el)
  }

  // props
  const { props } = vnode
  for (const key in props) {
    const val = props[key]
    el.setAttribute(key, val)
  }

  container.append(el)
}

function mountChildren(vnode, container) {
  vnode.children.forEach((v) => {
    patch(v, container)
  })
}

function mountComponent(initialVnode: any, container) {
  // 创建组件实例
  const instance = createComponentInstance(initialVnode)

  // 配置组件实例 props slots setup()
  setupComponent(instance)
  setupRenderEffect(initialVnode, instance, container)
}

function setupRenderEffect(initialVnode: any, instance: any, container) {
  const { proxy } = instance
  // 调用组件内部的 render 函数(用户传入的 render 函数)
  // 把 render 函数的 this 修改为代理对象
  const subTree = instance.render.call(proxy)
  // vnode -> DOM
  patch(subTree, container)
  initialVnode.el = subTree.el
}
