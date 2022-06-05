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
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options

  function render(vnode, container) {
    patch(null, vnode, container, null, null)
  }
  // n1 老vnode
  // n2 新vnode
  function patch(n1, n2, container, parentComponent, anchor) {
    // 判断 vnode 是不是一个 element
    const { type, shapeFlag } = n2

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 判断 当前 vnode 类型是组件。
          processComponent(n1, n2, container, parentComponent, anchor)
        }
        break
    }
  }

  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountChildren(n2.children, container, parentComponent, anchor)
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children))
    container.append(textNode)
  }

  function processComponent(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 一开始 初始化 组件vnode
    mountComponent(n2, container, parentComponent, anchor)
  }

  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor)
    } else {
      patchElement(n1, n2, container, parentComponent, anchor)
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log('patchElement')
    console.log('n1', n1)
    console.log('n2', n2)

    // 获取旧新 vnode 的 props
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    // 更新的 vnode 走 patchElement 逻辑，并没有 el。
    const el = (n2.el = n1.el)
    patchChildren(n1, n2, el, parentComponent, anchor)
    patchProps(el, oldProps, newProps)
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const prevShapeFlag = n1.shapeFlag
    const c1 = n1.children
    const { shapeFlag } = n2
    const c2 = n2.children

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(n1.children)
      }
      if (c1 !== c2) {
        hostSetElementText(container, c2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '')
        mountChildren(n2.children, container, parentComponent, anchor)
      } else {
        patchKeyedChildren(c1, c2, container, parentComponent, anchor)
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    const l2 = c2.length
    let i = 0
    let e1 = c1.length - 1
    let e2 = l2 - 1

    function isSomeVNodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key
    }

    // 新旧 vnode 从左侧开始对比，直到停到不同 node 的下标。
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }
      i++
    }

    // 新旧 vnode 从右侧开始对比，直到停到不同 node 的下标。
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }

      e1--
      e2--
    }

    // 新的比老的多，多的 node 都在一端。
    if (i > e1) {
      if (i <= e2) {
        // 多的 node 在右端也就是末尾，锚点为 null，即在末端插入即可。
        // 多的 node 在左端也就是开头，锚点为 e2 + 1，即在相同开头 node 的前面插入。
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : null
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
      // 老的比新的多，多的 node 都在一端。
    } else if (i > e2) {
      // 直接循环删除即可。
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
      // 不同的 node 在中间。
    } else {
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el
      hostRemove(el)
    }
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

  function mountElement(vnode: any, container, parentComponent, anchor) {
    // const el = (vnode.el = document.createElement(vnode.type))
    const el = (vnode.el = hostCreateElement(vnode.type))

    // children
    const { children, shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, anchor)
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
    hostInsert(el, container, anchor)
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor)
    })
  }

  function mountComponent(
    initialVnode: any,
    container,
    parentComponent,
    anchor
  ) {
    // 创建组件实例
    const instance = createComponentInstance(initialVnode, parentComponent)

    // 配置组件实例 props slots setup()
    setupComponent(instance)
    setupRenderEffect(initialVnode, instance, container, anchor)
  }

  function setupRenderEffect(
    initialVnode: any,
    instance: any,
    container,
    anchor
  ) {
    effect(() => {
      if (!instance.isMounted) {
        console.log('init')

        const { proxy } = instance
        // 调用组件内部的 render 函数(用户传入的 render 函数)
        // 把 render 函数的 this 修改为代理对象
        const subTree = (instance.subTree = instance.render.call(proxy))
        // vnode -> DOM
        patch(null, subTree, container, instance, anchor)
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
        patch(prevSubTree, subTree, container, instance, anchor)
      }
    })
  }
  return {
    createApp: createAppAPI(render),
  }
}
