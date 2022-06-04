import { createComponentInstance, setupComponent } from './component'
import { ShapeFlags } from '../shared/ShapeFlags'
import { Fragment, Text } from './vnode'
import { createAppAPI } from './createApp'

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options

  function render(vnode, container) {
    patch(vnode, container, null)
  }

  function patch(vnode, container, parentComponent) {
    // 判断 vnode 是不是一个 element
    const { type, shapeFlag } = vnode

    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent)
        break
      case Text:
        processText(vnode, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 判断 当前 vnode 类型是组件。
          processComponent(vnode, container, parentComponent)
        }
        break
    }
  }

  function processFragment(vnode: any, container: any, parentComponent) {
    mountChildren(vnode, container, parentComponent)
  }

  function processText(vnode: any, container: any) {
    const { children } = vnode
    const textNode = (vnode.el = document.createTextNode(children))
    container.append(textNode)
  }

  function processComponent(vnode: any, container: any, parentComponent) {
    // 一开始 初始化 组件vnode
    mountComponent(vnode, container, parentComponent)
  }

  function processElement(vnode: any, container: any, parentComponent) {
    mountElement(vnode, container, parentComponent)
  }

  function mountElement(vnode: any, container, parentComponent) {
    // const el = (vnode.el = document.createElement(vnode.type))
    const el = (vnode.el = hostCreateElement(vnode.type))

    // children
    const { children, shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent)
    }

    // props
    const { props } = vnode
    for (const key in props) {
      const val = props[key]
      // const isOn = (key: string) => /^on[A-Z]/.test(key)
      // if (isOn(key)) {
      //   const event = key.slice(2).toLowerCase()
      //   el.addEventListener(event, val)
      // } else {
      //   el.setAttribute(key, val)
      // }
      hostPatchProp(el, key, val)
    }

    // container.append(el)
    hostInsert(el, container)
  }

  function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
      patch(v, container, parentComponent)
    })
  }

  function mountComponent(initialVnode: any, container, parentComponent) {
    // 创建组件实例
    const instance = createComponentInstance(initialVnode, parentComponent)

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
    patch(subTree, container, instance)
    initialVnode.el = subTree.el
  }
  return {
    createApp: createAppAPI(render),
  }
}
