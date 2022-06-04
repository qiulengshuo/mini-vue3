import { createVNode } from './vnode'

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      // 根组件 初始化
      mount(rootContainer) {
        // 创建 vnode
        const vnode = createVNode(rootComponent)
        // render 拆箱
        render(vnode, rootContainer)
      },
    }
  }
}
