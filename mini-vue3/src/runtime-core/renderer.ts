import { createComponentInstance, setupComponent } from './component'
import { isObject } from '../shared'

export function render(vnode, container) {
  patch(vnode, container)
}

function patch(vnode, container) {
  // 判断 vnode 是不是一个 element
  if (typeof vnode.type === 'string') {
    processElement(vnode, container)
  } else if (isObject(vnode.type)) {
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
  const el = document.createElement(vnode.type)

  // children
  const { children } = vnode
  if (typeof children === 'string') {
    el.textContent = children
  } else if (Array.isArray(children)) {
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
  console.log(vnode)
  vnode.children.forEach((v) => {
    patch(v, container)
  })
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
