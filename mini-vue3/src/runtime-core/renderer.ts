import { createComponentInstance, setupComponent } from './component'
import { ShapeFlags } from '../shared/ShapeFlags'
import { Fragment, Text } from './vnode'
import { createAppAPI } from './createApp'
import { effect } from '../reactivity/effect'
import { EMPTY_OBJ } from '../shared'

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options

  function render(vnode, container) {
    patch(null, vnode, container, null)
  }
  // n1 老vnode
  // n2 新vnode
  function patch(n1, n2, container, parentComponent) {
    // 判断 vnode 是不是一个 element
    const { type, shapeFlag } = n2

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 判断 当前 vnode 类型是组件。
          processComponent(n1, n2, container, parentComponent)
        }
        break
    }
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2, container, parentComponent)
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children))
    container.append(textNode)
  }

  function processComponent(n1, n2: any, container: any, parentComponent) {
    // 一开始 初始化 组件vnode
    mountComponent(n2, container, parentComponent)
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent)
    } else {
      patchElement(n1, n2, container)
    }
  }

  function patchElement(n1, n2, container) {
    console.log('patchElement')
    console.log('n1', n1)
    console.log('n2', n2)

    // 获取旧新 vnode 的 props
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    // 更新 vnode 走 patchElement 逻辑，并没有 el。
    const el = (n2.el = n1.el)
    patchProps(el, oldProps, newProps)
  }

  function patchProps(el, oldProps, newProps) {
    // 旧新 props 对象不同，才去更新。
    if (oldProps !== newProps) {
      // 先在 newProps 对象里面遍历
      // 1. 两值不同，更新即可。
      // 2. 新 prop null 或 undefined，删除属性。
      // 3. 新增属性。
      for (const key in newProps) {
        const prevProp = oldProps[key]
        const nextProp = newProps[key]

        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp)
        }
      }

      // 再去 oldProps 对象里面遍历
      // 1. 只需要删除 newProps 对象里面没有的。
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
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
      hostPatchProp(el, key, null, val)
    }

    // container.append(el)
    hostInsert(el, container)
  }

  function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
      patch(null, v, container, parentComponent)
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
    effect(() => {
      if (!instance.isMounted) {
        console.log('init')

        const { proxy } = instance
        // 调用组件内部的 render 函数(用户传入的 render 函数)
        // 把 render 函数的 this 修改为代理对象
        const subTree = (instance.subTree = instance.render.call(proxy))
        // vnode -> DOM
        patch(null, subTree, container, instance)
        initialVnode.el = subTree.el

        instance.isMounted = true
      } else {
        console.log('update')

        const { proxy } = instance
        // 调用组件内部的 render 函数(用户传入的 render 函数)
        // 把 render 函数的 this 修改为代理对象
        const subTree = instance.render.call(proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree

        // vnode -> DOM
        patch(prevSubTree, subTree, container, instance)
      }
    })
  }
  return {
    createApp: createAppAPI(render),
  }
}
