import { createComponentInstance, setupComponent } from './component'
import { ShapeFlags } from '../shared/ShapeFlags'
import { Fragment, Text } from './vnode'
import { createAppAPI } from './createApp'
import { effect } from '../reactivity/effect'
import { EMPTY_OBJ } from '../shared'
import { shouldUpdateComponent } from './componentUpdateUtil'
import { queueJobs } from './scheduler'

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
    if (!n1) {
      // 一开始 初始化 组件vnode
      mountComponent(n2, container, parentComponent, anchor)
    } else {
      // 更新 component
      updateComponent(n1, n2)
    }
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component)
    // 通过 props 判断需不需要更新
    if (shouldUpdateComponent(n1, n2)) {
      // 设置新 vnode
      // 执行更新逻辑
      instance.next = n2
      instance.update()
    } else {
      // 如果不需要更新，直接更换 vnode
      n2.el = n1.el
      instance.vnode = n2
    }
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
      let s1 = i
      let s2 = i

      const toBePatched = e2 - s2 + 1
      let patched = 0

      // newVnode: key -> Index 的映射，空间换时间，查找 O(1)。
      const keyToNewIndexMap = new Map()
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        keyToNewIndexMap.set(nextChild.key, i)
      }

      // newVnode: index -> oldVnode: index
      // 从新索引到旧索引的映射，查找旧索引中的最长递增子序列。
      // 该子序列中的元素相对位置保持不变，只去移动其他旧元素。
      const newIndexToOldIndexMap = new Array(toBePatched)
      let moved = false
      // 优化点：
      // 如果在删除逻辑查找 newIndex 的时候，index 是不断增大的,
      // 那么不需要去移动(查找最长递增子序列...)。
      let maxNewIndexSoFar = 0
      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]

        // 已经 patch 数量大于等于将去 patch 的数量。
        // 直接删除。
        if (patched >= toBePatched) {
          hostRemove(prevChild.el)
          continue
        }

        // 遍历老 vnode，找到对应新 vnode 中的 index。
        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          for (let j = s2; j <= e2; j++) {
            if (isSomeVNodeType(prevChild, c2[j])) {
              newIndex = j
              break
            }
          }
        }

        if (newIndex === undefined) {
          hostRemove(prevChild.el)
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }
          // 存储 newIndex -> oldIndex
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          patch(prevChild, c2[newIndex], container, parentComponent, null)
          patched++
        }
      }

      // 计算老 vnode index 的最长递增子序列，
      // 得到新 vnode index 下标。
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : []
      let j = increasingNewIndexSequence.length - 1

      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null

        if (newIndexToOldIndexMap[i] === 0) {
          // 值为 0，说明在旧 vnode 没有这个节点
          // 直接创建
          patch(null, nextChild, container, parentComponent, anchor)
        } else if (moved) {
          // 一旦最长递增子序列遍历完了
          // 或者最长递增子序列对应下标和实际遍历下标不一样
          // 执行移动逻辑
          // 否则j--继续遍历
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor)
          } else {
            j--
          }
        }
      }
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
    const instance = (initialVnode.component = createComponentInstance(
      initialVnode,
      parentComponent
    ))

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
    instance.update = effect(() => {
      if (!instance.isMounted) {
        console.log('init')

        const { proxy } = instance
        // 调用组件内部的 render 函数(用户传入的 render 函数)
        // 把 render 函数的 this 修改为代理对象
        const subTree = (instance.subTree = instance.render.call(proxy, proxy))
        // vnode -> DOM
        patch(null, subTree, container, instance, anchor)
        initialVnode.el = subTree.el

        instance.isMounted = true
      } else {
        console.log('update')

        // 更新 vnode 和 props
        const { next, vnode } = instance
        if (next) {
          next.el = vnode.el
          updateComponentPreRender(instance, next)
        }

        const { proxy } = instance
        // 调用组件内部的 render 函数(用户传入的 render 函数)
        // 把 render 函数的 this 修改为代理对象
        const subTree = instance.render.call(proxy, proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree

        // vnode -> DOM
        patch(prevSubTree, subTree, container, instance, anchor)
      }
    }, {
      scheduler() {
        console.log("scheduler")
        queueJobs(instance.update)
      }
    })
  }
  return {
    createApp: createAppAPI(render),
  }
}

function updateComponentPreRender(instance, nextVNode) {
  instance.vnode = nextVNode
  instance.next = null

  instance.props = nextVNode.props
}

function getSequence(arr) {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
